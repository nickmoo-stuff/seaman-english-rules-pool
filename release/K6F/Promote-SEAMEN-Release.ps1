#requires -Version 5.1
[CmdletBinding(SupportsShouldProcess=$true,ConfirmImpact='Medium')]
param(
    [ValidateSet('Verify','VerifyPublic','Promote','Rollback')][string]$Mode='Verify',
    [string]$ProjectPath='C:\Users\Nick\Documents\SeamenPoolAndroid',
    [ValidateRange(1594,2100000000)][int]$ReleaseBuild=1594,
    [switch]$ApproveReleasePromotion,
    [switch]$VersionCodeConfirmedAvailable,
    [string]$BackupPath
)
Set-StrictMode -Version Latest
$ErrorActionPreference='Stop'
if ($Mode -eq 'Promote' -and (!$ApproveReleasePromotion -or !$VersionCodeConfirmedAvailable)) { throw 'Promotion requires explicit approval and confirmation that the selected Play versionCode is unused. No changes made.' }
$root=(Resolve-Path -LiteralPath $ProjectPath).Path
$metadata=@('game.js','index.html','sw.js','service-worker.js','README.txt','NATIVE-PACKAGING-READINESS.txt')
function Plain([string]$Path) {
    $cursor=[IO.Path]::GetFullPath($Path)
    while ($cursor) {
        $item=Get-Item -LiteralPath $cursor -Force
        if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Linked/reparse path requires review: $Path" }
        $cursor=[IO.Path]::GetDirectoryName($cursor)
    }
}
function Read-Text([string]$Path) {
    Plain $Path; $bytes=[IO.File]::ReadAllBytes($Path); $offset=0
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 239 -and $bytes[1] -eq 187 -and $bytes[2] -eq 191) {$offset=3}
    $encoder=New-Object Text.UTF8Encoding($false,$true)
    return $encoder.GetString($bytes,$offset,($bytes.Length-$offset))
}
function Hash-Bytes([byte[]]$Bytes) {
    $sha=[Security.Cryptography.SHA256]::Create()
    try {return [BitConverter]::ToString($sha.ComputeHash($Bytes)).Replace('-','').ToLowerInvariant()} finally {$sha.Dispose()}
}
function Hash-Text([string]$Text) {return Hash-Bytes ([Text.Encoding]::UTF8.GetBytes($Text.Replace("`r`n","`n")))}
function Neutral([string]$Name,[string]$Text) {
    if ($Name -eq 'game.js') {
        $Text=[regex]::Replace($Text,"const APP_VERSION='(?:0\.17\.63|1\.0\.0)';","const APP_VERSION='@VERSION@';")
        $Text=[regex]::Replace($Text,'const APP_BUILD_NUMBER=(?:1593|'+$ReleaseBuild+');','const APP_BUILD_NUMBER=@BUILD@;')
    } else {
        $Text=$Text.Replace('0.17.63','@VERSION@').Replace('1.0.0','@VERSION@')
        if ($Name -eq 'service-worker.js') {$Text=$Text.Replace('01763','@COMPACT@').Replace('v100-','v@COMPACT@-')}
        $Text=[regex]::Replace($Text,'(?<!\d)(?:1593|'+$ReleaseBuild+')(?!\d)','@BUILD@')
    }
    return $Text
}
function Promoted([string]$Name,[string]$Text) {
    if ($Name -eq 'game.js') {return $Text.Replace("const APP_VERSION='0.17.63';","const APP_VERSION='1.0.0';").Replace('const APP_BUILD_NUMBER=1593;',('const APP_BUILD_NUMBER='+$ReleaseBuild+';'))}
    $Text=$Text.Replace('0.17.63','1.0.0')
    if ($Name -eq 'service-worker.js') {$Text=$Text.Replace('01763','100')}
    return [regex]::Replace($Text,'(?<!\d)1593(?!\d)',[string]$ReleaseBuild)
}
function Demoted([string]$Name,[string]$Text) {
    if ($Name -eq 'game.js') {return $Text.Replace("const APP_VERSION='1.0.0';","const APP_VERSION='0.17.63';").Replace(('const APP_BUILD_NUMBER='+$ReleaseBuild+';'),'const APP_BUILD_NUMBER=1593;')}
    $Text=$Text.Replace('1.0.0','0.17.63')
    if ($Name -eq 'service-worker.js') {$Text=$Text.Replace('v100-','v01763-')}
    return [regex]::Replace($Text,'(?<!\d)'+$ReleaseBuild+'(?!\d)','1593')
}
function Encode-Like([byte[]]$Old,[string]$Text) {
    $bom=$Old.Length -ge 3 -and $Old[0] -eq 239 -and $Old[1] -eq 187 -and $Old[2] -eq 191
    $encoder=New-Object Text.UTF8Encoding($bom)
    return [byte[]]($encoder.GetPreamble()+$encoder.GetBytes($Text))
}
$manifest=Read-Text (Join-Path $PSScriptRoot 'promotion-baseline.json') | ConvertFrom-Json
if ($manifest.schema -ne 1 -or $manifest.candidateVersion -ne '0.17.63' -or $manifest.candidateBuild -ne 1593 -or $manifest.publicVersion -ne '1.0.0') {throw 'Unexpected promotion manifest.'}
if ($ReleaseBuild -le $manifest.locallyObservedMaxBuild) {throw 'Release code conflicts with locally observed history. Choose a confirmed unused higher code.'}
$nativeTool=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../native-patches/K6E/Manage-SEAMEN-Billing.ps1'))
$nativeKnown=Read-Text (Join-Path ([IO.Path]::GetDirectoryName($nativeTool)) 'approved-native-hashes.json') | ConvertFrom-Json
function Native-Off {
    # Existing guarded preflight only. Never builds, installs or enables billing.
    & $nativeTool -Mode Off -ProjectPath $root -WhatIf | Out-Null
    foreach ($entry in $nativeKnown.PSObject.Properties) {
        $path=Join-Path $root ('android/app/src/main/java/com/seamenpool/billing/'+$entry.Name)
        $source=Read-Text $path
        if ($entry.Name -eq 'ProductionPurchasePolicy.java' -and $Mode -eq 'VerifyPublic') {
            if (!$source.Contains('PRODUCTION_PURCHASES_ENABLED=true;')) {throw 'Final public source requires separately approved production ON. No changes made.'}
            $source=$source.Replace('PRODUCTION_PURCHASES_ENABLED=true;','PRODUCTION_PURCHASES_ENABLED=false;')
        }
        if ((Hash-Text $source) -cne $entry.Value) {throw "Promotion requires the supported native sources with BOTH gates OFF: $($entry.Name)"}
    }
}
Plain $root
Native-Off
$backupBase=Join-Path $root '.seamen-release-backups'
if (Test-Path -LiteralPath $backupBase) {Plain $backupBase}
$allowed=@('android/app/build.gradle')
foreach ($name in $metadata) {$allowed+=('www/'+$name);$allowed+=('android/app/src/main/assets/public/'+$name)}
$gradlePath=Join-Path $root 'android/app/build.gradle'
$gradle=Read-Text $gradlePath
# Recognise existing literal fields only; never evaluate/rewrite custom Gradle code.
function Gradle-Code([string]$Text) {
    # Mask comments without moving offsets: only real literal version fields may change.
    return [regex]::Replace($Text,'(?s)/\*.*?\*/|(?m)//[^\r\n]*',{param($m) [regex]::Replace($m.Value,'[^\r\n]',' ')})
}
$inspect=Gradle-Code $gradle
$versionMatches=[regex]::Matches($inspect,'(?m)^\s*versionName\s*(?:=\s*)?([''"])([^''"]+)\1')
$buildMatches=[regex]::Matches($inspect,'(?m)^\s*versionCode\s*(?:=\s*)?(\d+)\b')
if ($versionMatches.Count -ne 1 -or $buildMatches.Count -ne 1 -or $inspect -match '\bversionNameSuffix\b') {throw 'Expected one literal versionName/versionCode without a suffix. Keep the file for review; no changes made.'}
$installedVersion=$versionMatches[0].Groups[2].Value
$installedBuild=[int]$buildMatches[0].Groups[1].Value
$candidate=$installedVersion -eq '0.17.63' -and $installedBuild -eq 1593
$public=$installedVersion -eq '1.0.0' -and $installedBuild -eq $ReleaseBuild
if ($Mode -eq 'VerifyPublic' -and !$public) {throw 'Final public source must be version 1.0.0 with the selected release build.'}
if (!$candidate -and !$public) {throw "Unexpected local version $installedVersion/$installedBuild. Use the normal workflow to prepare candidate 0.17.63/1593 first. No changes made."}
$plan=@()
if ($Mode -eq 'Rollback') {
    if (!$BackupPath) {throw 'Rollback requires the promotion backup path.'}
    $folder=(Resolve-Path -LiteralPath $BackupPath).Path; Plain $folder
    $prefix=[IO.Path]::GetFullPath($backupBase)+[IO.Path]::DirectorySeparatorChar
    if (!$folder.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)) {throw 'Backup must belong to this project release-backup directory.'}
    $record=Read-Text (Join-Path $folder 'operation.json') | ConvertFrom-Json
    if ($record.schema -ne 1 -or $record.project -cne $root -or $record.mode -ne 'Promote' -or $record.releaseBuild -ne $ReleaseBuild -or @($record.files).Count -ne $allowed.Count) {throw 'Unexpected promotion backup.'}
    if (@($record.files | Select-Object -ExpandProperty name -Unique).Count -ne $allowed.Count) {throw 'Duplicate backup records.'}
    foreach ($item in $record.files) {
        if ($item.name -notin $allowed) {throw 'Unexpected backup filename.'}
        $path=Join-Path $root $item.name; Plain $path
        $saved=Join-Path $folder $item.name; Plain $saved
        $old=[IO.File]::ReadAllBytes($saved);$current=[IO.File]::ReadAllBytes($path)
        if ((Hash-Bytes $old) -cne $item.beforeHash) {throw 'Backup checksum mismatch.'}
        if ((Hash-Bytes $current) -ceq $item.beforeHash) {continue}
        if ((Hash-Bytes $current) -cne $item.afterHash) {throw 'Promoted file changed; rollback refuses to overwrite it.'}
        $plan+=@{Name=$item.name;Path=$path;Old=$current;Bytes=$old}
    }
} else {
    # Same approved code and artwork before/after: only six metadata files differ.
    foreach ($entry in $manifest.files.PSObject.Properties) {
        $name=$entry.Name
        if ($name -match '(^|/)\.\.(/|$)|^[\\/]|:|\\') {throw 'Unsafe manifest path.'}
        foreach ($prefix in @('www/','android/app/src/main/assets/public/')) {
            $path=Join-Path $root ($prefix+$name);Plain $path
            if ($entry.Value.text) {
                $text=Read-Text $path
                if ($name -in $metadata) {$hash=Hash-Text (Neutral $name $text)} else {$hash=Hash-Text $text}
            } else {$hash=Hash-Bytes ([IO.File]::ReadAllBytes($path))}
            if ($hash -cne $entry.Value.sha256) {throw "Unexpected candidate/public source or asset: $prefix$name. No changes made."}
            if ($name -in $metadata) {
                $base=if ($candidate) {$text} else {Demoted $name $text}
                if ((Hash-Text $base) -cne $entry.Value.candidateSha256 -or ($public -and (Promoted $name $base) -cne $text)) {throw 'Mixed or unexpected version metadata. No changes made.'}
                if ($name -eq 'game.js') {
                    $version=if ($candidate) {'0.17.63'} else {'1.0.0'}
                    $build=if ($candidate) {1593} else {$ReleaseBuild}
                    if (!$text.Contains("const APP_VERSION='$version';") -or !$text.Contains("const APP_BUILD_NUMBER=$build;") -or !$text.Contains("const BUILD_MODE='release'")) {throw 'Web/native versions or release mode disagree. No changes made.'}
                }
                $old=[IO.File]::ReadAllBytes($path);$new=Encode-Like $old (Promoted $name $text)
                if ((Hash-Bytes $old) -cne (Hash-Bytes $new)) {$plan+=@{Name=($prefix+$name);Path=$path;Old=$old;Bytes=$new}}
            }
        }
    }
    foreach ($name in $metadata) {if (!$manifest.files.PSObject.Properties[$name]) {throw 'Missing required metadata fingerprint.'}}
    if ($candidate) {
        $newGradle=$gradle
        $v=$versionMatches[0].Groups[2];$newGradle=$newGradle.Remove($v.Index,$v.Length).Insert($v.Index,'1.0.0')
        $newBuildMatches=[regex]::Matches((Gradle-Code $newGradle),'(?m)^\s*versionCode\s*(?:=\s*)?(\d+)\b');$c=$newBuildMatches[0].Groups[1]
        $newGradle=$newGradle.Remove($c.Index,$c.Length).Insert($c.Index,[string]$ReleaseBuild)
        $old=[IO.File]::ReadAllBytes($gradlePath);$plan+=@{Name='android/app/build.gradle';Path=$gradlePath;Old=$old;Bytes=(Encode-Like $old $newGradle)}
    }
}
if ($Mode -eq 'VerifyPublic') {Write-Output "Verified SOURCE: 1.0.0/build $ReleaseBuild; production ON, debug OFF; approved release web/assets match. Actual signed AAB and Play Console NOT inspected. No changes made.";return}
if ($Mode -eq 'Verify') {Write-Output "Verified SOURCE: $installedVersion/build $installedBuild; both native gates OFF; approved release web/assets match. Actual APK/AAB and Play Console NOT inspected. No changes made.";return}
if (!$plan.Count) {Write-Output "Already $Mode; no files changed.";return}
if (!$PSCmdlet.ShouldProcess($root,"$Mode version metadata only; no billing activation, build, upload or install")) {return}
$lockPath=Join-Path $root '.seamen-release.lock';$lock=$null;$changed=@();$temporary=$null
try {
    $lock=New-Object IO.FileStream($lockPath,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None)
    Native-Off
    foreach ($item in $plan) {if ((Hash-Bytes ([IO.File]::ReadAllBytes($item.Path))) -cne (Hash-Bytes $item.Old)) {throw 'File changed during preflight.'}}
    $backup=Join-Path $backupBase ([DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffffffZ')+'-'+[Guid]::NewGuid().ToString('N'))
    [IO.Directory]::CreateDirectory($backup) | Out-Null
    $records=@()
    foreach ($item in $plan) {
        $saved=Join-Path $backup $item.Name;[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($saved)) | Out-Null;[IO.File]::WriteAllBytes($saved,$item.Old)
        $records+=@{name=$item.Name;beforeHash=(Hash-Bytes $item.Old);afterHash=(Hash-Bytes $item.Bytes)}
    }
    $record=@{schema=1;mode=$Mode;project=$root;releaseBuild=$ReleaseBuild;files=$records}
    [IO.File]::WriteAllText((Join-Path $backup 'operation.json'),($record | ConvertTo-Json -Depth 5),(New-Object Text.UTF8Encoding($false)))
    foreach ($item in $plan) {
        $changed+=,$item;$temporary=$item.Path+'.k6f-'+[Guid]::NewGuid().ToString('N')+'.tmp';[IO.File]::WriteAllBytes($temporary,$item.Bytes)
        [IO.File]::Replace($temporary,$item.Path,(Join-Path $backup ('atomic-'+[Guid]::NewGuid().ToString('N'))));$temporary=$null
    }
    Write-Output "$Mode complete. Backup: $backup. Both native purchase gates remain OFF."
    Write-Output 'Source metadata only: rebuild with the existing workflow. No APK/AAB was built, installed, uploaded or published.'
    if ($Mode -eq 'Rollback') {Write-Output 'Do not install a lower versionCode over a newer installed app or uninstall to force it. After release use 1.0.1 with a higher code for fixes.'}
} catch {
    $failure=$_.Exception.Message;$errors=@()
    foreach ($item in $changed) {try {[IO.File]::WriteAllBytes($item.Path,$item.Old)} catch {$errors+=$item.Path}}
    if ($errors.Count) {throw "Failed: $failure. Recover from $backup for: $($errors -join ', ')"}
    throw "Failed; scoped changes rolled back. $failure"
} finally {
    if ($temporary -and (Test-Path -LiteralPath $temporary)) {Remove-Item -LiteralPath $temporary -Force}
    if ($null -ne $lock) {$lock.Dispose();Remove-Item -LiteralPath $lockPath -Force}
}
