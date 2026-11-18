#requires -Version 5.1
[CmdletBinding(SupportsShouldProcess = $true)]
param([string]$ProjectPath = 'C:\Users\Nick\Documents\SeamenPoolAndroid')
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath $ProjectPath).Path
$javaRoot = Join-Path $root 'android/app/src/main/java/com/seamenpool/billing'
function Read-Utf8([string]$Path) {
    $bytes = [IO.File]::ReadAllBytes($Path)
    if ($bytes.Length -ge 2 -and (($bytes[0] -eq 255 -and $bytes[1] -eq 254) -or ($bytes[0] -eq 254 -and $bytes[1] -eq 255))) {
        throw "UTF-16 file requires manual review; no changes made: $Path"
    }
    return [IO.File]::ReadAllText($Path, (New-Object Text.UTF8Encoding($false, $true)))
}
function Encode-Like([string]$Path, [string]$Text) {
    $old = [IO.File]::ReadAllBytes($Path)
    $bom = $old.Length -ge 3 -and $old[0] -eq 239 -and $old[1] -eq 187 -and $old[2] -eq 191
    $enc = New-Object Text.UTF8Encoding($bom)
    return [byte[]]($enc.GetPreamble() + $enc.GetBytes($Text))
}
function Installed-Version([string]$Name) {
    $path = Join-Path $root "node_modules/$Name/package.json"
    if (Test-Path -LiteralPath $path) { return (Read-Utf8 $path | ConvertFrom-Json).version }
    $lock = Join-Path $root 'package-lock.json'
    if (Test-Path -LiteralPath $lock) {
        $json = Read-Utf8 $lock | ConvertFrom-Json
        if ($json.PSObject.Properties['packages']) {
            $entry = $json.packages.PSObject.Properties["node_modules/$Name"]
            if ($entry) { return $entry.Value.version }
        }
    }
    throw "Cannot verify $Name from the existing project metadata. No changes made; retain this error for review."
}


