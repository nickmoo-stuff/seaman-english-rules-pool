"""Local deployment simulator, retaining the real approved old worker and caches."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
import subprocess,json,socket
ROOT=Path(__file__).resolve().parents[1]
SNAP={}
for build,commit in [('old','3606481'),('broken','f7a53ba')]:
 SNAP[build]={n:subprocess.check_output(['git','show',commit+':'+n],cwd=ROOT) for n in ['index.html','service-worker.js','sw.js','manifest.webmanifest','icon-192.png','icon-512.png']}
state={'build':'new','fault':'','kind':'corrupt'}
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def end_headers(self):self.send_header('Cache-Control','no-store');super().end_headers()
 def do_POST(self):
  if urlsplit(self.path).path!='/control':self.send_error(404);return
  args=parse_qs(urlsplit(self.path).query,keep_blank_values=True)
  state.update({k:v[0] for k,v in args.items() if k in state})
  self.send_response(200);self.end_headers();self.wfile.write(json.dumps(state).encode())
 def do_GET(self):
  path=urlsplit(self.path).path
  if not path.startswith('/pool/'):
   self.send_error(404);return
  relative=path[6:] or 'index.html'
  if relative=='upgrade.html':relative='index.html'
  if relative==state['fault']:
   if state['kind']=='missing':self.send_error(404);return
   if state['kind']=='interrupt':
    self.send_response(200);self.send_header('Content-Length','200000');self.end_headers();self.wfile.write(b'incomplete');self.wfile.flush();self.close_connection=True;self.connection.shutdown(socket.SHUT_RDWR);return
   self.send_response(200);self.send_header('Content-Type','application/javascript');self.end_headers();self.wfile.write(b'/* incorrect deploy bytes */');return
  if relative in SNAP.get(state['build'],{}):
   self.send_response(200);self.send_header('Content-Type',self.guess_type(relative));self.end_headers();self.wfile.write(SNAP[state['build']][relative]);return
  self.path='/'+relative+('?' + urlsplit(self.path).query if urlsplit(self.path).query else '')
  super().do_GET()
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT),**kw)
ThreadingHTTPServer(('127.0.0.1',8023),Handler).serve_forever()
