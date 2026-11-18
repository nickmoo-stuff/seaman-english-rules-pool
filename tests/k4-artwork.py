"""Exact approved-artwork audit and artwork-only source delta from K4A.2."""
from pathlib import Path
import hashlib,json,subprocess,sys,zipfile
from PIL import Image
r=Path(__file__).resolve().parents[1];base='3a54fffd02555a2c98b75730b5f2d8823622e671'
def old(name):return subprocess.check_output(['git','show',base+':'+name],cwd=r)
manifest=json.loads((r/'docs/K4/asset-manifest.json').read_text());replacements=[x for x in manifest['assets'] if x.get('sourceArchive')=='threePNGs.zip'];assert len(replacements)==3
archive=zipfile.ZipFile(sys.argv[1]) if len(sys.argv)>1 else None
if archive:assert hashlib.sha256(Path(sys.argv[1]).read_bytes()).hexdigest()==manifest['additionalSources'][0]['archiveSha256']
for entry in replacements:
 p=r/'www/assets/k4'/entry['file'];raw=p.read_bytes()
 assert hashlib.sha256(raw).hexdigest()==entry['sha256']
 if archive:assert raw==archive.read(entry['originalFile']),entry['file']+' pixels/encoding modified'
 im=Image.open(p);assert im.mode=='RGBA';alpha=im.getchannel('A');hist=alpha.histogram()
 assert alpha.getextrema()[0]==0 and alpha.getextrema()[1]>=250 and hist[0]>0 and sum(hist[1:255])>0
 assert list(alpha.getextrema())==entry['alphaExtrema'];assert list(im.size)==entry['size']
 assert not (r/'www/assets/k4'/entry['replaces']).exists()
 for file in ['www/sw.js','www/service-worker.js']:
  content=(r/file).read_text();assert entry['file'] in content and entry['replaces'] not in content
 print('PASS exact PNG and alpha:',entry['originalFile'],im.size,alpha.getextrema())
# No runtime, dialogue, sizing, positioning, AI, physics, trophy or billing edits.
names=subprocess.check_output(['git','ls-tree','-r','--name-only',base,'www'],cwd=r,text=True).splitlines()
replaced={'www/assets/k4/'+x['replaces'] for x in replacements}
added={'www/assets/k4/'+x['file'] for x in replacements}
for name in names:
 if name in replaced:continue
 expected=old(name)
 if name in ['www/README.txt','www/NATIVE-PACKAGING-READINESS.txt']:continue
 if name in ['www/game.js','www/index.html','www/sw.js','www/service-worker.js']:
  expected=expected.replace(b'0.17.55',b'0.17.56').replace(b'01755',b'01756').replace(b'1585',b'1586')
 if name in ['www/sw.js','www/service-worker.js','www/chapter4.js']:
  for x in replacements:expected=expected.replace(x['replaces'].encode(),x['file'].encode())
 assert (r/name).read_bytes()==expected,'Unexpected non-artwork change: '+name
current={str(p.relative_to(r)) for p in (r/'www').rglob('*') if p.is_file()}
assert current==(set(names)-replaced)|added,'Unexpected web-file addition/removal'
assert (r/'tools/build-k4-dialogue.py').read_bytes()==old('tools/build-k4-dialogue.py')
for p in (r/'native-patches').rglob('*.java'):assert p.read_bytes()==old(str(p.relative_to(r)))
print('PASS all web files match baseline except the three image replacements/references, metadata and documentation; generator, scene settings and native Java unchanged')
if archive:archive.close()
