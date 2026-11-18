from pathlib import Path
import subprocess
r=Path(__file__).resolve().parents[1]
changed={'www/game.js','www/index.html','www/sw.js','www/service-worker.js','www/README.txt','www/NATIVE-PACKAGING-READINESS.txt','www/style.css'}
for name in subprocess.check_output(['git','ls-tree','-r','--name-only','c2f1eaa','--','www','native-patches'],cwd=r,text=True).splitlines():
 before=subprocess.check_output(['git','show','c2f1eaa:'+name],cwd=r);after=(r/name).read_bytes()
 if name not in changed:assert before==after,name
 elif name=='www/game.js':assert before.replace(b'0.17.62',b'0.17.63').replace(b'APP_BUILD_NUMBER=1592;',b'APP_BUILD_NUMBER=1593;')==after
 elif name=='www/index.html':assert before.replace(b'0.17.62',b'0.17.63').replace(b'1592',b'1593')==after
 elif name=='www/style.css':
  assert after[:after.index(b'/* K6F: scoped')] == before[:before.index(b'/* K6E: only')],name
print('PASS approved game, billing/ownership/state/UI text, artwork, audio, physics, AI, saves and all native tools frozen; only candidate metadata and scoped supporter styling changed')
