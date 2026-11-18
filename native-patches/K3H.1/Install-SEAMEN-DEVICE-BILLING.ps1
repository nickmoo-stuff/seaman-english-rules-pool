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
    throw "Cannot verify $Name. Run npm ci in the existing wrapper, then retry. No changes made."
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
$activities = @(Get-ChildItem (Join-Path $root 'android/app/src/main') -Recurse -Filter 'MainActivity.java' -File)
if ($activities.Count -ne 1 -or (Read-Utf8 $activities[0].FullName) -notmatch 'registerPlugin\(com\.seamenpool\.billing\.SeamenBillingPlugin\.class\)') { throw 'Expected the existing K3G.1 plugin registration. Supply your Activity for review; no changes made.' }
foreach ($webName in @('supporter.js','game.js','index.html')) {
    $webSource = Join-Path $PSScriptRoot "web/www/$webName"
    if (!(Test-Path $webSource)) { $webSource = Join-Path $PSScriptRoot "../../www/$webName" }
    $localWeb = Join-Path $root "www/$webName"
    if (!(Test-Path $localWeb) -or !(Test-Path $webSource) -or (Normal (Read-Utf8 $localWeb)) -cne (Normal (Read-Utf8 $webSource))) { throw 'Copy the bundled three-file web overlay to the existing www, then SYNC before installing. No changes made.' }
}
$plan = @()
foreach ($name in @('SeamenBillingPlugin.java','SupporterBillingCore.java','PlayBillingClient.java','BillingRetryJob.java')) {
    $source = Join-Path $PSScriptRoot $name
    $target = Join-Path $javaRoot $name
    $newText = Read-Utf8 $source
    if (Test-Path $target) {
        $oldText = Read-Utf8 $target
        if ((Normal $oldText) -ceq (Normal $newText)) { continue }
        if ($name -ne 'SeamenBillingPlugin.java' -or (Text-Hash $oldText) -ne 'bab71ac03a23b7f8cce9e8a3df5841ee0ed1aa59600b3caddf0fbe6039277925') { throw "Existing $target differs from the supported baseline/new source; no files will be overwritten." }
        if ($oldText.Contains("`r`n")) { $newText = $newText.Replace("`r`n", "`n").Replace("`n", "`r`n") }
        $plan += [pscustomobject]@{Path=$target;Bytes=(Encode-Like $target $newText);Old=[IO.File]::ReadAllBytes($target)}
    } else {
        if ($name -eq 'SeamenBillingPlugin.java') { throw 'Install K3G.1 before this upgrade; no wrapper is generated.' }
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
if (!$PSCmdlet.ShouldProcess($root, 'Back up and install the K3H.1 device billing integration (scoped native files only)')) { return }
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
Write-Output 'Installed the device-only model. Purchases remain disabled. No web files, signing, application ID, SDK dependency or version values were changed. Run existing sync/Gradle build; reapply this installer after sync if native sources regenerate.'
