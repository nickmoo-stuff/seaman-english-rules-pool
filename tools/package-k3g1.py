"""Produce separate web-source and native-patch candidates, not an Android binary."""
import argparse
import hashlib
from pathlib import Path
import zipfile

args = argparse.ArgumentParser()
args.add_argument('--out', type=Path, required=True)
args.add_argument('--web-only', action='store_true', help='Consolidated web corrections; do not generate an Android patch')
options = args.parse_args()
out = options.out
out.mkdir(parents=True, exist_ok=True)
root = Path(__file__).resolve().parents[1]
release = '0.17.50-build1580'

def archive(path, prefix, entries):
    sums = ''.join(hashlib.sha256(value).hexdigest() + '  ' + name + '\n' for name, value in sorted(entries.items())).encode()
    entries = {**entries, 'SHA256SUMS.txt': sums}
    with zipfile.ZipFile(path, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for name, data in sorted(entries.items()):
            info = zipfile.ZipInfo(prefix + '/' + name, (1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            z.writestr(info, data)
    with zipfile.ZipFile(path) as z:
        assert z.testzip() is None
        for name, value in entries.items():
            assert z.read(prefix + '/' + name) == value
    print(path)
    print('SHA-256:', hashlib.sha256(path.read_bytes()).hexdigest(), 'bytes:', path.stat().st_size)

web = {str(p.relative_to(root)).replace('\\', '/'): p.read_bytes() for p in sorted((root / 'www').rglob('*')) if p.is_file()}
web['READ-ME-FIRST.txt'] = b'''K3G.1 source candidate 0.17.50/build 1580. Not an APK/AAB or Play release.
Copy www into the EXISTING Capacitor wrapper; run the existing SYNC batch;
then apply the matching separate K3G.1 native bridge patch and Gradle Sync.
Purchases and verified paid grants are disabled: no trusted backend exists.
Current approved gameplay/save formats are retained. Do not activate the
draft product or make real-money purchases. See the native patch README
and BACKEND-CONTRACT.md for installation, tests and security blockers.
'''
if options.web_only:
    web['READ-ME-FIRST.txt'] = b'''K3G.1 consolidated WEB-ONLY corrections: 0.17.50/build 1580.
Includes the Chapter 4 and beyond wording and visible ownership-check feedback.
Copy www into the EXISTING Capacitor wrapper, run your existing SYNC batch,
then Gradle Sync/rebuild using your current wrapper and installed billing bridge.
No new Android billing patch or version change is required for these corrections.
Purchases and paid grants remain disabled pending the trusted backend.
No Google Play activation, upload or real-money payment is part of this package.
'''
web_name = 'SeamenPool-v' + release + ('-web-corrections' if options.web_only else '-web-candidate')
archive(out / (web_name + '.zip'), web_name, web)
if not options.web_only:
    source = root / 'native-patches/K3G.1'
    native = {str(p.relative_to(source)).replace('\\', '/'): p.read_bytes() for p in sorted(source.rglob('*')) if p.is_file()}
    assert set(native) == {'README.md', 'BACKEND-CONTRACT.md', 'Install-SEAMEN-BILLING-BRIDGE.ps1', 'SeamenBillingPlugin.java'}
    archive(out / ('SeamenPool-v' + release + '-Capacitor8.5.2-bridge-patch.zip'), 'SeamenPool-v' + release + '-Capacitor8.5.2-bridge-patch', native)