function Normal([string]$Text) { return $Text.Replace("`r`n", "`n").TrimEnd() }
function Text-Hash([string]$Text) {
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes((Normal $Text)))).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}
foreach ($name in @('@capacitor/core','@capacitor/android')) {
    if ((Installed-Version $name) -ne '8.5.2') { throw "Expected $name 8.5.2; no changes made." }
}
$foundation = Join-Path $root 'android/app/seamen-billing-foundation.gradle'
$gradlePath = Join-Path $root 'android/app/build.gradle'
if (!(Test-Path $foundation) -or (Read-Utf8 $foundation) -notmatch 'com\.android\.billingclient:billing:9\.1\.0' -or (Read-Utf8 $gradlePath) -notmatch 'seamen-billing-foundation\.gradle') { throw 'Expected installed K3F.1 Billing 9.1.0 dependency/hook; no changes made.' }
$sdkText = Read-Utf8 $gradlePath
$variables = Join-Path $root 'android/variables.gradle'
if (Test-Path $variables) { $sdkText += Read-Utf8 $variables }
$minMatches = [regex]::Matches($sdkText, '(?m)^\s*minSdk(?:Version)?\s*(?:=|\s)\s*(\d+)\b')
if ($minMatches.Count -eq 0) { throw 'Cannot verify minimum SDK 24. Supply Gradle/variables files; no changes made.' }
foreach ($match in $minMatches) { if ([int]$match.Groups[1].Value -lt 24) { throw 'This integration requires minimum SDK 24; no SDK settings were changed.' } }
function Without-Comments([string]$Text) {
    $clean = [regex]::Replace($Text, '(?s)/\*.*?\*/', '')
    return [regex]::Replace($clean, '(?m)//.*$', '')
}
$activities = @(Get-ChildItem (Join-Path $root 'android/app/src/main') -Recurse -Filter 'MainActivity.java' -File)
if ($activities.Count -ne 1) { throw 'Expected one existing MainActivity.java; no changes made.' }
$activityText = Without-Comments (Read-Utf8 $activities[0].FullName)
$registrations = [regex]::Matches($activityText, 'registerPlugin\s*\(\s*(?:com\.seamenpool\.billing\.)?SeamenBillingPlugin\.class\s*\)')
if ($registrations.Count -ne 1 -or $activityText -notmatch 'registerPlugin\s*\(\s*com\.seamenpool\.billing\.SeamenBillingPlugin\.class\s*\)') { throw 'Expected exactly one existing SeamenBilling plugin registration; missing/duplicate/custom registration needs review. No changes made.' }
$billingNames = @('SeamenBillingPlugin','SupporterBillingCore','PlayBillingClient','BillingRetryJob','PurchaseTestPolicy')
$nativeFiles = @(Get-ChildItem (Join-Path $root 'android/app/src') -Recurse -File | Where-Object { ($_.Extension -eq '.java' -or $_.Extension -eq '.kt') -and $_.FullName -notmatch '[\\/](?:test|androidTest)[\\/]' })
foreach ($file in $nativeFiles) {
    $code = Without-Comments (Read-Utf8 $file.FullName)
    if ($code -notmatch '(?m)^\s*package\s+com\.seamenpool\.billing\s*(?:;|$)') { continue }
    foreach ($className in $billingNames) {
        if ($code -match ('(?m)(?:^|;)\s*(?:(?:public|final|abstract|internal|open|data|sealed)\s+)*class\s+' + $className + '\b')) {
            $expected = Join-Path $javaRoot ($className + '.java')
            if ([IO.Path]::GetFullPath($file.FullName) -cne [IO.Path]::GetFullPath($expected)) { throw "Duplicate/conflicting billing class $className at $($file.FullName). No changes made." }
        }
    }
}
$policySource = Without-Comments (Read-Utf8 (Join-Path $PSScriptRoot 'PurchaseTestPolicy.java'))
if ($policySource -notmatch '(?m)^\s*private\s+static\s+final\s+boolean\s+TEST_PURCHASES_ENABLED\s*=\s*false\s*;') { throw 'Bundled debug purchase gate is not OFF. No changes made.' }
# Native-only patch: ordinary deployment retains responsibility for web copy,
# sync, versionName/versionCode, build and installation. No web overlay is required.
$known = Read-Utf8 (Join-Path $PSScriptRoot 'supported-baseline-hashes.json') | ConvertFrom-Json
$plan = @()
foreach ($name in @('SeamenBillingPlugin.java','SupporterBillingCore.java','PlayBillingClient.java','BillingRetryJob.java','PurchaseTestPolicy.java')) {
    $source = Join-Path $PSScriptRoot $name
    $target = Join-Path $javaRoot $name
    $newText = Read-Utf8 $source
    if (Test-Path $target) {
        $oldText = Read-Utf8 $target
        if ((Normal $oldText) -ceq (Normal $newText)) { continue }
        if (!$known.PSObject.Properties[$name] -or (Text-Hash $oldText) -ne $known.PSObject.Properties[$name].Value) { throw "Existing $target differs from the supported K3H.1 baseline/new K6A source; no files will be overwritten." }
        if ($oldText.Contains("`r`n")) { $newText = $newText.Replace("`r`n", "`n").Replace("`n", "`r`n") }
        $plan += [pscustomobject]@{Path=$target;Bytes=(Encode-Like $target $newText);Old=[IO.File]::ReadAllBytes($target)}
    } else {
        if ($name -eq 'SeamenBillingPlugin.java') { throw 'Install K3H.1 before this upgrade; no wrapper is generated.' }
        $plan += [pscustomobject]@{Path=$target;Bytes=[IO.File]::ReadAllBytes($source);Old=$null}
    }
}
$manifestPath = Join-Path $root 'android/app/src/main/AndroidManifest.xml'
$text = Read-Utf8 $manifestPath
[xml]$xml = $text
$androidNs = 'http://schemas.android.com/apk/res/android'
$toolsNs = 'http://schemas.android.com/tools'
if ($xml.DocumentElement.GetAttribute('xmlns:android') -ne $androidNs) { throw 'Unexpected manifest namespace; no changes made.' }
foreach ($permission in @('com.android.vending.BILLING','android.permission.RECEIVE_BOOT_COMPLETED')) {
    $nodes = @($xml.DocumentElement.SelectNodes('uses-permission') | Where-Object { $_.GetAttribute('name',$androidNs) -eq $permission })
    if ($nodes.Count -gt 1) { throw 'Duplicate permission requires review; no changes made.' }
    if ($nodes.Count -eq 1 -and ($nodes[0].HasAttribute('node',$toolsNs) -or $nodes[0].HasAttribute('maxSdkVersion',$androidNs))) { throw 'Overridden/restricted permission requires review; no changes made.' }
    if ($permission -eq 'com.android.vending.BILLING' -and $nodes.Count -ne 1) { throw 'K3F.1 BILLING permission is missing; no changes made.' }
}
$nl = "`n"
if ($text.Contains("`r`n")) { $nl = "`r`n" }
$boot = @($xml.DocumentElement.SelectNodes('uses-permission') | Where-Object { $_.GetAttribute('name',$androidNs) -eq 'android.permission.RECEIVE_BOOT_COMPLETED' })
if (!$boot.Count) {
    $matchesApp = [regex]::Matches($text, '(?m)^([ \t]*)<application\b')
    if ($matchesApp.Count -ne 1) { throw 'Custom manifest layout requires review; no changes made.' }
    $text = $text.Insert($matchesApp[0].Index,$matchesApp[0].Groups[1].Value + '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />' + $nl + $nl)
}
$services = @($xml.SelectNodes('/manifest/application/service') | Where-Object { $_.GetAttribute('name',$androidNs) -eq 'com.seamenpool.billing.BillingRetryJob' })
if ($services.Count -gt 1) { throw 'Duplicate retry service requires review; no changes made.' }
if ($services.Count -eq 1) {
    $service = $services[0]
    if ($service.GetAttribute('permission',$androidNs) -ne 'android.permission.BIND_JOB_SERVICE' -or $service.GetAttribute('exported',$androidNs) -ne 'true' -or $service.HasAttribute('node',$toolsNs) -or $service.HasAttribute('process',$androidNs) -or $service.GetAttribute('enabled',$androidNs) -eq 'false') { throw 'Existing retry-service configuration conflicts; no changes made.' }
} else {
    $closing = [regex]::Matches($text, '(?m)^([ \t]*)</application>')
    if ($closing.Count -ne 1) { throw 'Custom application manifest layout requires review; no changes made.' }
    $line = $closing[0].Groups[1].Value + '    <service android:name="com.seamenpool.billing.BillingRetryJob" android:permission="android.permission.BIND_JOB_SERVICE" android:exported="true" />' + $nl
    $text = $text.Insert($closing[0].Index,$line)
}
[xml]$validated = $text
$oldManifest = Read-Utf8 $manifestPath
if ($text -cne $oldManifest) { $plan += [pscustomobject]@{Path=$manifestPath;Bytes=(Encode-Like $manifestPath $text);Old=[IO.File]::ReadAllBytes($manifestPath)} }
if ($plan.Count -eq 0) { Write-Output 'Device billing integration already installed; no files changed. Build verification is still required.'; return }
Write-Output ('Planned changes: ' + (($plan | ForEach-Object { $_.Path }) -join ', '))
if (!$PSCmdlet.ShouldProcess($root, 'Back up and install the K6A billing integration (debug purchase gate OFF) (scoped native files only)')) { return }
$backup = Join-Path $root ('.seamen-billing-backups/' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [Guid]::NewGuid().ToString('N'))
[IO.Directory]::CreateDirectory($backup) | Out-Null
$changed = @()
try {
    foreach ($item in $plan) {
        if ($null -ne $item.Old) { [IO.File]::WriteAllBytes((Join-Path $backup ([IO.Path]::GetFileName($item.Path))), $item.Old) }
    }
    foreach ($item in $plan) {
        if ($null -eq $item.Old) {
            if (Test-Path -LiteralPath $item.Path) { throw "File appeared during preflight: $($item.Path)" }
        } elseif ([Convert]::ToBase64String([IO.File]::ReadAllBytes($item.Path)) -ne [Convert]::ToBase64String([byte[]]$item.Old)) {
            throw "File changed during preflight: $($item.Path)"
        }
    }
    foreach ($item in $plan) { $changed += $item; [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($item.Path)) | Out-Null; [IO.File]::WriteAllBytes($item.Path, [byte[]]$item.Bytes) }
} catch {
    $failure = $_.Exception.Message
    $rollbackErrors = @()
    foreach ($item in $changed) {
        try {
            if ($null -eq $item.Old) { if (Test-Path -LiteralPath $item.Path) { Remove-Item -LiteralPath $item.Path } }
            elseif ([Convert]::ToBase64String([IO.File]::ReadAllBytes($item.Path)) -ne [Convert]::ToBase64String([byte[]]$item.Old)) {
                [IO.File]::WriteAllBytes($item.Path, [byte[]]$item.Old)
            }
        } catch { $rollbackErrors += "$($item.Path): $($_.Exception.Message)" }
    }
    if ($rollbackErrors.Count) { throw "Installation failed: $failure. Rollback needs manual recovery from $backup`: $($rollbackErrors -join '; ')" }
    throw "Installation failed and scoped changes were rolled back. Backups: $backup. $failure"
}
Write-Output "Installed. Backups: $backup"
Write-Output 'Installed K6A using device Play ownership. Debug purchases remain OFF; production purchases are always disabled. No web files, signing, application ID, SDK dependency or version values were changed. Run existing sync/Gradle build; reapply this installer after sync if native sources regenerate.'
