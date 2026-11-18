"""Reproducible browser-only projection of the committed Android v1.0.0 www.
Does not edit www, Android sources, prior releases, saves or ownership logic.
"""
from pathlib import Path
import hashlib,json,subprocess,tarfile,io
from browser_projection import project
ROOT=Path(__file__).resolve().parents[1]
SOURCE='f7a53ba73880c1a12997ff3320b88be6044a2fd5'
BUILD='v1.0.0-b1595';DEST=ROOT/'releases'/BUILD
with tarfile.open(fileobj=io.BytesIO(subprocess.check_output(['git','archive',SOURCE,'www'],cwd=ROOT))) as archive:
 for entry in archive:
  if not entry.isfile():continue
  relative=Path(entry.name).relative_to('www');data=archive.extractfile(entry).read()
  if relative.name in {'service-worker.js','sw.js'}:
   # Do not install the Android www worker with a nested, competing scope.
   data=b"/* Browser release uses the verified root worker only. */\nimportScripts('../../service-worker.js');\n"
  else:data=project(str(relative),data)
  path=DEST/relative;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
# Installed identity stays at the established origin/scope, not in a new release.
for name in ['manifest.webmanifest','icon-192.png','icon-512.png']:
 data=(ROOT/name).read_bytes()
 if name=='manifest.webmanifest':(DEST/name).write_bytes(data)
entries=[]
for path in sorted(DEST.rglob('*')):
 if not path.is_file() or path.name in {'pwa-manifest.js','SHA256SUMS.txt'}:continue
 if 'assets/music/' in str(path.relative_to(DEST)):continue
 entries.append([str(path.relative_to(ROOT)),hashlib.sha256(path.read_bytes()).hexdigest()])
for name in ['index.html','manifest.webmanifest','icon-192.png','icon-512.png']:
 entries.append([name,hashlib.sha256((ROOT/name).read_bytes()).hexdigest()])
entries.append(['./',hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()])
fingerprint=hashlib.sha256(json.dumps(entries).encode()+(ROOT/'service-worker.js').read_bytes()).hexdigest()[:12]
(DEST/'pwa-manifest.js').write_text('self.SEAMEN_BUILD='+json.dumps({'id':BUILD,'cache':'seamen-browser-'+BUILD+'-'+fingerprint,'files':entries},separators=(',',':'))+';\n')
(DEST/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(DEST))+'\n' for p in sorted(DEST.rglob('*')) if p.is_file() and p.name!='SHA256SUMS.txt'))
print('Prepared',BUILD,len(entries),'verified offline entries; soundtrack remains streamed')
