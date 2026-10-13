import os,json,subprocess,signal,threading,hmac
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
SLOTS=threading.BoundedSemaphore(1)
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def reply(self,status,value):
  body=json.dumps(value,separators=(',',':')).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
 def do_POST(self):
  expected='Bearer '+os.environ['CRM_OCR_WORKER_KEY']
  if not hmac.compare_digest(self.headers.get('Authorization',''),expected):return self.reply(401,{'error':'unauthorized'})
  if self.path!='/extract':return self.reply(404,{'error':'not_found'})
  try:
   length=int(self.headers.get('Content-Length','0'));mime=self.headers.get('Content-Type','')
   if not 0<length<=37*1024*1024 or mime not in ['application/pdf','image/png','image/jpeg','application/msword','application/vnd.ms-powerpoint']:return self.reply(400,{'error':'invalid_input'})
   if not SLOTS.acquire(blocking=False):return self.reply(503,{'error':'busy'})
   try:
    data=self.rfile.read(length)
    if len(data)!=length:return self.reply(400,{'error':'invalid_input'})
    proc=subprocess.Popen(['python','/worker/job.py',mime],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,start_new_session=True,env={'PATH':'/usr/local/bin:/usr/bin:/bin','LANG':'C.UTF-8'})
    try:out,_=proc.communicate(data,timeout=85)
    except subprocess.TimeoutExpired:
     os.killpg(proc.pid,signal.SIGKILL);proc.communicate();return self.reply(200,{'status':'parse_error','segments':[],'reason':'processing_timeout'})
    if proc.returncode not in [0,2] or len(out)>2400000:return self.reply(200,{'status':'parse_error','segments':[],'reason':'processing_limit'})
    value=json.loads(out);return self.reply(200,value)
   finally:SLOTS.release()
  except Exception:return self.reply(503,{'error':'processing_failed'})
 def do_GET(self):
  if self.path=='/health':return self.reply(200,{'status':'ok'})
  return self.reply(404,{'error':'not_found'})
ThreadingHTTPServer(('0.0.0.0',3300),Handler).serve_forever()
