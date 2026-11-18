"""PowerShell patch tests in disposable fixtures, never the user's Android wrapper.

Run: PWSH=/path/to/pwsh python tests/billing-patch.py
Optionally K3F_CAPACITOR_TEMPLATE=/extracted/official/android-template tests that
published Capacitor 8.5.2 template too. No Gradle build is implied by these tests.
"""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PATCH = ROOT / "native-patches/K3F.1"
PWSH = os.environ.get("PWSH", "pwsh")
NS = "http://schemas.android.com/apk/res/android"
PERMISSION = "com.android.vending.BILLING"
GRADLE = """apply plugin: 'com.android.application'
android {
    namespace 'com.seamenpool.game'
    defaultConfig {
        applicationId 'com.seamenpool.game'
        minSdkVersion rootProject.ext.minSdkVersion
        versionCode 1578
        versionName '0.17.48'
    }
    // Preserve the user's signing and custom configuration verbatim.
}
dependencies { implementation project(':capacitor-android') }
apply from: 'capacitor.build.gradle'
"""
MANIFEST = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">
    <application android:label="Seamen" android:allowBackup="true">
        <activity android:name=".MainActivity" android:exported="true" />
    </application>
    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
"""


def put(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def fixture(path):
    put(path / "package.json", '{"dependencies":{"@capacitor/core":"8.5.2","@capacitor/android":"8.5.2"}}')
    for name in ["android", "core"]:
        put(path / f"node_modules/@capacitor/{name}/package.json", '{"version":"8.5.2"}')
    put(path / "capacitor.config.json", '{"appId":"com.seamenpool.game","webDir":"www"}')
    put(path / "android/app/build.gradle", GRADLE)
    put(path / "android/variables.gradle", "ext {\n    minSdkVersion = 24\n}\n")
    put(path / "android/build.gradle", "buildscript { repositories { google(); mavenCentral() } }\n")
    put(path / "android/app/src/main/AndroidManifest.xml", MANIFEST)
    put(path / "www/keep.txt", "Approved web files and saves are outside this patch.\n")
    put(path / "SYNC-SEAMEN-TO-ANDROID.bat", "@echo off\r\nREM existing sync workflow\r\n")


def snapshot(path):
    return {str(p.relative_to(path)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in path.rglob("*") if p.is_file()}


def run(script, args, ok=True):
    p = subprocess.run([PWSH, "-NoLogo", "-NoProfile", "-File", str(PATCH / script), *map(str, args)],
                       capture_output=True, text=True, timeout=35)
    assert (p.returncode == 0) == ok, p.stdout + p.stderr
    return p.stdout + p.stderr


def install(path, *extra, ok=True):
    return run("Install-SEAMEN-BILLING.ps1", ["-ProjectPath", path, *extra], ok)


with tempfile.TemporaryDirectory(prefix="seamen-billing-test-") as tmp:
    tmp = Path(tmp)
    base = tmp / "normal project with spaces"
    fixture(base)
    before = snapshot(base)
    install(base, "-WhatIf")
    assert snapshot(base) == before, "WhatIf wrote files"
    install(base)
    after = snapshot(base)
    scoped = {"android/app/build.gradle", "android/app/src/main/AndroidManifest.xml", "android/app/seamen-billing-foundation.gradle"}
    assert {p for p in after if before.get(p) != after[p] and not p.startswith(".seamen-billing-backups/")} == scoped
    gradle = (base / "android/app/build.gradle").read_text()
    assert gradle.startswith(GRADLE) and gradle.count("apply from: 'seamen-billing-foundation.gradle'") == 1
    doc = ET.parse(base / "android/app/src/main/AndroidManifest.xml")
    assert len([p for p in doc.findall("uses-permission") if p.get(f"{{{NS}}}name") == PERMISSION]) == 1
    backup = next((base / ".seamen-billing-backups").iterdir())
    assert (backup / "build.gradle").read_text() == GRADLE
    assert (backup / "AndroidManifest.xml").read_text() == MANIFEST
    install(base)
    assert snapshot(base) == after, "Second installation was not idempotent"
    print("PASS dry run, three scoped changes, untouched identity/version/signing/web/sync files, exact backups and idempotence")

    for label, modify in [
        ("wrong-capacitor", lambda p: put(p / "node_modules/@capacitor/android/package.json", '{"version":"8.6.0"}')),
        ("missing-wrapper", lambda p: (p / "android/app/build.gradle").unlink()),
        ("existing-sdk", lambda p: put(p / "android/app/other.gradle", "dependencies { implementation 'com.android.billingclient:billing:8.3.0' }")),
        ("modified-managed-file", lambda p: put(p / "android/app/seamen-billing-foundation.gradle", "// user's configuration")),
        ("modified-hook", lambda p: put(p / "android/app/build.gradle", GRADLE + "\napply from: 'seamen-billing-foundation.gradle'\n")),
        ("restricted-permission", lambda p: put(p / "android/app/src/main/AndroidManifest.xml", MANIFEST.replace("    <application", '    <uses-permission android:name="com.android.vending.BILLING" tools:node="remove" />\n    <application'))),
        ("duplicate-permission", lambda p: put(p / "android/app/src/main/AndroidManifest.xml", MANIFEST.replace("    <application", ('    <uses-permission android:name="com.android.vending.BILLING" />\n' * 2) + "    <application"))),
        ("old-min-sdk", lambda p: put(p / "android/variables.gradle", "ext {\n    minSdkVersion = 22\n}\n")),
        ("kotlin-script", lambda p: put(p / "android/app/build.gradle.kts", "// custom build")),
        ("purchase-plugin", lambda p: put(p / "package.json", '{"dependencies":{"@revenuecat/purchases-capacitor":"1.0.0"}}')),
        ("malformed-manifest", lambda p: put(p / "android/app/src/main/AndroidManifest.xml", "<manifest>")),
    ]:
        path = tmp / label
        fixture(path)
        modify(path)
        original = snapshot(path)
        install(path, ok=False)
        assert snapshot(path) == original, label + " modified files before refusing"
    print("PASS 11 incompatible/conflicting inputs refused without writing files")

    encoded = tmp / "bom-crlf"
    fixture(encoded)
    for rel in ["android/app/build.gradle", "android/app/src/main/AndroidManifest.xml"]:
        p = encoded / rel
        p.write_bytes(b"\xef\xbb\xbf" + p.read_bytes().replace(b"\n", b"\r\n"))
    install(encoded)
    for rel in ["android/app/build.gradle", "android/app/src/main/AndroidManifest.xml"]:
        data = (encoded / rel).read_bytes()
        assert data.startswith(b"\xef\xbb\xbf") and b"\n" not in data.replace(b"\r\n", b"")
    locked = tmp / "lock-only"
    fixture(locked)
    shutil.rmtree(locked / "node_modules")
    put(locked / "package-lock.json", json.dumps({"packages": {f"node_modules/@capacitor/{n}": {"version": "8.5.2"} for n in ["core", "android"]}}))
    install(locked)
    empty = tmp / "empty-dev-dependencies"
    fixture(empty)
    put(empty / "package.json", '{"dependencies":{},"devDependencies":{}}')
    install(empty)
    preexisting = tmp / "existing-permission"
    fixture(preexisting)
    put(preexisting / "android/app/src/main/AndroidManifest.xml", MANIFEST.replace("    <application", '    <uses-permission android:name="com.android.vending.BILLING" />\n    <application'))
    old = (preexisting / "android/app/src/main/AndroidManifest.xml").read_bytes()
    install(preexisting)
    assert (preexisting / "android/app/src/main/AndroidManifest.xml").read_bytes() == old
    print("PASS UTF-8 BOM/CRLF preservation, lockfile version fallback and existing permission preservation")

    if os.name != "nt":
        failure = tmp / "write-failure"
        fixture(failure)
        p = failure / "android/app/src/main/AndroidManifest.xml"
        original = snapshot(failure)
        p.chmod(0o444)
        try:
            result = install(failure, ok=False)
            assert "rolled back" in result
            assert {k: v for k, v in snapshot(failure).items() if not k.startswith(".seamen-billing-backups/")} == original
        finally:
            p.chmod(0o644)
        print("PASS forced write failure restores the original scoped files")

    official = os.environ.get("K3F_CAPACITOR_TEMPLATE")
    if official:
        real = tmp / "official-template"
        fixture(real)
        shutil.copytree(official, real / "android", dirs_exist_ok=True)
        install(real)
        install(real)
        print("PASS installation/idempotence against the published Capacitor 8.5.2 Android template (fixture only, no Gradle build)")

    # Fake analyzer responses test verifier behaviour, NOT a real packaged APK.
    merged = tmp / "merged.xml"
    apk = tmp / "fixture.apk"
    apk.write_bytes(b"fixture only, not an APK")
    analyzer = tmp / "fake-analyzer.ps1"
    put(analyzer, '$global:LASTEXITCODE=0; Get-Content -LiteralPath $env:K3F_TEST_MANIFEST -Raw')
    os.environ["K3F_TEST_MANIFEST"] = str(tmp / "packaged-fixture.xml")
    good = MANIFEST.replace("<manifest ", '<manifest package="com.seamenpool.game" ').replace("    <application", '    <uses-permission android:name="com.android.vending.BILLING" />\n    <application').replace('        <activity', '        <meta-data android:name="com.google.android.play.billingclient.version" android:value="9.1.0" />\n        <activity')
    put(merged, good)
    packaged = Path(os.environ["K3F_TEST_MANIFEST"])
    put(packaged, good)
    args = ["-MergedManifestPath", merged, "-ApkPath", apk, "-ApkAnalyzerPath", analyzer]
    run("Test-SEAMEN-BILLING.ps1", args)
    for bad in [good.replace(PERMISSION, "wrong.permission"), good.replace('android:value="9.1.0"', 'android:value="8.3.0"'), good.replace('package="com.seamenpool.game"', 'package="wrong.app"')]:
        put(packaged, bad)
        run("Test-SEAMEN-BILLING.ps1", args, ok=False)
    put(packaged, good)
    put(analyzer, '$global:LASTEXITCODE=42; Write-Output "failed"')
    run("Test-SEAMEN-BILLING.ps1", args, ok=False)
    print("PASS verifier fixtures accept valid manifests and reject missing permission, wrong SDK metadata, package mismatch and analyzer failure; actual APK remains unverified")
