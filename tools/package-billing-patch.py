"""Reproducibly package the local-wrapper patch; no Android build or web version bump."""
import hashlib
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
source = root / 'native-patches/K3F.1'
destination = root / 'downloads/SeamenPool-K3F1-BillingPatch-Capacitor8.5.2-baseline0.17.48-build1578.zip'
destination.parent.mkdir(exist_ok=True)
entries = {str(p.relative_to(source)).replace('\\', '/'): p.read_bytes()
           for p in sorted(source.rglob('*')) if p.is_file()}
assert set(entries) == {'Install-SEAMEN-BILLING.ps1', 'Test-SEAMEN-BILLING.ps1',
                        'seamen-billing-foundation.gradle', 'README.md', 'VERIFICATION.json'}
entries['SHA256SUMS.txt'] = ''.join(hashlib.sha256(data).hexdigest() + '  ' + name + '\n'
                                 for name, data in sorted(entries.items())).encode()
with zipfile.ZipFile(destination, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for name, data in sorted(entries.items()):
        info = zipfile.ZipInfo('SeamenPool-K3F1-BillingPatch/' + name, (1980, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, data)
with zipfile.ZipFile(destination) as archive:
    assert archive.testzip() is None
print(destination)
print('SHA-256:', hashlib.sha256(destination.read_bytes()).hexdigest())
