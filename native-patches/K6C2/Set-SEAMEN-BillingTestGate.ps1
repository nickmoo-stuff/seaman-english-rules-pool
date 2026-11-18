#requires -Version 5.1
[CmdletBinding(SupportsShouldProcess=$true,ConfirmImpact='Medium')]
param(
    [Parameter(Mandatory=$true)][ValidateSet('EnableDebug','Off')][string]$Mode,
    [ValidateSet('Debug','Release')][string]$BuildVariant='Release',
    [string]$ProjectPath='C:\Users\Nick\Documents\SeamenPoolAndroid'
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if ($Mode -eq 'EnableDebug' -and $BuildVariant -ne 'Debug') { throw 'EnableDebug requires explicit -BuildVariant Debug. Release activation is forbidden. No changes made.' }
$root=(Resolve-Path -LiteralPath $ProjectPath).Path
$javaRoot=Join-Path $root 'android/app/src/main/java/com/seamenpool/billing'
$policy=Join-Path $javaRoot 'PurchaseTestPolicy.java'
function Assert-PlainPath([string]$Path) {
    $cursor=[IO.Path]::GetFullPath($Path)
    while ($cursor) {
        $item=Get-Item -LiteralPath $cursor -Force
        if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Linked/reparse paths require review: $Path. No changes made." }
        $cursor=[IO.Path]::GetDirectoryName($cursor)
    }
}
function Read-Text([string]$Path) {
    Assert-PlainPath $Path
    $raw=[IO.File]::ReadAllBytes($Path)
    if ($raw.Length -ge 2 -and (($raw[0] -eq 255 -and $raw[1] -eq 254) -or ($raw[0] -eq 254 -and $raw[1] -eq 255))) { throw "UTF-16 source requires review: $Path. No changes made." }
    $offset=0
    if ($raw.Length -ge 3 -and $raw[0] -eq 239 -and $raw[1] -eq 187 -and $raw[2] -eq 191) { $offset=3 }
    $decoder=New-Object Text.UTF8Encoding($false,$true)
    return $decoder.GetString($raw,$offset,($raw.Length-$offset))
}
function Normal([string]$Text) { return $Text.Replace("`r`n","`n") }
function Hash-Text([string]$Text) {
    $sha=[Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes((Normal $Text)))).Replace('-','').ToLowerInvariant() }
    finally { $sha.Dispose() }
}
function Code([string]$Text) {
    return [regex]::Replace([regex]::Replace($Text,'(?s)/\*.*?\*/',''),'(?m)//.*$','')
}
function Installed-Version([string]$Name) {
    $path=Join-Path $root "node_modules/$Name/package.json"
    if (Test-Path -LiteralPath $path) { return (Read-Text $path | ConvertFrom-Json).version }
    $json=Read-Text (Join-Path $root 'package-lock.json') | ConvertFrom-Json
    $entry=$json.packages.PSObject.Properties["node_modules/$Name"]
    if (!$entry) { throw "Cannot verify installed $Name. No changes made." }
    return $entry.Value.version
}
# This is an opt-in for a recognised existing wrapper, never an installer.
function Preflight {
    Assert-PlainPath $root
    $backupBase=Join-Path $root '.seamen-billing-test-backups'
    if (Test-Path -LiteralPath $backupBase) { Assert-PlainPath $backupBase }
    foreach ($item in @(Get-ChildItem (Join-Path $root 'android/app/src') -Recurse -Force)) {
        if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Linked source paths require review: $($item.FullName). No changes made." }
    }
    foreach ($name in @('@capacitor/core','@capacitor/android')) {
        if ((Installed-Version $name) -ne '8.5.2') { throw "Expected $name 8.5.2. No changes made." }
    }
    $app=Code (Read-Text (Join-Path $root 'android/app/build.gradle'))
    if ([regex]::Matches($app,'\bapplicationId\s*(?:=\s*)?[''"]com\.seamenpool\.game[''"]').Count -ne 1 -or $app -match 'applicationIdSuffix|productFlavors') { throw 'Expected one unchanged com.seamenpool.game applicationId without suffix/flavours. No changes made.' }
    $sdk=$app
    $variables=Join-Path $root 'android/variables.gradle'
    if (Test-Path -LiteralPath $variables) { $sdk += Code (Read-Text $variables) }
    $minimums=[regex]::Matches($sdk,'\bminSdk(?:Version)?\s*(?:=\s*)?(\d+)\b')
    if ($minimums.Count -eq 0) { throw 'Cannot verify minimum SDK 24. No changes made.' }
    foreach ($minimum in $minimums) { if ([int]$minimum.Groups[1].Value -lt 24) { throw 'Minimum SDK 24 required. No changes made.' } }
    $foundation=Code (Read-Text (Join-Path $root 'android/app/seamen-billing-foundation.gradle'))
    if ($foundation -notmatch 'com\.android\.billingclient:billing:9\.1\.0' -or $app -notmatch 'seamen-billing-foundation\.gradle') { throw 'Existing Billing 9.1.0 hook required. No changes made.' }
    # Unknown Gradle debugging expressions are rejected, not evaluated or rewritten.
    $gradles=@(Get-ChildItem (Join-Path $root 'android') -Recurse -File | Where-Object { $_.Name -match '\.gradle(?:\.kts)?$' -and $_.FullName -notmatch '[\\/](?:build|\.gradle)[\\/]' })
    foreach ($file in $gradles) {
        $code=Code (Read-Text $file.FullName)
        # Standard debug source set may explicitly enable debugging. No other
        # block may enable it. Nested/custom debugging configuration needs review.
        $code=[regex]::Replace($code,'\bdebug\s*\{[^{}]*\}',{param($m) $m.Value -replace '\b(?:isDebuggable|debuggable)\s*(?:=\s*)?true\b',''})
        $code=[regex]::Replace($code,'\b(?:isDebuggable|debuggable)\s*(?:=\s*)?false\b','')
        if ($code -match '(?i)debuggable') { throw "Unsupported or release-debuggable Gradle configuration: $($file.FullName). No changes made." }
    }
    $ns='http://schemas.android.com/apk/res/android'
    foreach ($file in @(Get-ChildItem (Join-Path $root 'android/app/src') -Recurse -Filter AndroidManifest.xml -File)) {
        $xml=New-Object Xml.XmlDocument; $xml.XmlResolver=$null; $xml.LoadXml((Read-Text $file.FullName))
        foreach ($application in @($xml.SelectNodes('/manifest/application'))) {
            if ($application.HasAttribute('debuggable',$ns)) {
                $value=$application.GetAttribute('debuggable',$ns)
                $debugManifest=Join-Path $root 'android/app/src/debug/AndroidManifest.xml'
                if ($value -ne 'false' -and !($value -eq 'true' -and $file.FullName -eq $debugManifest)) { throw "Unexpected/release manifest debugging setting: $($file.FullName). No changes made." }
            }
        }
    }
    $manifest=New-Object Xml.XmlDocument; $manifest.XmlResolver=$null; $manifest.LoadXml((Read-Text (Join-Path $root 'android/app/src/main/AndroidManifest.xml')))
    $billing=@($manifest.SelectNodes('/manifest/uses-permission') | Where-Object { $_.GetAttribute('name',$ns) -eq 'com.android.vending.BILLING' })
    if ($billing.Count -ne 1 -or $billing[0].HasAttribute('maxSdkVersion',$ns)) { throw 'Expected unrestricted BILLING permission. No changes made.' }
    $service=@($manifest.SelectNodes('/manifest/application/service') | Where-Object { $_.GetAttribute('name',$ns) -eq 'com.seamenpool.billing.BillingRetryJob' })
    if ($service.Count -ne 1 -or $service[0].GetAttribute('permission',$ns) -ne 'android.permission.BIND_JOB_SERVICE' -or $service[0].GetAttribute('exported',$ns) -ne 'true' -or $service[0].GetAttribute('enabled',$ns) -eq 'false' -or $service[0].HasAttribute('process',$ns) -or $service[0].HasAttribute('node','http://schemas.android.com/tools')) { throw 'Expected existing protected retry service. No changes made.' }
    $boot=@($manifest.SelectNodes('/manifest/uses-permission') | Where-Object { $_.GetAttribute('name',$ns) -eq 'android.permission.RECEIVE_BOOT_COMPLETED' })
    if ($boot.Count -ne 1) { throw 'Expected existing boot permission. No changes made.' }
    $known=Read-Text (Join-Path $PSScriptRoot 'approved-native-hashes.json') | ConvertFrom-Json
    if (@($known.PSObject.Properties).Count -ne 5) { throw 'Invalid approved-source inventory. No changes made.' }
    foreach ($entry in $known.PSObject.Properties) {
        if ($entry.Name -notmatch '^(SeamenBillingPlugin|SupporterBillingCore|PlayBillingClient|BillingRetryJob|PurchaseTestPolicy)\.java$') { throw 'Invalid source inventory name.' }
        $text=Read-Text (Join-Path $javaRoot $entry.Name)
        if ($entry.Name -eq 'PurchaseTestPolicy.java') { $text=$text.Replace('TEST_PURCHASES_ENABLED=true;','TEST_PURCHASES_ENABLED=false;') }
        if ((Hash-Text $text) -cne $entry.Value) { throw "Unrecognised native source: $($entry.Name). No changes made." }
    }
    $activities=@(Get-ChildItem (Join-Path $root 'android/app/src/main') -Recurse -Filter MainActivity.java -File)
    if ($activities.Count -ne 1) { throw 'Expected one existing MainActivity.java. No changes made.' }
    $activity=Code (Read-Text $activities[0].FullName)
    if ([regex]::Matches($activity,'registerPlugin\s*\(\s*(?:com\.seamenpool\.billing\.)?SeamenBillingPlugin\.class\s*\)').Count -ne 1 -or $activity -notmatch 'registerPlugin\s*\(\s*com\.seamenpool\.billing\.SeamenBillingPlugin\.class\s*\)') { throw 'Expected exactly one existing plugin registration. No changes made.' }
    foreach ($file in @(Get-ChildItem (Join-Path $root 'android/app/src') -Recurse -File | Where-Object { $_.Extension -in @('.java','.kt') -and $_.FullName -notmatch '[\\/](?:test|androidTest)[\\/]' })) {
        $code=Code (Read-Text $file.FullName)
        if ($code -notmatch '\bpackage\s+com\.seamenpool\.billing\b') { continue }
        foreach ($entry in $known.PSObject.Properties) {
            $name=[IO.Path]::GetFileNameWithoutExtension($entry.Name)
            if ($code -match ('\b(?:class|object|interface|enum)\s+'+$name+'\b') -and $file.FullName -ne (Join-Path $javaRoot $entry.Name)) { throw "Duplicate billing class: $($file.FullName). No changes made." }
        }
    }
}
Preflight
$text=Read-Text $policy
$oldValue=if ($text.Contains('TEST_PURCHASES_ENABLED=true;')) { 'true' } else { 'false' }
$newValue=if ($Mode -eq 'EnableDebug') { 'true' } else { 'false' }
if ($oldValue -eq $newValue) { Write-Output "Already $Mode; no files changed. Non-debuggable purchase launching remains blocked."; return }
if (!$PSCmdlet.ShouldProcess($policy,"Set authorised debug licence-test configuration to $newValue; retain FLAG_DEBUGGABLE guard")) { return }
$lockPath=Join-Path $root '.seamen-billing-test.lock'
$lock=$null; $temp=$null
try {
    $lock=New-Object IO.FileStream($lockPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
    Preflight
    if ((Read-Text $policy) -cne $text) { throw 'Policy changed during preflight. No source changes made; retry after review.' }
    $oldBytes=[IO.File]::ReadAllBytes($policy)
    $updated=$text.Replace("TEST_PURCHASES_ENABLED=$oldValue;","TEST_PURCHASES_ENABLED=$newValue;")
    $bom=$oldBytes.Length -ge 3 -and $oldBytes[0] -eq 239 -and $oldBytes[1] -eq 187 -and $oldBytes[2] -eq 191
    $enc=New-Object Text.UTF8Encoding($bom)
    $newBytes=[byte[]]($enc.GetPreamble()+$enc.GetBytes($updated))
    $backup=Join-Path $root ('.seamen-billing-test-backups/'+[DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffffffZ')+'-'+[Guid]::NewGuid().ToString('N'))
    [IO.Directory]::CreateDirectory($backup) | Out-Null
    [IO.File]::WriteAllBytes((Join-Path $backup 'PurchaseTestPolicy.java'),$oldBytes)
    $record=@{schema=1;configuration='authorised-debug-licence-test';mode=$Mode;buildVariant=$BuildVariant;path=$policy;before=(Hash-Text $text);after=(Hash-Text $updated);nonDebuggablePurchasesEnabled=$false}
    [IO.File]::WriteAllText((Join-Path $backup 'operation.json'),($record | ConvertTo-Json),(New-Object Text.UTF8Encoding($false)))
    $temp=$policy+'.k6c2-'+[Guid]::NewGuid().ToString('N')+'.tmp'
    [IO.File]::WriteAllBytes($temp,$newBytes)
    # Same-directory atomic replacement. Do not fall back to deleting the source.
    if ([Convert]::ToBase64String([IO.File]::ReadAllBytes($policy)) -cne [Convert]::ToBase64String($oldBytes)) { throw 'Policy changed before atomic replacement; source not overwritten. Backup retained.' }
    [IO.File]::Replace($temp,$policy,(Join-Path $backup 'atomic-before.java'))
    $temp=$null
    Write-Output "$Mode applied. Backup: $backup"
    Write-Output 'Only the native test constant changed. FLAG_DEBUGGABLE remains required; normal non-debuggable release purchases remain OFF.'
    Write-Output 'Use the existing debug build/sync workflow. This tool does not build, install, upload or purchase. Rebuild after switching OFF too.'
} finally {
    if ($temp -and (Test-Path -LiteralPath $temp)) { Remove-Item -LiteralPath $temp -Force }
    if ($null -ne $lock) { $lock.Dispose(); Remove-Item -LiteralPath $lockPath -Force }
}
