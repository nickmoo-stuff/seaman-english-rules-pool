"""Guarded installer tests only; no user's wrapper or Android build is accessed."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'native-patches/K3G.1/Install-SEAMEN-BILLING-BRIDGE.ps1'
PWSH = os.environ.get('PWSH', 'pwsh')

def put(p, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(data.encode() if isinstance(data, str) else data)

def fixture(p, crlf=False, custom=False):
    for name in ['core', 'android']:
        put(p / f'node_modules/@capacitor/{name}/package.json', '{"version":"8.5.2"}')
    put(p / 'package.json', '{}')
    put(p / 'android/app/seamen-billing-foundation.gradle', "dependencies { implementation('com.android.billingclient:billing:9.1.0') }\n")
    put(p / 'android/app/src/main/AndroidManifest.xml', '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><uses-permission android:name="com.android.vending.BILLING"/><application/></manifest>')
    activity = 'package example.original;\nimport com.getcapacitor.BridgeActivity;\npublic class MainActivity extends BridgeActivity {\n'
    if custom:
        activity += '    @Override protected void onCreate(android.os.Bundle saved) { super.onCreate(saved); /* custom behaviour stays */ }\n'
    activity += '}\n'
    gradle = '''apply plugin: 'com.android.application'
android {
    defaultConfig {
        applicationId 'example.original'
        versionCode 1579
        versionName "0.17.49"
    }
    // existing signing configuration remains
}
apply from: 'seamen-billing-foundation.gradle'
'''
    for rel, text in [('android/app/src/main/java/example/original/MainActivity.java', activity), ('android/app/build.gradle', gradle)]:
        put(p / rel, (b'\xef\xbb\xbf' + text.replace('\n', '\r\n').encode()) if crlf else text)
    put(p / 'www/game.js', 'approved saved gameplay')
    return activity, gradle

def snapshot(p):
    return {str(f.relative_to(p)): hashlib.sha256(f.read_bytes()).hexdigest() for f in p.rglob('*') if f.is_file()}

def install(p, *extra, ok=True):
    r = subprocess.run([PWSH, '-NoProfile', '-File', str(SCRIPT), '-ProjectPath', str(p), *extra], capture_output=True, text=True, timeout=25)
    assert (r.returncode == 0) == ok, r.stdout + r.stderr
    return r.stdout + r.stderr

with tempfile.TemporaryDirectory(prefix='seamen-bridge-test-') as tmp:
    tmp = Path(tmp)
    for crlf in [False, True]:
        p = tmp / ('project with spaces ' + str(crlf))
        original_activity, original_gradle = fixture(p, crlf, custom=True)
        before = snapshot(p)
        install(p, '-WhatIf')
        assert before == snapshot(p)
        install(p)
        after = snapshot(p)
        backup = next((p / '.seamen-billing-backups').iterdir())
        for rel in ['android/app/build.gradle', 'android/app/src/main/java/example/original/MainActivity.java']:
            assert hashlib.sha256((backup / Path(rel).name).read_bytes()).hexdigest() == before[rel]
        changed = {name for name in after if before.get(name) != after[name] and not name.startswith('.seamen-billing-backups/')}
        assert changed == {'android/app/build.gradle', 'android/app/src/main/java/example/original/MainActivity.java', 'android/app/src/main/java/com/seamenpool/billing/SeamenBillingPlugin.java'}
        activity = (p / 'android/app/src/main/java/example/original/MainActivity.java').read_text(encoding='utf-8-sig')
        assert original_activity[:-2] in activity and 'custom behaviour stays' in activity
        assert activity.count('registerPlugin(com.seamenpool.billing.SeamenBillingPlugin.class)') == 1
        gradle = (p / 'android/app/build.gradle').read_text(encoding='utf-8-sig')
        assert 'versionCode 1580' in gradle and 'versionName "0.17.50"' in gradle
        assert gradle.replace('1580', '1579').replace('0.17.50', '0.17.49') == original_gradle
        if crlf:
            for rel in ['android/app/build.gradle', 'android/app/src/main/java/example/original/MainActivity.java']:
                data = (p / rel).read_bytes()
                assert data.startswith(b'\xef\xbb\xbf') and b'\n' not in data.replace(b'\r\n', b'')
        install(p)
        assert after == snapshot(p), 'installer not idempotent'
    print('PASS bridge dry-run, scoped edits, existing Activity preserved, registration before bridge creation, coordinated candidate version, BOM/CRLF, exact backups and repeat runs')
    for name in ['unknown-version', 'missing-foundation', 'custom-load', 'modified-plugin', 'unknown-gradle-version', 'restricted-permission']:
        p = tmp / name
        fixture(p)
        if name == 'unknown-version': put(p / 'node_modules/@capacitor/core/package.json', '{"version":"9.0.0"}')
        elif name == 'missing-foundation': (p / 'android/app/seamen-billing-foundation.gradle').unlink()
        elif name == 'custom-load': put(p / 'android/app/src/main/java/example/original/MainActivity.java', 'class MainActivity extends BridgeActivity { protected void load() {} }')
        elif name == 'modified-plugin': put(p / 'android/app/src/main/java/com/seamenpool/billing/SeamenBillingPlugin.java', '// custom plugin')
        elif name == 'unknown-gradle-version': put(p / 'android/app/build.gradle', 'versionName project.name')
        elif name == 'restricted-permission': put(p / 'android/app/src/main/AndroidManifest.xml', '<manifest xmlns:android="http://schemas.android.com/apk/res/android"><uses-permission android:name="com.android.vending.BILLING" android:maxSdkVersion="24"/></manifest>')
        before = snapshot(p)
        install(p, ok=False)
        assert before == snapshot(p), name + ' changed files before refusing'
    print('PASS six conflicting/unsupported wrapper fixtures refused before writes; K3F.1 dependency/permission and web files remain untouched')
    if os.name != 'nt':
        p = tmp / 'forced-write-failure'
        fixture(p)
        before = snapshot(p)
        gradle = p / 'android/app/build.gradle'
        gradle.chmod(0o444)
        try:
            assert 'rolled back' in install(p, ok=False)
            assert {k:v for k,v in snapshot(p).items() if not k.startswith('.seamen-billing-backups/')} == before
        finally:
            gradle.chmod(0o644)
        print('PASS forced write failure rolls back registration and preserves original native versions/files')
