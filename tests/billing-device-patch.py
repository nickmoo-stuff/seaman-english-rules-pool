"""Guarded installer tests only; no user's wrapper or Android build is accessed."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = Path(os.environ.get('DEVICE_BILLING_INSTALLER', ROOT / 'native-patches/K3H.1/Install-SEAMEN-DEVICE-BILLING.ps1'))
PWSH = os.environ.get('PWSH', 'pwsh')

def put(p, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(data.encode() if isinstance(data, str) else data)

def fixture(p, crlf=False):
    for name in ['core', 'android']:
        put(p / f'node_modules/@capacitor/{name}/package.json', '{"version":"8.5.2"}')
    put(p / 'android/app/seamen-billing-foundation.gradle', "dependencies { implementation('com.android.billingclient:billing:9.1.0') }")
    put(p / 'android/app/build.gradle', "apply from: 'seamen-billing-foundation.gradle'\nversionName '0.17.50'\nversionCode 1580\n")
    put(p / 'android/variables.gradle', 'ext {\n    minSdkVersion = 24\n}\n')
    put(p / 'android/app/src/main/java/example/MainActivity.java', 'class MainActivity { protected void load() { registerPlugin(com.seamenpool.billing.SeamenBillingPlugin.class); super.load(); } }')
    manifest='<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n    <uses-permission android:name="com.android.vending.BILLING" />\n    <application android:label="existing">\n        <activity android:name=".MainActivity" />\n    </application>\n</manifest>\n'
    for name,text in [('android/app/src/main/AndroidManifest.xml',manifest),('android/app/src/main/java/com/seamenpool/billing/SeamenBillingPlugin.java',(ROOT / 'native-patches/K3G.1/SeamenBillingPlugin.java').read_text())]:
        put(p / name,(b'\xef\xbb\xbf'+text.replace('\n','\r\n').encode()) if crlf else text)
    for name in ['supporter.js','game.js','index.html']: put(p / ('www/'+name),(ROOT / ('www/'+name)).read_bytes())

def snapshot(p):
    return {str(f.relative_to(p)): hashlib.sha256(f.read_bytes()).hexdigest() for f in p.rglob('*') if f.is_file()}

def install(p, *extra, ok=True):
    r = subprocess.run([PWSH, '-NoProfile', '-File', str(SCRIPT), '-ProjectPath', str(p), *extra], capture_output=True, text=True, timeout=25)
    assert (r.returncode == 0) == ok, r.stdout + r.stderr
    return r.stdout + r.stderr

with tempfile.TemporaryDirectory(prefix='seamen-device-patch-') as tmp:
    tmp=Path(tmp)
    for crlf in [False,True]:
        p=tmp / ('project with spaces '+str(crlf));fixture(p,crlf)
        before=snapshot(p);install(p,'-WhatIf');assert snapshot(p)==before
        install(p);after=snapshot(p)
        changed={f for f in after if before.get(f)!=after[f] and not f.startswith('.seamen-billing-backups/')}
        assert changed=={'android/app/src/main/AndroidManifest.xml', *['android/app/src/main/java/com/seamenpool/billing/'+n for n in ['SeamenBillingPlugin.java','SupporterBillingCore.java','PlayBillingClient.java','BillingRetryJob.java']]}
        backup=next((p / '.seamen-billing-backups').iterdir())
        for rel in ['android/app/src/main/AndroidManifest.xml','android/app/src/main/java/com/seamenpool/billing/SeamenBillingPlugin.java']:
            assert hashlib.sha256((backup / Path(rel).name).read_bytes()).hexdigest()==before[rel]
            if crlf:
                data=(p / rel).read_bytes();assert data.startswith(b'\xef\xbb\xbf') and b'\n' not in data.replace(b'\r\n',b'')
        manifest=(p / 'android/app/src/main/AndroidManifest.xml').read_text(encoding='utf-8-sig')
        assert 'android:label="existing"' in manifest and 'android.permission.BIND_JOB_SERVICE' in manifest
        install(p);assert snapshot(p)==after,'idempotent'
    print('PASS LF/BOM-CRLF, dry-run, exact backups, protected job manifest, scoped five native files, existing versions/config/web preserved, repeat installation')
    for name in ['version','foundation','sdk','activity','web','custom-plugin','custom-helper','restricted-billing','service-conflict','custom-manifest']:
        p=tmp/name;fixture(p)
        manifest=p/'android/app/src/main/AndroidManifest.xml'
        if name=='version':put(p/'node_modules/@capacitor/core/package.json','{"version":"9.0.0"}')
        elif name=='foundation':(p/'android/app/seamen-billing-foundation.gradle').unlink()
        elif name=='sdk':put(p/'android/variables.gradle','minSdkVersion = 23')
        elif name=='activity':put(p/'android/app/src/main/java/example/MainActivity.java','custom activity')
        elif name=='web':put(p/'www/supporter.js','old web')
        elif name=='custom-plugin':put(p/'android/app/src/main/java/com/seamenpool/billing/SeamenBillingPlugin.java','custom plugin')
        elif name=='custom-helper':put(p/'android/app/src/main/java/com/seamenpool/billing/SupporterBillingCore.java','custom helper')
        elif name=='restricted-billing':put(manifest,manifest.read_text().replace('android:name="com.android.vending.BILLING"','android:name="com.android.vending.BILLING" android:maxSdkVersion="24"'))
        elif name=='service-conflict':put(manifest,manifest.read_text().replace('</application>','<service android:name="com.seamenpool.billing.BillingRetryJob" android:exported="true"/>\n    </application>'))
        elif name=='custom-manifest':put(manifest,manifest.read_text().replace('\n',''))
        before=snapshot(p);install(p,ok=False);assert snapshot(p)==before,name
    print('PASS ten unsupported/conflicting wrapper fixtures refused without writes')
    if os.name!='nt':
        p=tmp/'rollback';fixture(p);before=snapshot(p);manifest=p/'android/app/src/main/AndroidManifest.xml';manifest.chmod(0o444)
        try:
            assert 'rolled back' in install(p,ok=False)
            assert {k:v for k,v in snapshot(p).items() if not k.startswith('.seamen-billing-backups/')}==before
        finally:manifest.chmod(0o644)
        print('PASS forced manifest write failure rolls back Java replacement/new files')
