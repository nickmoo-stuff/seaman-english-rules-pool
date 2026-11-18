#requires -Version 5.1
[CmdletBinding(SupportsShouldProcess = $true)]
param([string]$ProjectPath = 'C:\Users\Nick\Documents\SeamenPoolAndroid')

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$androidNs = 'http://schemas.android.com/apk/res/android'
$toolsNs = 'http://schemas.android.com/tools'
$root = (Resolve-Path -LiteralPath $ProjectPath).Path
$gradle = Join-Path $root 'android/app/build.gradle'
$manifest = Join-Path $root 'android/app/src/main/AndroidManifest.xml'
$managed = Join-Path $root 'android/app/seamen-billing-foundation.gradle'
$source = Join-Path $PSScriptRoot 'seamen-billing-foundation.gradle'

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
function Billing-Nodes([xml]$Xml) {
    return @($Xml.DocumentElement.SelectNodes('*') | Where-Object {
        $_.LocalName -eq 'uses-permission' -and $_.GetAttribute('name', $androidNs) -eq 'com.android.vending.BILLING'
    })
}

foreach ($path in @((Join-Path $root 'package.json'), $gradle, $manifest, $source)) {
    if (!(Test-Path -LiteralPath $path -PathType Leaf)) { throw "Required file missing: $path. No wrapper is generated or replaced." }
}
if (!(Test-Path (Join-Path $root 'capacitor.config.ts')) -and !(Test-Path (Join-Path $root 'capacitor.config.json'))) {
    throw 'No standard Capacitor config found. Supply the existing config for review; no changes made.'
}
if (Test-Path (Join-Path $root 'android/app/build.gradle.kts')) { throw 'Kotlin Gradle script found. Supply it for a tailored patch; no changes made.' }
foreach ($name in @('@capacitor/android', '@capacitor/core')) {
    $version = Installed-Version $name
    if ($version -ne '8.5.2') { throw "This patch targets Capacitor 8.5.2; $name is $version. No changes made." }
}
$package = Read-Utf8 (Join-Path $root 'package.json') | ConvertFrom-Json
foreach ($section in @('dependencies', 'devDependencies')) {
    if ($package.PSObject.Properties[$section]) {
        foreach ($dependency in $package.$section.PSObject.Properties) {
            $name = $dependency.Name
            if ($name -match 'purchases|billing|in-app|(^|[-/])iap($|[-/])') { throw "Existing purchase dependency $name requires review; no changes made." }
        }
    }
}
$buildText = Read-Utf8 $gradle
$manifestText = Read-Utf8 $manifest
$sdkText = $buildText
$variablesPath = Join-Path $root 'android/variables.gradle'
if (Test-Path -LiteralPath $variablesPath) { $sdkText += Read-Utf8 $variablesPath }
$minSdkMatches = [regex]::Matches($sdkText, '(?m)^\s*minSdk(?:Version)?\s*(?:=|\s)\s*(\d+)\b')
if ($minSdkMatches.Count -eq 0) { throw 'Cannot verify a numeric minSdkVersion. Supply app/build.gradle and variables.gradle for review; no changes made.' }
foreach ($sdkMatch in $minSdkMatches) {
    if ([int]$sdkMatch.Groups[1].Value -lt 23) { throw 'Billing 9.1.0 requires minimum Android API 23; no SDK settings were changed.' }
}
$managedBytes = [IO.File]::ReadAllBytes($source)
if (Test-Path -LiteralPath $managed) {
    if ([Convert]::ToBase64String([IO.File]::ReadAllBytes($managed)) -ne [Convert]::ToBase64String($managedBytes)) {
        throw "Existing $managed differs from this patch. It will not be overwritten."
    }
}
$gradleFiles = @(Get-ChildItem (Join-Path $root 'android') -Recurse -File | Where-Object {
    $_.Name -match '\.gradle(\.kts)?$' -and $_.FullName -notmatch '[\\/](build|\.gradle|\.seamen-billing-backups)[\\/]' -and $_.FullName -ne $managed
})
foreach ($file in $gradleFiles) {
    if ((Read-Utf8 $file.FullName) -match 'com\.android\.billingclient\s*:\s*billing') {
        throw "Existing Billing Client declaration in $($file.FullName) requires review; no changes made."
    }
}
$repositories = ''
foreach ($name in @('android/build.gradle', 'android/settings.gradle', 'android/settings.gradle.kts')) {
    $path = Join-Path $root $name
    if (Test-Path -LiteralPath $path) { $repositories += Read-Utf8 $path }
}
if ($repositories -notmatch 'google\s*\(\s*\)') { throw 'No standard google() repository found. Supply Gradle repository configuration for review; no changes made.' }
$nl = "`n"
if ($buildText.Contains("`r`n")) { $nl = "`r`n" }
$block = @('// BEGIN SEAMEN K3F.1 BILLING FOUNDATION', "apply from: 'seamen-billing-foundation.gradle'", '// END SEAMEN K3F.1 BILLING FOUNDATION') -join $nl
$newBuild = $buildText
if ($buildText.Contains('seamen-billing-foundation.gradle') -or $buildText.Contains('SEAMEN K3F.1 BILLING FOUNDATION')) {
    if (!$buildText.Contains($block) -or ([regex]::Matches($buildText, 'seamen-billing-foundation\.gradle')).Count -ne 1) {
        throw 'Existing billing hook differs from the managed block; no changes made.'
    }
} else { $newBuild += $nl + $block + $nl }
[xml]$xml = $manifestText
if ($xml.DocumentElement.LocalName -ne 'manifest' -or $xml.DocumentElement.GetAttribute('xmlns:android') -ne $androidNs) { throw 'Unexpected Android manifest structure; no changes made.' }
$nodes = @(Billing-Nodes $xml)
if ($nodes.Count -gt 1) { throw 'Duplicate billing permissions require review; no changes made.' }
if ($nodes.Count -eq 1 -and ($nodes[0].HasAttribute('maxSdkVersion', $androidNs) -or $nodes[0].HasAttribute('node', $toolsNs))) {
    throw 'Restricted/overridden billing permission requires review; no changes made.'
}
$newManifest = $manifestText
if ($nodes.Count -eq 0) {
    $applicationMatches = [regex]::Matches($manifestText, '(?m)^([ \t]*)<application\b')
    if ($applicationMatches.Count -ne 1) { throw 'Expected one application element on its own line. Supply the manifest for review; no changes made.' }
    $match = $applicationMatches[0]
    $manifestNl = "`n"
    if ($manifestText.Contains("`r`n")) { $manifestNl = "`r`n" }
    $line = $match.Groups[1].Value + '<uses-permission android:name="com.android.vending.BILLING" />' + $manifestNl + $manifestNl
    $newManifest = $manifestText.Insert($match.Index, $line)
    [xml]$check = $newManifest
    if (@(Billing-Nodes $check).Count -ne 1) { throw 'Manifest validation failed before writing; no changes made.' }
}
$plan = @()
if ($newBuild -cne $buildText) { $plan += [pscustomobject]@{ Path = $gradle; Bytes = (Encode-Like $gradle $newBuild); Old = [IO.File]::ReadAllBytes($gradle) } }
if ($newManifest -cne $manifestText) { $plan += [pscustomobject]@{ Path = $manifest; Bytes = (Encode-Like $manifest $newManifest); Old = [IO.File]::ReadAllBytes($manifest) } }
if (!(Test-Path -LiteralPath $managed)) { $plan += [pscustomobject]@{ Path = $managed; Bytes = $managedBytes; Old = $null } }
if ($plan.Count -eq 0) { Write-Output 'Billing foundation already installed; no files changed. Build verification is still required.'; return }
Write-Output ('Planned changes: ' + (($plan | ForEach-Object { $_.Path }) -join ', '))
if (!$PSCmdlet.ShouldProcess($root, 'Back up and install the K3F.1 billing foundation (three scoped files only)')) { return }
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
    foreach ($item in $plan) { $changed += $item; [IO.File]::WriteAllBytes($item.Path, [byte[]]$item.Bytes) }
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
Write-Output 'No web files, product configuration, entitlement, versions, identity, signing or sync scripts were changed. If you run your existing sync again, rerun this installer afterward; then Gradle Sync and build verification.'
