#requires -Version 5.1
[CmdletBinding(SupportsShouldProcess = $true)]
param([string]$ProjectPath = 'C:\Users\Nick\Documents\SeamenPoolAndroid')
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath $ProjectPath).Path
$gradle = Join-Path $root 'android/app/build.gradle'
$target = Join-Path $root 'android/app/src/main/java/com/seamenpool/billing/SeamenBillingPlugin.java'
$source = Join-Path $PSScriptRoot 'SeamenBillingPlugin.java'
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

foreach ($name in @('@capacitor/core', '@capacitor/android')) {
    if ((Installed-Version $name) -ne '8.5.2') { throw "Expected $name 8.5.2; no changes made." }
}
$foundation = Join-Path $root 'android/app/seamen-billing-foundation.gradle'
if (!(Test-Path -LiteralPath $foundation) -or (Read-Utf8 $foundation) -notmatch 'com\.android\.billingclient:billing:9\.1\.0') { throw 'Install and verify the K3F.1 Billing 9.1.0 foundation first; no changes made.' }
$manifestPath = Join-Path $root 'android/app/src/main/AndroidManifest.xml'
[xml]$manifestXml = Read-Utf8 $manifestPath
$androidNs = 'http://schemas.android.com/apk/res/android'
$permissions = @($manifestXml.DocumentElement.SelectNodes('uses-permission') | Where-Object { $_.GetAttribute('name', $androidNs) -eq 'com.android.vending.BILLING' })
if ($permissions.Count -ne 1 -or $permissions[0].HasAttribute('node', 'http://schemas.android.com/tools') -or $permissions[0].HasAttribute('maxSdkVersion', $androidNs)) { throw 'Expected the verified unrestricted K3F.1 BILLING permission; no changes made.' }
$activities = @(Get-ChildItem (Join-Path $root 'android/app/src/main') -Recurse -File | Where-Object { $_.Name -eq 'MainActivity.java' -or $_.Name -eq 'MainActivity.kt' })
if ($activities.Count -ne 1 -or $activities[0].Extension -ne '.java') { throw 'Supply the existing MainActivity source for a tailored patch; no changes made.' }
$activity = $activities[0].FullName
$activityText = Read-Utf8 $activity
$buildText = Read-Utf8 $gradle
$pluginBytes = [IO.File]::ReadAllBytes($source)
if (Test-Path -LiteralPath $target) {
    if ([Convert]::ToBase64String([IO.File]::ReadAllBytes($target)) -ne [Convert]::ToBase64String($pluginBytes)) { throw 'Existing billing plugin differs; it will not be overwritten.' }
}
$nl = "`n"
if ($activityText.Contains("`r`n")) { $nl = "`r`n" }
$block = @('    // BEGIN SEAMEN K3G.1 BILLING BRIDGE', '    @Override protected void load() {', '        registerPlugin(com.seamenpool.billing.SeamenBillingPlugin.class);', '        super.load();', '    }', '    // END SEAMEN K3G.1 BILLING BRIDGE') -join $nl
$newActivity = $activityText
if ($activityText.Contains('SEAMEN K3G.1 BILLING BRIDGE') -or $activityText.Contains('SeamenBillingPlugin')) {
    if (!$activityText.Contains($block) -or ([regex]::Matches($activityText, 'registerPlugin\(com\.seamenpool\.billing\.SeamenBillingPlugin\.class\)')).Count -ne 1) { throw 'Existing billing registration differs; no changes made.' }
} else {
    if ($activityText -notmatch 'class\s+MainActivity\s+extends\s+(?:com\.getcapacitor\.)?BridgeActivity\s*\{' -or $activityText -match '\bvoid\s+load\s*\(' -or $activityText.TrimEnd()[-1] -ne '}') { throw 'Custom MainActivity/load override requires review; no changes made.' }
    $end = $activityText.LastIndexOf('}')
    $newActivity = $activityText.Insert($end, $nl + $block + $nl)
}
$versionNames = [regex]::Matches($buildText, '(?m)^\s*versionName\s*(?:=\s*)?["''](0\.17\.(?:48|49|50))["'']\s*$')
$versionCodes = [regex]::Matches($buildText, '(?m)^\s*versionCode\s*(?:=\s*)?(1578|1579|1580)\s*$')
if ($versionNames.Count -ne 1 -or $versionCodes.Count -ne 1) { throw 'Expected literal approved/candidate versionName and versionCode. Supply app/build.gradle for review; no changes made.' }
if ($versionNames[0].Groups[1].Value -eq '0.17.50' -and $versionCodes[0].Groups[1].Value -ne '1580') { throw 'Inconsistent existing candidate version; no changes made.' }
if (!$buildText.Contains('seamen-billing-foundation.gradle')) { throw 'K3F.1 Gradle hook missing; no changes made.' }
$newBuild = $buildText
foreach ($pair in @(@($versionNames[0].Groups[1], '0.17.50'), @($versionCodes[0].Groups[1], '1580')) | Sort-Object { $_[0].Index } -Descending) {
    $part = $pair[0]; $newBuild = $newBuild.Remove($part.Index, $part.Length).Insert($part.Index, $pair[1])
}
$plan = @()
if ($newActivity -cne $activityText) { $plan += [pscustomobject]@{ Path = $activity; Bytes = (Encode-Like $activity $newActivity); Old = [IO.File]::ReadAllBytes($activity) } }
if ($newBuild -cne $buildText) { $plan += [pscustomobject]@{ Path = $gradle; Bytes = (Encode-Like $gradle $newBuild); Old = [IO.File]::ReadAllBytes($gradle) } }
if (!(Test-Path -LiteralPath $target)) { $plan += [pscustomobject]@{ Path = $target; Bytes = $pluginBytes; Old = $null } }
if ($plan.Count -eq 0) { Write-Output 'Billing bridge already installed; no files changed. Build verification is still required.'; return }
Write-Output ('Planned changes: ' + (($plan | ForEach-Object { $_.Path }) -join ', '))
if (!$PSCmdlet.ShouldProcess($root, 'Back up and install the K3G.1 billing bridge and candidate version (three scoped files only)')) { return }
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
Write-Output 'Native candidate version is 0.17.50/1580. Purchases and verified paid grants remain disabled. Copy matching www, run existing sync, rerun this installer if sync regenerates files, then Gradle Sync and test.'
