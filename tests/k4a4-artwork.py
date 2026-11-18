"""Check approved cutout identity, alpha and active references without rewriting pixels."""
from pathlib import Path
import hashlib,json,subprocess,io
from PIL import Image
root=Path(__file__).resolve().parents[1]
entries=json.loads((root/'docs/K4/asset-manifest.json').read_text())['assets']
for entry in entries:
 if entry['file'][:2] not in ['01','02','03','04','05']:continue
 raw=(root/'www/assets/k4'/entry['file']).read_bytes()
 assert hashlib.sha256(raw).hexdigest()==entry['sha256']
 im=Image.open(io.BytesIO(raw));assert im.mode=='RGBA' and im.getextrema()[-1][0]==0,entry['file']
 if entry['file'][:2]!='03':
  assert raw==subprocess.check_output(['git','show','d7d3bff:www/assets/k4/'+entry['file']],cwd=root)
 else:
  assert entry['sha256']=='5c57d1b1e95bb1c781a9b90ce531de5df960a28356e68aeeea51000838ec3834'
  assert entry['size']==[1043,1508]
old='03_Socks_And_Sandals.png';new='03_Socks_And_Sandals_approved.png'
assert not (root/'www/assets/k4'/old).exists()
for name in ['chapter4.js','sw.js','service-worker.js']:
 text=(root/'www'/name).read_text();assert old not in text and new in text,name
print('PASS all five approved cutouts have alpha transparency; Socks SHA-256 matches exact supplied PNG; four other cutouts unchanged; obsolete Socks file/reference removed and both offline inventories updated')
