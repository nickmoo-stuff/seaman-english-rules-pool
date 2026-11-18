"""Prove the approved game/native payload is unchanged and literal media resolve."""
from pathlib import Path
import hashlib,re,subprocess
r=Path(__file__).resolve().parents[1]
entries=subprocess.check_output(['git','ls-tree','-rz','bd79490','--','www','native-patches'],cwd=r).split(b'\0')
expected=set()
for entry in entries:
 if not entry:continue
 meta,name=entry.split(b'\t');path=name.decode();expected.add(path);raw=(r/path).read_bytes();blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
 assert blob==meta.decode().split()[2],path+' differs from approved content freeze'
actual={str(p.relative_to(r)) for prefix in ['www','native-patches'] for p in (r/prefix).rglob('*') if p.is_file()}
assert actual==expected,{'added':list(actual-expected),'missing':list(expected-actual)}
refs=[]
for p in (r/'www').glob('*'):
 if p.suffix not in ['.js','.html','.css','.webmanifest']:continue
 for ref in re.findall(r'''["'](assets/[^"'`<>]+)["']''',p.read_text()):
  if '${' in ref:continue
  assert (r/'www'/ref).exists(),(str(p),ref)
  refs.append(ref)
print(f'PASS frozen bd79490 payload: all {len(expected)} game/native files byte-identical, no additions/deletions, {len(refs)} literal media references resolve; physics, dialogue, artwork, saves, purchases-disabled bridge and version/build preserved')
