from pathlib import Path
import re, html, json
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Preformatted
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from pypdf import PdfReader
R=Path(__file__).resolve().parents[1]
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
INK=colors.HexColor('#12313f'); TEAL=colors.HexColor('#006b78'); MIST=colors.HexColor('#f1f6f8'); LINE=colors.HexColor('#d5e0e4')
styles={
 'p':ParagraphStyle('p',fontName='STSong-Light',fontSize=10.5,leading=17,spaceAfter=9,wordWrap='CJK',textColor=INK),
 'h1':ParagraphStyle('h1',fontName='STSong-Light',fontSize=25,leading=34,spaceAfter=24,textColor=INK,keepWithNext=True),
 'h2':ParagraphStyle('h2',fontName='STSong-Light',fontSize=20,leading=28,spaceAfter=17,textColor=INK,keepWithNext=True),
 'h3':ParagraphStyle('h3',fontName='STSong-Light',fontSize=13,leading=20,spaceBefore=12,spaceAfter=9,textColor=TEAL,keepWithNext=True),
 'cell':ParagraphStyle('cell',fontName='STSong-Light',fontSize=9,leading=14,wordWrap='CJK',textColor=INK),
 'code':ParagraphStyle('code',fontName='Courier',fontSize=7,leading=11,textColor=INK,backColor=MIST),
}
def inline(s):
 s=html.escape(s)
 s=re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)',lambda m:f'<link href="{m[2]}" color="#006b78">{m[1]}</link>',s)
 s=re.sub(r'\*\*(.+?)\*\*',r'<font color="#006b78">\1</font>',s)
 s=re.sub(r'`([^`]+)`',r'\1',s)
 return s
lines=(R/'content/reports/fastgpt-cnps-global-growth.md').read_text().splitlines();story=[];i=0
while i<len(lines):
 l=lines[i];i+=1
 if not l.strip():continue
 if l.startswith('<div class="page-break"'):story.append(PageBreak());continue
 if l.startswith('```'):
  code=[]
  while i<len(lines) and not lines[i].startswith('```'):code.append(lines[i]);i+=1
  i+=1;story.extend([Preformatted('\n'.join(code),styles['code']),Spacer(1,12)]);continue
 if l.startswith('|'):
  rows=[l]
  while i<len(lines) and lines[i].startswith('|'):rows.append(lines[i]);i+=1
  cells=[[c.strip() for c in row.strip().strip('|').split('|')] for row in rows]
  cells=[c for c in cells if not all(re.fullmatch(r'[-: ]+',x) for x in c)]
  data=[[Paragraph(inline(c),styles['cell']) for c in row] for row in cells]
  n=len(data[0]);width=A4[0]-96
  ratios={3:[.25,.42,.33],4:[.20,.30,.28,.22],5:[.12,.20,.24,.24,.20]}.get(n,[1/n]*n)
  t=Table(data,colWidths=[width*x for x in ratios],repeatRows=1,hAlign='LEFT')
  t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),MIST),('GRID',(0,0),(-1,-1),.5,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
  story.extend([t,Spacer(1,13)]);continue
 m=re.match(r'^(#{1,3}) (.+)',l)
 if m:story.append(Paragraph(inline(m[2]),styles['h'+str(len(m[1]))]));continue
 if l.startswith('- '):story.append(Paragraph('· '+inline(l[2:]),styles['p']));continue
 story.append(Paragraph(inline(l),styles['p']))
def frame(c,doc):
 w,h=A4;c.saveState();c.setStrokeColor(LINE);c.line(48,h-39,w-48,h-39)
 c.setFillColor(TEAL);c.setFont('Helvetica',8);c.drawString(48,h-29,'CNPS.AI / FASTGPT GLOBAL GROWTH PLAYBOOK')
 c.setFillColor(INK);c.setFont('Helvetica',8);c.drawString(48,28,'Public planning edition | 2026-09-03');c.drawRightString(w-48,28,str(doc.page));c.restoreState()
out=R/'output/pdf/fastgpt-cnps-global-growth.pdf';out.parent.mkdir(parents=True,exist_ok=True)
doc=SimpleDocTemplate(str(out),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=60,bottomMargin=48,title='FastGPT x CNPS Global Growth Playbook',author='CNPS.AI')
doc.build(story,onFirstPage=frame,onLaterPages=frame)
reader=PdfReader(out);counts=[len(p.extract_text() or '') for p in reader.pages]
assert len(counts)>20
assert min(counts)>100, counts
result={'pages':len(counts),'characters_by_page':counts,'min_characters_per_page':min(counts),'pdf_bytes':out.stat().st_size}
(R/'research/pdf-validation.json').write_text(json.dumps(result,indent=2))
print(result)
