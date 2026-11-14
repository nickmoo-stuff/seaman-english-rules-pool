"""Copy the approved complete game into an immutable browser build and hash its offline bundle."""
from pathlib import Path
from browser_projection import project
import hashlib,json,subprocess,os
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path(os.environ.get('SEAMEN_APPROVED_SOURCE',ROOT.parent/'seamen-pool-development'));COMMIT='aa7023364d48bf5d2c673b9aa9426f0089821ea0'
BUILD='v0.17.52-b1582';DEST=ROOT/'releases'/BUILD
names=subprocess.check_output(['git','ls-tree','-r','--name-only',COMMIT,'www'],cwd=SOURCE,text=True).splitlines()
for name in names:
    data=subprocess.check_output(['git','show',COMMIT+':'+name],cwd=SOURCE)
    relative=Path(name).relative_to('www');target=DEST/relative
    data=project(str(relative),data)
    target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
# Root manifest/identity/icons remain at the installed PWA's original scope.
for name in ['manifest.webmanifest','icon-192.png','icon-512.png']:(ROOT/name).write_bytes((DEST/name).read_bytes())
entries=[]
for path in sorted(DEST.rglob('*')):
    if not path.is_file() or path.name in {'pwa-manifest.js','SHA256SUMS.txt'}:continue
    if 'assets/music/' in str(path.relative_to(DEST)):continue # Audio remains streamed, as in the approved game.
    entries.append([str(path.relative_to(ROOT)),hashlib.sha256(path.read_bytes()).hexdigest()])
for name in ['index.html','manifest.webmanifest','icon-192.png','icon-512.png']:
    entries.append([name,hashlib.sha256((ROOT/name).read_bytes()).hexdigest()])
entries.append(['./',hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()])
(DEST/'pwa-manifest.js').write_text('self.SEAMEN_BUILD='+json.dumps({'id':BUILD,'cache':'seamen-browser-'+BUILD+'-'+hashlib.sha256(json.dumps(entries).encode()+(ROOT/'service-worker.js').read_bytes()).hexdigest()[:12],'files':entries},separators=(',',':'))+';\n')
sums=''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(DEST))+'\n' for p in sorted(DEST.rglob('*')) if p.is_file() and p.name!='SHA256SUMS.txt')
(DEST/'SHA256SUMS.txt').write_text(sums)
print('Prepared approved browser build:',len(names),'source files;',len(entries),'verified offline entries; soundtrack kept online-only')
