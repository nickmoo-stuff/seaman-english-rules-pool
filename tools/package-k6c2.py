"""Package the small OFF-default opt-in tool only. Never builds/installs Android."""
from pathlib import Path
import hashlib,json,subprocess,zipfile
r=Path(__file__).resolve().parents[1]
for protected in ['www','native-patches/K6A','native-patches/K3H.1']:
 assert not subprocess.check_output(['git','diff','108ede8','--',protected],cwd=r),protected
assert b'TEST_PURCHASES_ENABLED=false' in (r/'native-patches/K6A/PurchaseTestPolicy.java').read_bytes()
log=(r/'qa/K6C2/gate-sequence.log').read_text();assert '41 PowerShell operation assertions' in log and 'Traceback' not in log
assert 'PASS 13 production-core fixture tests' in (r/'qa/K6C2/native-api.log').read_text()
items={p.name:p.read_bytes() for p in (r/'native-patches/K6C2').iterdir() if p.is_file()}
for p in (r/'qa/K6C2').glob('*.log'):items['qa/'+p.name]=p.read_bytes()
items['PACKAGE.json']=(json.dumps({'milestone':'K6C.2','gameVersion':'0.17.61','gameBuild':1591,'baselineCommit':'108ede8daf378811b720bcdaf05ee3f53c74bb14','toolBranch':'stage6-k6c2-debug-billing-test-gate','contents':'small opt-in tool, documentation and fixture logs; no game or Android wrapper','purchaseGatesOffByDefault':True,'actualWrapperModified':False,'androidBuilt':False,'deployed':False},indent=2)+'\n').encode()
items['SHA256SUMS.txt']=''.join(hashlib.sha256(data).hexdigest()+'  '+name+'\n' for name,data in sorted(items.items())).encode()
p=r/'downloads/SeamenPool-K6C2-debug-billing-test-gate-v0.17.61-build1591.zip';p.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(p,'w',zipfile.ZIP_DEFLATED) as z:
 for name,data in sorted(items.items()):z.writestr(name,data)
with zipfile.ZipFile(p) as z:
 assert z.testzip() is None
 for name,data in items.items():assert z.read(name)==data
print(json.dumps({'path':str(p),'bytes':p.stat().st_size,'files':len(items),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'integrity':'PASS'}))
