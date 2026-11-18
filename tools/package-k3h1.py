"""Build the small review integration only; never regenerate the full web game."""
from pathlib import Path
import hashlib
import zipfile

root=Path(__file__).resolve().parents[1]
folder=root/'native-patches/K3H.1'
files={p.name:p.read_bytes() for p in folder.iterdir() if p.suffix in {'.java','.ps1','.md'}}
files.update({'web/www/'+name:(root/'www'/name).read_bytes() for name in ['supporter.js','game.js','index.html']})
files['K3H.1-QA.md']=(root/'K3H.1-QA.md').read_bytes()
files['SHA256SUMS.txt']=''.join(hashlib.sha256(data).hexdigest()+'  '+name+'\n' for name,data in sorted(files.items())).encode()
output=root/'downloads/SeamenPool-K3H1-device-billing-for-v0.17.50-build1580.zip'
with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for name,data in sorted(files.items()):
        info=zipfile.ZipInfo(name,(2026,11,14,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
        z.writestr(info,data)
with zipfile.ZipFile(output) as z:
    assert z.testzip() is None
    assert set(z.namelist())==set(files)
    for line in z.read('SHA256SUMS.txt').decode().splitlines():
        digest,name=line.split('  ',1);assert hashlib.sha256(z.read(name)).hexdigest()==digest
    assert len([name for name in z.namelist() if name.startswith('web/')])==3
print(str(output.relative_to(root)), output.stat().st_size, 'bytes; archive and all embedded checksums verified')
print('SHA256',hashlib.sha256(output.read_bytes()).hexdigest())
