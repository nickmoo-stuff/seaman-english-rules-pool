#!/usr/bin/env python3
"""Focused name correction/release regression; no Android builds or payments."""
from pathlib import Path
import concurrent.futures,functools,http.server,threading,subprocess,os,time,json,datetime,shutil,sys
r=Path(__file__).resolve().parents[1];out=r/'qa/K6G';out.mkdir(exist_ok=True,parents=True)
suites=['k6g-names.cjs','k6g-migration.cjs','campaign-regression.cjs','k5a-saves.cjs','k5a-multiplayer.cjs','k4-entitlement.cjs','k6a-service.cjs','k6e-release.cjs','k4-consistency.py','k6g-preservation.py']
if sys.argv[1:]:suites=sys.argv[1:]
projection=Path('/tmp/seamen-k6g-release/www');projection.parent.mkdir(exist_ok=True,parents=True)
if projection.exists():shutil.rmtree(projection)
shutil.copytree(r/'www',projection);p=projection/'game.js';p.write_text(p.read_text().replace("const BUILD_MODE='development'","const BUILD_MODE='release'"))
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def copyfile(self,source,output):
  try:super().copyfile(source,output)
  except (BrokenPipeError,ConnectionResetError):pass
servers=[]
try:
 for port,directory in [(8030,r/'www'),(8031,projection)]:
  s=http.server.ThreadingHTTPServer(('127.0.0.1',port),functools.partial(Quiet,directory=str(directory)));threading.Thread(target=s.serve_forever,daemon=True).start();servers.append(s)
 def run(name):
  env={**os.environ,'TEST_URL':'http://127.0.0.1:'+('8031' if name in ['k4-entitlement.cjs'] else '8030')+'/','RELEASE_TEST_URL':'http://127.0.0.1:8031/','TEST_ARTIFACT_DIR':'/tmp/seamen-k6g/'+name};start=time.monotonic();cmd=['python' if name.endswith('.py') else 'node','tests/'+name]
  try:v=subprocess.run(cmd,cwd=r,env=env,capture_output=True,text=True,timeout=360);code=v.returncode;log=v.stdout+v.stderr
  except subprocess.TimeoutExpired as e:code=124;log=str(e)
  (out/(name+'.log')).write_text('Command: '+' '.join(cmd)+'\n'+log);item={'suite':name,'status':'PASS' if code==0 else 'NOT TESTED' if code==77 else 'FAIL','exitCode':code,'seconds':round(time.monotonic()-start,2)};print(item['status'],name,flush=True);return item
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(run,suites))
 data={'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseline':'ff5c1b9','version':'1.0.0','build':1595,'tests':results,'counts':{s:sum(t['status']==s for t in results) for s in ['PASS','FAIL','NOT TESTED']},'limitations':['Linux Chromium, not a physical Android app restart. Persistent Chromium profile is closed/reopened on disk.','Compact Story win uses real physics/EPA rules on a test fixture; no artificial success button.','Native ownership replies are mocks, not real Play transactions.','Android wrapper/signing/AAB and Play code availability are unavailable.']};(out/('results.json' if not sys.argv[1:] else 'focused-results.json')).write_text(json.dumps(data,indent=2)+'\n');raise SystemExit(1 if data['counts']['FAIL'] else 0)
finally:
 for s in servers:s.shutdown();s.server_close()
