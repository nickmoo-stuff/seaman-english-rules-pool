"""Local-only test server: switch a /pool/ deployment from actual v0.17.0 to candidate."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import subprocess,json
from urllib.parse import urlsplit,parse_qs
ROOT=Path(__file__).resolve().parents[1]
OLD={name:subprocess.check_output(['git','show','53db353:'+name],cwd=ROOT) for name in ['index.html','service-worker.js','sw.js']}
state={'build':'old','fault':None}
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_POST(self):
  args=parse_qs(urlsplit(self.path).query)
  state.update(build=args.get('build',[state['build']])[0],fault=args.get('fault',[None])[0])
  self.send_response(200);self.end_headers();self.wfile.write(json.dumps(state).encode())
 def do_GET(self):
  path=urlsplit(self.path).path
  if not path.startswith('/pool/'):
   self.send_error(404);return
  relative=path[len('/pool/'):] or 'index.html'
  if state['build']=='old' and relative in OLD:
   data=OLD[relative];self.send_response(200);self.send_header('Content-Type','application/javascript' if relative.endswith('.js') else 'text/html');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(data);return
  if state['fault'] and relative==state['fault']:
   self.send_response(200);self.send_header('Content-Type','application/javascript');self.end_headers();self.wfile.write(b'/* deliberately incomplete deploy */');return
  self.path='/'+relative+('?' + urlsplit(self.path).query if urlsplit(self.path).query else '')
  return super().do_GET()
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
ThreadingHTTPServer(('127.0.0.1',8022),Handler).serve_forever()
