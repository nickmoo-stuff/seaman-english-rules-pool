#requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$MergedManifestPath,
    [Parameter(Mandatory = $true)][string]$ApkPath,
    [string]$ApkAnalyzerPath
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$androidNs = 'http://schemas.android.com/apk/res/android'
function Assert-Billing([string]$Text, [string]$Label) {
    [xml]$xml = $Text
    $ns = New-Object Xml.XmlNamespaceManager($xml.NameTable)
    $ns.AddNamespace('android', $androidNs)
    $permission = $xml.SelectNodes('/manifest/uses-permission[@android:name="com.android.vending.BILLING"]', $ns)
    $metadata = $xml.SelectNodes('/manifest/application/meta-data[@android:name="com.google.android.play.billingclient.version"]', $ns)
    if ($permission.Count -ne 1 -or $permission[0].HasAttribute('maxSdkVersion', $androidNs)) { throw "$Label has no single unrestricted BILLING permission." }
    if ($metadata.Count -ne 1 -or $metadata[0].GetAttribute('value', $androidNs) -ne '9.1.0') { throw "$Label does not contain the expected Billing Client 9.1.0 metadata." }
    Write-Host "PASS $Label`: BILLING permission and Billing Client 9.1.0 metadata"
    return $xml.DocumentElement.GetAttribute('package')
}
$merged = (Resolve-Path -LiteralPath $MergedManifestPath).Path
$apk = (Resolve-Path -LiteralPath $ApkPath).Path
if ([IO.Path]::GetExtension($apk) -ne '.apk') { throw 'Provide a freshly built APK. This verifier does not decode AABs.' }
if (!$ApkAnalyzerPath) {
    $candidates = @($env:ANDROID_SDK_ROOT, $env:ANDROID_HOME)
    if ($env:LOCALAPPDATA) { $candidates += Join-Path $env:LOCALAPPDATA 'Android/Sdk' }
    foreach ($sdk in $candidates) {
        if (!$sdk) { continue }
        $latest = Join-Path $sdk 'cmdline-tools/latest/bin/apkanalyzer.bat'
        if (Test-Path -LiteralPath $latest) { $ApkAnalyzerPath = $latest; break }
    }
    if (!$ApkAnalyzerPath) { throw 'Pass -ApkAnalyzerPath pointing to Android SDK cmdline-tools/latest/bin/apkanalyzer.bat (install Command-line Tools in Android Studio SDK Manager if needed).' }
}
$analyzer = (Resolve-Path -LiteralPath $ApkAnalyzerPath).Path
$mergedPackage = Assert-Billing ([IO.File]::ReadAllText($merged)) 'merged manifest'
$dump = & $analyzer manifest print $apk
if ($LASTEXITCODE -ne 0) { throw "apkanalyzer failed (exit $LASTEXITCODE); packaged permission was not verified." }
$apkPackage = Assert-Billing ($dump -join "`n") 'packaged APK manifest'
if (!$mergedPackage -or $mergedPackage -ne $apkPackage) { throw "Package mismatch: merged=$mergedPackage APK=$apkPackage. Use outputs from the same variant/build." }
Write-Output "PASS matching application package: $apkPackage"
Write-Output ('APK SHA-256: ' + (Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash)
Write-Output 'This verifies these local manifest files only; it does not upload, activate purchases or establish Play Console acceptance.'
