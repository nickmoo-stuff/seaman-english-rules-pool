"""Prove K6A changes only billing UI/service and version metadata in the game."""
from pathlib import Path
import subprocess
r=Path(__file__).resolve().parents[1];baseline='8228903'
def old(name):return subprocess.check_output(['git','show',baseline+':'+name],cwd=r)
def version(raw):return raw.replace(b'0.17.59',b'0.17.60').replace(b'01759',b'01760').replace(b'1589',b'1590')
names=subprocess.check_output(['git','ls-tree','-rz',baseline,'--','www','native-patches'],cwd=r).split(b'\0');expected=set();count=0
for row in names:
 if not row:continue
 name=row.split(b'\t')[1].decode();expected.add(name);before=old(name);after=(r/name).read_bytes()
 if name=='www/supporter.js':continue
 if name=='www/game.js':
  before=version(before)
  def outside(text):
   a=text.index(b'function refreshSupportArea()');b=text.index(b"document.getElementById('restoreSupporter')?.addEventListener",a);return text[:a]+text[b:]
  assert outside(before)==outside(after),'non-billing game logic changed'
 elif name=='www/index.html':assert version(before).replace(b'>Restore / check ownership<',b'>Restore Purchases<')==after
 elif name in ['www/README.txt','www/NATIVE-PACKAGING-READINESS.txt']:
  assert b'0.17.60' in after and b'K6A' in after and b'native-patches/K6A' in after,name
 elif name in ['www/sw.js','www/service-worker.js']:assert version(before)==after,name
 else:assert before==after,name
 count+=1
actual={str(p.relative_to(r)) for prefix in ['www','native-patches'] for p in (r/prefix).rglob('*') if p.is_file()};added=actual-expected
assert all(name.startswith('native-patches/K6A/') for name in added),added
assert expected<=actual
print(f'PASS {count} frozen payload files/normalised version metadata/billing packaging notes; only supporter service/UI changed; all AI/physics/Theatre/dialogue/artwork/cosmetics/trophies/save/gating logic and historical native sources preserved; new native files isolated under K6A')
