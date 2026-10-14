"""Isolated offline OCR/conversion. All intermediate bytes live in tmpfs."""
import os,sys,json,io,tempfile,subprocess,csv,resource,re
from pathlib import Path
resource.setrlimit(resource.RLIMIT_AS,(1024*1024*1024,1024*1024*1024))
resource.setrlimit(resource.RLIMIT_CPU,(65,65))
MAX_TEXT=500000
ENV={'PATH':'/usr/local/bin:/usr/bin:/bin','LANG':'C.UTF-8','HOME':'/tmp','OMP_THREAD_LIMIT':'1','OPENBLAS_NUM_THREADS':'1'}
def run(args,timeout=25):
 r=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,env=ENV,timeout=timeout)
 if r.returncode or len(r.stdout)>4000000:raise ValueError('conversion_failed')
 return r.stdout

def ocr(image,kind,number):
 from PIL import Image,ImageOps
 Image.MAX_IMAGE_PIXELS=24000000
 with Image.open(image) as im:
  if im.width*im.height>24000000 or getattr(im,'n_frames',1)>1:raise ValueError('image_limit')
  im=ImageOps.exif_transpose(im).convert('RGB');size=im.size;im.save(image.with_suffix('.ocr.png'))
 rows=csv.DictReader(io.StringIO(run(['tesseract',str(image.with_suffix('.ocr.png')),'stdout','-l','chi_sim+eng','--psm','3','tsv']).decode('utf-8')),delimiter='\t')
 lines={}
 for row in rows:
  text=row.get('text','').strip();conf=float(row.get('conf','-1'))
  if not text or conf<0:continue
  key=(row['block_num'],row['par_num'],row['line_num']);lines.setdefault(key,[]).append((text,conf,int(row['left']),int(row['top']),int(row['width']),int(row['height'])))
 grouped=[]
 for words in lines.values():
  text=' '.join(w[0] for w in words);text=re.sub(r'(?<=[\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])','',text);confidence=round(sum(w[1] for w in words)/len(words),1)
  left=min(w[2] for w in words);top=min(w[3] for w in words);right=max(w[2]+w[4] for w in words);bottom=max(w[3]+w[5] for w in words)
  grouped.append({'text':text,'confidence':confidence,'box':[left,top,right,bottom]})
 segments=[]
 for n,line in enumerate(grouped,1):
  # Keep nearby lines in the same visual column so a field label and its value
  # can be retrieved together instead of losing the value on the next line.
  x,y,_,_=line['box'];near=[l for l in grouped if abs(l['box'][0]-x)<=max(60,size[0]*0.06) and y-35<=l['box'][1]<=y+min(190,size[1]*0.17)]
  near.sort(key=lambda l:(l['box'][1],l['box'][0]));text=' | '.join(l['text'] for l in near);confidence=round(sum(l['confidence'] for l in near)/len(near),1)
  left=min(l['box'][0] for l in near);top=min(l['box'][1] for l in near);right=max(l['box'][2] for l in near);bottom=max(l['box'][3] for l in near)
  for off in range(0,len(text),1400):segments.append({'text':text[max(0,off-100):off+1400],'location':{'kind':kind,'number':number,'part':n,'method':'ocr','confidence':confidence,'box':[left,top,right-left,bottom-top],'imageSize':list(size)}})

 return segments

def pdf_segments(file,kind='page',legacy=False):
 from pypdf import PdfReader
 reader=PdfReader(str(file),strict=True)
 if reader.is_encrypted:raise ValueError('encrypted')
 if len(reader.pages)>300:raise ValueError('page_limit')
 result=[];ocr_count=0
 for n,page in enumerate(reader.pages,1):
  text=re.sub(r'\s+',' ',page.extract_text() or '').strip()
  if len(text)>=80:
   for off in range(0,len(text),1400):result.append({'text':text[max(0,off-100):off+1400],'location':{'kind':kind,'number':n,'part':off//1400+1,'method':'legacy_conversion' if legacy else 'text'}})
  else:
   ocr_count+=1
   if ocr_count>20:raise ValueError('ocr_page_limit')
   prefix=file.parent/('page-'+str(n));run(['pdftoppm','-f',str(n),'-l',str(n),'-scale-to','2400','-png','-singlefile',str(file),str(prefix)])
   result.extend(ocr(prefix.with_suffix('.png'),kind,n))
 return result

def job(data,mime):
 with tempfile.TemporaryDirectory(prefix='cnps-job-',dir='/tmp') as name:
  directory=Path(name)
  if mime in ['image/png','image/jpeg']:
   file=directory/('source.png' if mime=='image/png' else 'source.jpg');file.write_bytes(data);segments=ocr(file,'image',1)
  elif mime=='application/pdf':
   file=directory/'source.pdf';file.write_bytes(data);segments=pdf_segments(file)
  elif mime in ['application/msword','application/vnd.ms-powerpoint']:
   file=directory/('source.doc' if mime=='application/msword' else 'source.ppt');file.write_bytes(data)
   import olefile
   if not olefile.isOleFile(str(file)):raise ValueError('conversion_failed')
   with olefile.OleFileIO(str(file)) as ole:
    names=['/'.join(parts) for parts in ole.listdir()]
    expected='WordDocument' if mime=='application/msword' else 'PowerPoint Document'
    if not ole.exists(expected) or any(re.search(r'(^|/)(VBA|_VBA_PROJECT_CUR)(/|$)',n,re.I) for n in names):raise ValueError('conversion_failed')
   profile=directory/'profile';(profile/'user').mkdir(parents=True)
   (profile/'user'/'registrymodifications.xcu').write_text('''<?xml version="1.0"?><oor:items xmlns:oor="http://openoffice.org/2001/registry"><item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="MacroSecurityLevel" oor:op="fuse"><value>3</value></prop></item><item oor:path="/org.openoffice.Office.Common/Save/Document"><prop oor:name="SaveRelativeInternet" oor:op="fuse"><value>false</value></prop></item></oor:items>''')
   run(['libreoffice','-env:UserInstallation='+profile.as_uri(),'--headless','--nologo','--nodefault','--norestore','--nolockcheck','--convert-to','pdf','--outdir',str(directory),str(file)],timeout=40)
   converted=directory/'source.pdf'
   if not converted.is_file() or converted.stat().st_size>40000000:raise ValueError('conversion_failed')
   segments=pdf_segments(converted,'converted_page' if mime=='application/msword' else 'slide',True)
  else:raise ValueError('unsupported')
  total=sum(len(s['text']) for s in segments)
  if total>MAX_TEXT or len(segments)>3000:raise ValueError('text_limit')
  return {'status':'ready' if segments else 'no_text','segments':segments,'characters':total,'engine':'tesseract+libreoffice','schema':2}
if __name__=='__main__':
 try:
  data=sys.stdin.buffer.read(37*1024*1024+1)
  if len(data)>37*1024*1024:raise ValueError('input_limit')
  print(json.dumps(job(data,sys.argv[1]),ensure_ascii=False,separators=(',',':')))
 except Exception as e:
  code=str(e) if str(e) in ['encrypted','page_limit','ocr_page_limit','image_limit','conversion_failed','text_limit','input_limit','unsupported'] else 'parse_error'
  print(json.dumps({'status':'parse_error','segments':[],'reason':code}));sys.exit(2)
