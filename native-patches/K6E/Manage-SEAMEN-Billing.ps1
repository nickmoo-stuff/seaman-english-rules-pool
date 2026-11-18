#requires -Version 5.1
[CmdletBinding(SupportsShouldProcess=$true,ConfirmImpact='Medium')]
param(
    [Parameter(Mandatory=$true)][ValidateSet('Install','Rollback','EnableDebug','Off','EnableProduction')][string]$Mode,
    [ValidateSet('Debug','Release')][string]$BuildVariant='Release',
    [switch]$ApproveProductionActivation,
    [string]$BackupPath,
    [string]$ProjectPath='C:\Users\Nick\Documents\SeamenPoolAndroid'
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if ($Mode -eq 'EnableDebug' -and $BuildVariant -ne 'Debug') { throw 'EnableDebug requires explicit -BuildVariant Debug. Release activation is forbidden. No changes made.' }
$root=(Resolve-Path -LiteralPath $ProjectPath).Path
if ($Mode -eq 'EnableProduction' -and (!$ApproveProductionActivation -or $BuildVariant -ne 'Release')) { throw 'Production activation requires separate approval, -ApproveProductionActivation and -BuildVariant Release. No changes made.' }
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
    $backupBase=Join-Path $root '.seamen-billing-k6e-backups'
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
    $guard=Join-Path $root 'android/app/seamen-billing-release-guard.gradle'
    $hook='apply from: "$projectDir/seamen-billing-release-guard.gradle"'
    $count=[regex]::Matches($foundation,'seamen-billing-release-guard\.gradle').Count
    if ($count -gt 1 -or ($count -eq 1 -and !$foundation.Contains($hook))) { throw 'Unexpected K6E release guard hook. No changes made.' }
    if (Test-Path -LiteralPath $guard) {
        if ((Normal (Read-Text $guard)) -cne (Normal (Read-Text (Join-Path $PSScriptRoot 'seamen-billing-release-guard.gradle')))) { throw 'Release guard differs; no changes made.' }
    } elseif ($Mode -notin @('Install','Rollback')) { throw 'Install the K6E release build guard first.' }
    if ($Mode -notin @('Install','Rollback') -and $count -ne 1) { throw 'Missing K6E release guard hook.' }
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
    if (@($known.PSObject.Properties).Count -ne 6) { throw 'Invalid approved-source inventory. No changes made.' }
    $legacy=Read-Text (Join-Path $PSScriptRoot 'legacy-native-hashes.json') | ConvertFrom-Json
    foreach ($entry in $known.PSObject.Properties) {
        if ($entry.Name -notmatch '^(SeamenBillingPlugin|SupporterBillingCore|PlayBillingClient|BillingRetryJob|PurchaseTestPolicy|ProductionPurchasePolicy)\.java$') { throw 'Invalid source inventory name.' }
        if ((Hash-Text (Read-Text (Join-Path $PSScriptRoot $entry.Name))) -cne $entry.Value) { throw "Bundled source differs or gate is not OFF: $($entry.Name). No changes made." }
        $path=Join-Path $javaRoot $entry.Name
        if (!(Test-Path -LiteralPath $path)) {
            if ($entry.Name -eq 'ProductionPurchasePolicy.java' -and $Mode -in @('Install','Rollback')) { continue }
            throw "Missing installed source $($entry.Name). Install K6E first."
        }
        $text=Read-Text $path
        $normal=$text.Replace('TEST_PURCHASES_ENABLED=true;','TEST_PURCHASES_ENABLED=false;').Replace('PRODUCTION_PURCHASES_ENABLED=true;','PRODUCTION_PURCHASES_ENABLED=false;')
        $hash=Hash-Text $normal
        if ($hash -ceq $entry.Value) { continue }
        if ($Mode -in @('Install','Rollback') -and $legacy.PSObject.Properties[$entry.Name] -and $hash -ceq $legacy.PSObject.Properties[$entry.Name].Value) { continue }
        throw "Unrecognised native source: $($entry.Name). No changes made."
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
function Target-Path([string]$Name) {
    if ($Name -in @('seamen-billing-release-guard.gradle','seamen-billing-foundation.gradle')) { return Join-Path $root ('android/app/'+$Name) }
    return Join-Path $javaRoot $Name
}
function Encode-Like([byte[]]$Old,[string]$Text) {
    $bom=$null -ne $Old -and $Old.Length -ge 3 -and $Old[0] -eq 239 -and $Old[1] -eq 187 -and $Old[2] -eq 191
    $encoder=New-Object Text.UTF8Encoding($bom)
    return [byte[]]($encoder.GetPreamble()+$encoder.GetBytes($Text))
}
function Raw-Hash([byte[]]$Bytes) {
    $sha=[Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($sha.ComputeHash($Bytes)).Replace('-','').ToLowerInvariant() } finally {$sha.Dispose()}
}
Preflight
$names=@('SeamenBillingPlugin.java','SupporterBillingCore.java','PlayBillingClient.java','BillingRetryJob.java','PurchaseTestPolicy.java','ProductionPurchasePolicy.java','seamen-billing-release-guard.gradle','seamen-billing-foundation.gradle')
$testOn=(Read-Text $policy).Contains('TEST_PURCHASES_ENABLED=true;')
$production=Join-Path $javaRoot 'ProductionPurchasePolicy.java'
$productionOn=(Test-Path -LiteralPath $production) -and (Read-Text $production).Contains('PRODUCTION_PURCHASES_ENABLED=true;')
if ($Mode -eq 'Install' -and ($testOn -or $productionOn)) { throw 'Turn both gates OFF before installing. No changes made.' }
if ($Mode -eq 'EnableDebug' -and $productionOn) { throw 'Turn production OFF first. No changes made.' }
if ($Mode -eq 'EnableProduction') {
    if ($testOn) { throw 'Turn debug testing OFF first. No changes made.' }
    # Activation requires the actual synced release web tree, never a developer build.
    $web=Read-Text (Join-Path $root 'www/game.js')
    $synced=Read-Text (Join-Path $root 'android/app/src/main/assets/public/game.js')
    if ($web -notmatch "const BUILD_MODE='release'" -or $web -cne $synced) { throw 'Production activation requires matching synced release-mode www and Android assets. No changes made.' }
}
$plan=@()
if ($Mode -eq 'Rollback') {
    if (!$BackupPath) { throw 'Rollback requires -BackupPath from the Install command.' }
    $folder=(Resolve-Path -LiteralPath $BackupPath).Path
    $prefix=[IO.Path]::GetFullPath((Join-Path $root '.seamen-billing-k6e-backups'))+[IO.Path]::DirectorySeparatorChar
    if (!$folder.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)) { throw 'Backup must be inside this wrapper K6E backup directory.' }
    Assert-PlainPath $folder
    $record=Read-Text (Join-Path $folder 'operation.json') | ConvertFrom-Json
    if ($record.schema -ne 1 -or $record.mode -ne 'Install' -or $record.project -cne $root) { throw 'Expected an installation backup for this exact project.' }
    if (@($record.files | Select-Object -ExpandProperty name -Unique).Count -ne @($record.files).Count) { throw 'Duplicate backup records.' }
    foreach ($item in $record.files) {
        if ($item.name -notin $names) { throw 'Unexpected backup filename.' }
        if (!$item.beforePresent -and $item.name -notin @('ProductionPurchasePolicy.java','seamen-billing-release-guard.gradle')) { throw 'Invalid absent-source backup record.' }
        $path=Target-Path $item.name
        $old=$null
        if ($item.beforePresent) {
            $backupFile=Join-Path $folder $item.name
            Assert-PlainPath $backupFile
            $old=[IO.File]::ReadAllBytes($backupFile)
            if ((Raw-Hash $old) -cne $item.beforeHash) { throw 'Backup checksum mismatch.' }
            $normal=(New-Object Text.UTF8Encoding($false,$true)).GetString($old).TrimStart([char]0xfeff)
            if ($item.name.EndsWith('.java')) {
                $known=Read-Text (Join-Path $PSScriptRoot 'approved-native-hashes.json') | ConvertFrom-Json
                $legacy=Read-Text (Join-Path $PSScriptRoot 'legacy-native-hashes.json') | ConvertFrom-Json
                $h=Hash-Text $normal
                if ($h -cne $known.PSObject.Properties[$item.name].Value -and (!$legacy.PSObject.Properties[$item.name] -or $h -cne $legacy.PSObject.Properties[$item.name].Value)) { throw 'Unrecognised backup source.' }
            }
            if ($normal.Contains('TEST_PURCHASES_ENABLED=true;') -or $normal.Contains('PRODUCTION_PURCHASES_ENABLED=true;')) { throw 'Rollback cannot activate a purchase gate.' }
        }
        $current=$null
        if (Test-Path -LiteralPath $path) { Assert-PlainPath $path; $current=[IO.File]::ReadAllBytes($path) }
        if (($null -eq $old -and $null -eq $current) -or ($null -ne $old -and $null -ne $current -and (Raw-Hash $old) -ceq (Raw-Hash $current))) { continue }
        if ($null -eq $current -or (Raw-Hash $current) -cne $item.afterHash) { throw 'Installed file changed since installation; rollback refused.' }
        $plan+=@{Name=$item.name;Path=$path;Old=$current;Bytes=$old}
    }
} else {
    foreach ($name in $names) {
        if ($Mode -ne 'Install' -and !$name.EndsWith('.java')) { continue }
        $path=Target-Path $name
        $old=$null; $text=''
        if (Test-Path -LiteralPath $path) { $old=[IO.File]::ReadAllBytes($path); $text=Read-Text $path }
        $updated=$text
        if ($Mode -eq 'Install') {
            if ($name -eq 'seamen-billing-foundation.gradle') {
                $updated=$text
                if (!$text.Contains('seamen-billing-release-guard.gradle')) { $updated=$text+"`n"+'apply from: "$projectDir/seamen-billing-release-guard.gradle"'+"`n" }
            } else { $updated=Read-Text (Join-Path $PSScriptRoot $name) }
            if ($text.Contains("`r`n")) { $updated=$updated.Replace("`r`n","`n").Replace("`n","`r`n") }
        } elseif ($name -eq 'PurchaseTestPolicy.java') {
            if ($Mode -eq 'Off') { $updated=$text.Replace('TEST_PURCHASES_ENABLED=true;','TEST_PURCHASES_ENABLED=false;') }
            if ($Mode -eq 'EnableDebug') { $updated=$text.Replace('TEST_PURCHASES_ENABLED=false;','TEST_PURCHASES_ENABLED=true;') }
        } elseif ($name -eq 'ProductionPurchasePolicy.java') {
            if ($Mode -eq 'Off') { $updated=$text.Replace('PRODUCTION_PURCHASES_ENABLED=true;','PRODUCTION_PURCHASES_ENABLED=false;') }
            if ($Mode -eq 'EnableProduction') { $updated=$text.Replace('PRODUCTION_PURCHASES_ENABLED=false;','PRODUCTION_PURCHASES_ENABLED=true;') }
        }
        $bytes=Encode-Like $old $updated
        if ($null -ne $old -and (Raw-Hash $old) -ceq (Raw-Hash $bytes)) { continue }
        $plan+=@{Name=$name;Path=$path;Old=$old;Bytes=$bytes}
    }
}
if (!$plan.Count) { Write-Output "Already $Mode; no files changed."; return }
if (!$PSCmdlet.ShouldProcess($root,"K6E $Mode; scoped native files only; preserve separate debug and production permissions")) { return }
$lockPath=Join-Path $root '.seamen-billing-k6e.lock'; $lock=$null; $changed=@(); $temporary=$null
try {
    $lock=New-Object IO.FileStream($lockPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
    Preflight
    foreach ($item in $plan) {
        if ($null -eq $item.Old) { if (Test-Path -LiteralPath $item.Path) { throw 'File appeared during preflight.' } }
        elseif (!(Test-Path -LiteralPath $item.Path) -or (Raw-Hash ([IO.File]::ReadAllBytes($item.Path))) -cne (Raw-Hash $item.Old)) { throw 'Source changed during preflight.' }
    }
    $backup=Join-Path $root ('.seamen-billing-k6e-backups/'+[DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffffffZ')+'-'+[Guid]::NewGuid().ToString('N'))
    [IO.Directory]::CreateDirectory($backup) | Out-Null
    $records=@()
    foreach ($item in $plan) {
        $beforeHash=$null; $afterHash=$null
        if ($null -ne $item.Old) { [IO.File]::WriteAllBytes((Join-Path $backup $item.Name),$item.Old); $beforeHash=Raw-Hash $item.Old }
        if ($null -ne $item.Bytes) { $afterHash=Raw-Hash $item.Bytes }
        $records+=@{name=$item.Name;beforePresent=($null -ne $item.Old);beforeHash=$beforeHash;afterHash=$afterHash}
    }
    $record=@{schema=1;mode=$Mode;project=$root;configuration='K6E-native-build-policy';files=$records}
    [IO.File]::WriteAllText((Join-Path $backup 'operation.json'),($record | ConvertTo-Json -Depth 5),(New-Object Text.UTF8Encoding($false)))
    foreach ($item in $plan) {
        $changed+=,$item
        if ($null -eq $item.Bytes) { Remove-Item -LiteralPath $item.Path; continue }
        $temporary=$item.Path+'.k6e-'+[Guid]::NewGuid().ToString('N')+'.tmp'
        [IO.File]::WriteAllBytes($temporary,$item.Bytes)
        if ($null -eq $item.Old) { [IO.File]::Move($temporary,$item.Path) }
        else { [IO.File]::Replace($temporary,$item.Path,(Join-Path $backup ('atomic-'+$item.Name))) }
        $temporary=$null
    }
    Write-Output "$Mode completed. Backup: $backup"
    Write-Output 'No web, manifest, registration, signing, build types or version values changed. Install adds only the scoped release-verification Gradle hook; rollback restores it. Rebuild with the existing workflow; an installed APK does not change until rebuilt/reinstalled.'
} catch {
    $failure=$_.Exception.Message; $errors=@()
    foreach ($item in $changed) {
        try { if ($null -eq $item.Old) { if (Test-Path -LiteralPath $item.Path) { Remove-Item -LiteralPath $item.Path } } else { [IO.File]::WriteAllBytes($item.Path,$item.Old) } }
        catch { $errors+= $item.Path }
    }
    if ($errors.Count) { throw "Failed: $failure. Manual recovery needed from $backup for: $($errors -join ', ')" }
    throw "Operation failed; scoped source changes rolled back. $failure"
} finally {
    if ($temporary -and (Test-Path -LiteralPath $temporary)) { Remove-Item -LiteralPath $temporary -Force }
    if ($null -ne $lock) { $lock.Dispose(); Remove-Item -LiteralPath $lockPath -Force }
}
