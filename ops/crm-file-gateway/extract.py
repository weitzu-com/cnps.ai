#!/usr/bin/env python3
"""Bounded, offline text extraction. No macros, external relationships or OCR execution."""
import sys,json,io,zipfile,re,resource,xml.etree.ElementTree as ET
if sys.platform.startswith("linux"):
 resource.setrlimit(resource.RLIMIT_AS,(512*1024*1024,512*1024*1024))
resource.setrlimit(resource.RLIMIT_CPU,(8,8))
MAX_TEXT=500000

def xml(data):
 if len(data)>8000000 or re.search(br'<!\s*(DOCTYPE|ENTITY)',data,re.I):raise ValueError()
 return ET.fromstring(data)
def texts(node):return ' '.join(x.text or '' for x in node.iter() if x.tag.rsplit('}',1)[-1]=='t')
def extract(data,mime):
 units=[]
 if mime=='application/pdf':
  from pypdf import PdfReader
  reader=PdfReader(io.BytesIO(data),strict=True)
  if reader.is_encrypted or len(reader.pages)>300:raise ValueError()
  for n,p in enumerate(reader.pages,1):units.append(('page',n,p.extract_text() or ''))
 elif mime in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation']:
  with zipfile.ZipFile(io.BytesIO(data)) as z:
   files=z.infolist()
   if len(files)>3000 or len({x.filename for x in files})!=len(files) or sum(x.file_size for x in files)>40000000 or any(x.file_size>8000000 or x.flag_bits&1 or x.file_size/max(1,x.compress_size)>200 for x in files):raise ValueError()
   if mime.endswith('wordprocessingml.document'):
    root=xml(z.read('word/document.xml'))
    for n,p in enumerate([x for x in root.iter() if x.tag.rsplit('}',1)[-1]=='p'],1):units.append(('paragraph',n,texts(p)))
   else:
    # Follow the presentation's actual slide ordering, not arbitrary zip order.
    rels={x.attrib['Id']:x.attrib['Target'] for x in xml(z.read('ppt/_rels/presentation.xml.rels')) if x.attrib.get('TargetMode')!='External'}
    root=xml(z.read('ppt/presentation.xml'))
    slide_ids=[x for x in root.iter() if x.tag.rsplit('}',1)[-1]=='sldId']
    if len(slide_ids)>300:raise ValueError()
    for n,item in enumerate(slide_ids,1):
     rid=next(v for k,v in item.attrib.items() if k.endswith('}id'))
     target=rels[rid]
     target=target[1:] if target.startswith('/') else 'ppt/'+target
     if not re.fullmatch(r'ppt/slides/slide[0-9]+\.xml',target):raise ValueError()
     units.append(('slide',n,texts(xml(z.read(target)))))
 elif mime in ['text/plain','text/csv']:
  for n,line in enumerate(data.decode('utf-8-sig',errors='strict').splitlines(),1):units.append(('line',n,line))
 else:return {'status':'unsupported','segments':[]}
 total=0;segments=[]
 for kind,n,text in units:
  text=re.sub(r'\s+',' ',text).strip();total+=len(text)
  if total>MAX_TEXT:raise ValueError()
  for offset in range(0,len(text),1400):
   value=text[max(0,offset-100):offset+1400]
   if value:segments.append({'location':{'kind':kind,'number':n,'part':offset//1400+1},'text':value})
 if len(segments)>3000:raise ValueError()
 return {'status':'ready' if segments else 'no_text','segments':segments,'characters':total}
if __name__=='__main__':
 try:
  data=sys.stdin.buffer.read(37*1024*1024+1)
  if len(data)>37*1024*1024:raise ValueError()
  print(json.dumps(extract(data,sys.argv[1]),ensure_ascii=False,separators=(',',':')))
 except Exception:
  print('{"status":"parse_error","segments":[]}');sys.exit(2)
