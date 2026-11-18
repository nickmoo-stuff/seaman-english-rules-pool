"""Approved K4B animation identity, timeline and unchanged K4A.4 artwork."""
from pathlib import Path
import json,hashlib,subprocess
from PIL import Image
r=Path(__file__).resolve().parents[1]
manifest=json.loads((r/'docs/K4/asset-manifest.json').read_text())
for a in manifest['assets']:
 p=r/'www/assets/k4'/a['file'];raw=p.read_bytes()
 assert raw==subprocess.check_output(['git','show','63f1b4d:www/assets/k4/'+a['file']],cwd=r),a['file']
 assert hashlib.sha256(raw).hexdigest()==a['sha256']
p=r/'www/assets/k4/09_spinball_wizard_2s.webp';im=Image.open(p);durations=[];hashes=[]
assert im.n_frames==16 and im.info['loop']==0
for i in range(im.n_frames):
 im.seek(i);im.load();durations.append(im.info['duration']);hashes.append(hashlib.sha256(im.tobytes()).hexdigest());assert im.mode=='RGBA' and im.getchannel('A').getextrema()[0]==0
assert durations==[125]*16 and len(set(hashes))==16
print('PASS exact approved artwork bytes, 16 distinct transparent WebP frames, original 125 ms frame timing and 2-second infinite loop')
