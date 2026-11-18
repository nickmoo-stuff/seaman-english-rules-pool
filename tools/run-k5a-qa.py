#!/usr/bin/env python3
"""Whole-game K5A checks against development and an isolated release projection.
Only localhost test servers and disposable browser contexts are used.
"""
from pathlib import Path
import concurrent.futures,contextlib,datetime,functools,http.server,json,os,shutil,subprocess,sys,threading,time
root=Path(__file__).resolve().parents[1];out=root/'qa/K5A';out.mkdir(parents=True,exist_ok=True)
suites=['k5a-freeze.py','k4-consistency.py','k4a4-artwork.py','k4b-assets.py']+sorted(p.name for p in (root/'tests').glob('*.cjs') if p.name not in ['alpha-release.cjs','touch-input.cjs'])
requested=sys.argv[1:]
if requested:
 assert set(requested)<=set(suites),requested
 suites=requested
projection=Path('/tmp/seamen-k5a-release/www');projection.parent.mkdir(parents=True,exist_ok=True)
if projection.exists():shutil.rmtree(projection)
shutil.copytree(root/'www',projection)
p=projection/'game.js';p.write_text(p.read_text().replace("const BUILD_MODE='development'","const BUILD_MODE='release'"))
class QuietHandler(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def copyfile(self,source,outputfile):
  try:super().copyfile(source,outputfile)
  except (ConnectionResetError,BrokenPipeError):pass
servers=[]
try:
 for port,directory in [(8030,root/'www'),(8031,projection)]:
  server=http.server.ThreadingHTTPServer(('127.0.0.1',port),functools.partial(QuietHandler,directory=str(directory)))
  threading.Thread(target=server.serve_forever,daemon=True).start();servers.append(server)
 def run(suite):
  env={**os.environ,'TEST_URL':'http://127.0.0.1:'+('8031' if suite in ['k4-entitlement.cjs','lesson-three-hotfix.cjs'] else '8030')+'/','RELEASE_TEST_URL':'http://127.0.0.1:8031/','TEST_ARTIFACT_DIR':'/tmp/seamen-k5a-artifacts/'+suite,'SCENE_PREFIX':''}
  cmd=['python' if suite.endswith('.py') else 'node','tests/'+suite];start=time.monotonic()
  try:
   result=subprocess.run(cmd,cwd=root,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=1200 if suite in ['theatre-responsive.cjs','supporter-restore.cjs'] else 480);code=result.returncode;output=result.stdout
  except subprocess.TimeoutExpired as e:code=124;output=str(e)
  (out/(suite+'.log')).write_text('Command: '+' '.join(cmd)+'\nTEST_URL='+env['TEST_URL']+'\n'+output)
  item={'suite':suite,'exitCode':code,'status':'PASS' if code==0 else 'NOT TESTED' if code==77 else 'FAIL','seconds':round(time.monotonic()-start,2)}
  print(item['status']+' '+suite,flush=True);return item
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:results=list(executor.map(run,suites))
 destination=out/('results.json' if not requested else 'focused-results.json')
 destination.write_text(json.dumps({'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseline':'bd794909aed197ec85d3338e9af682856fdba6a9','version':'0.17.59','build':1589,'tests':results,'counts':{status:sum(x['status']==status for x in results) for status in ['PASS','FAIL','NOT TESTED']},'limitations':['Chromium on Linux, HTTP; no physical Android/iOS or real Google Play transactions.','Ownership bridge replies are fixtures.','Historical alpha packaging and milestone-specific diff-only audits are excluded.']},indent=2)+'\n')
 raise SystemExit(1 if any(x['status']=='FAIL' for x in results) else 0)
finally:
 for server in servers:server.shutdown();server.server_close()
