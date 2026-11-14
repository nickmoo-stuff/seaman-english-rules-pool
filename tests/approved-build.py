"""Check exact approved game parity, full assets and verified PWA inventory."""
from pathlib import Path
import hashlib,json,re,subprocess,os,sys
from urllib.parse import urlsplit,unquote
ROOT=Path(__file__).resolve().parents[1];SOURCE=Path(os.environ.get('SEAMEN_APPROVED_SOURCE',ROOT.parent/'seamen-pool-development'))
sys.path.insert(0,str(ROOT/'tools'))
from browser_projection import project
COMMIT='aa7023364d48bf5d2c673b9aa9426f0089821ea0';BUNDLE=ROOT/'releases/v0.17.52-b1582'
names=subprocess.check_output(['git','ls-tree','-r','--name-only',COMMIT,'www'],cwd=SOURCE,text=True).splitlines()
assert {str(p.relative_to(BUNDLE)) for p in BUNDLE.rglob('*') if p.is_file()}=={str(Path(p).relative_to('www')) for p in names}|{'pwa-manifest.js','SHA256SUMS.txt'}
for name in names:
 expected=subprocess.check_output(['git','show',COMMIT+':'+name],cwd=SOURCE);relative=Path(name).relative_to('www')
 expected=project(str(relative),expected)
 assert (BUNDLE/relative).read_bytes()==expected,'Unexpected departure from approved game: '+str(relative)
 if relative.suffix in {'.js','.css','.html'}:
  text=expected.decode();refs=re.findall(r'''["'`]((?:\./)?assets/[^"'`]+)["'`]''',text)
  if relative.suffix=='.html':refs+=re.findall(r'''(?:src|href)=["']([^"']+)["']''',text)
  for ref in refs:
   if '$' in ref or urlsplit(ref).scheme or ref.startswith(('#','//')):continue
   assert (BUNDLE/unquote(urlsplit(ref).path)).exists(),ref
for line in (BUNDLE/'SHA256SUMS.txt').read_text().splitlines():
 digest,name=line.split('  ',1);assert hashlib.sha256((BUNDLE/name).read_bytes()).hexdigest()==digest,name
payload=json.loads((BUNDLE/'pwa-manifest.js').read_text().removeprefix('self.SEAMEN_BUILD=').rstrip(';\n'))
assert payload['id']=='v0.17.52-b1582' and payload['cache'].startswith('seamen-browser-v0.17.52-b1582-')
for name,digest in payload['files']:
 path=ROOT/('index.html' if name=='./' else name);assert hashlib.sha256(path.read_bytes()).hexdigest()==digest,name
assert all('assets/music/' not in name for name,_ in payload['files'])
for name in ['id','scope','start_url']:
 current=json.loads((ROOT/'manifest.webmanifest').read_text())
 old=json.loads(subprocess.check_output(['git','show','53db353:manifest.webmanifest'],cwd=ROOT))
 assert current[name]==old[name],name+' installed identity changed'
print('PASS approved parity with explicit browser audio/advisory/metadata projection for',len(names),'complete source files, Lesson 3 unchanged, release-only mode, relative assets, checksums,',len(payload['files']),'PWA entries and preserved installed PWA identity/scope')
