from pathlib import Path
import re,html,json,hashlib
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Table,TableStyle,KeepTogether,Preformatted
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from pypdf import PdfReader

R=Path(__file__).resolve().parents[1]
data=json.loads((R/'content/reports/fastgpt-bilingual/parallel-content.json').read_text())
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
pdfmetrics.registerFont(UnicodeCIDFont('HeiseiMin-W3'))
INK=colors.HexColor('#12313f');TEAL=colors.HexColor('#006b78');MIST=colors.HexColor('#edf4f5');LINE=colors.HexColor('#cadadd')
WIDTH=A4[0]-96
def style(name,font='STSong-Light',size=10,leading=15,**kw):
 return ParagraphStyle(name,fontName=font,fontSize=size,leading=leading,textColor=INK,spaceAfter=7,**kw)
styles={
 'zh':style('zh',wordWrap='CJK'),
 'en':style('en','Helvetica',9.7,14.5,textTransform=None),
 'label':style('label','Helvetica',6.8,10,spaceBefore=7,keepWithNext=True),
 'titlezh':style('titlezh',size=24,leading=33,keepWithNext=True),
 'titleen':style('titleen','Helvetica-Bold',18,25,keepWithNext=True),
 'h2zh':style('h2zh',size=19,leading=27,keepWithNext=True),
 'h2en':style('h2en','Helvetica-Bold',13,19,keepWithNext=True),
 'h3zh':style('h3zh',size=12.5,leading=19,spaceBefore=10,keepWithNext=True),
 'h3en':style('h3en','Helvetica-Bold',10.5,16,keepWithNext=True),
 'cellzh':style('cellzh',size=8.8,leading=12.5,wordWrap='CJK'),
 'cellen':style('cellen','Helvetica',8.1,11.5),
 'codezh':style('codezh',size=8,leading=12),
 'codeen':style('codeen','Courier',7.6,11),
}
def inline(s):
 s=html.escape(s)
 s=re.sub(r'\[([^\]]+)\]\((https?://[^\s)]+)\)',lambda m:f'<link href="{m[2]}" color="#006b78">{m[1]}</link>',s)
 s=re.sub(r'\*\*(.+?)\*\*',r'<font color="#006b78">\1</font>',s)
 s=re.sub(r'`([^`]+)`',r'\1',s)
 s=re.sub(r'[\u3040-\u30ff]+',lambda m:'<font name="HeiseiMin-W3">'+m[0]+'</font>',s)
 return s
def paragraph(s,lang='zh',cell=False):return Paragraph(inline(s),styles[('cell' if cell else '')+lang])
def table_rows(s):
 rows=[]
 for l in s.splitlines():
  if re.fullmatch(r'\|[\s:|\-]+\|',l):continue
  rows.append([c.strip() for c in l.strip().strip('|').split('|')])
 return rows
def bilingual_table(zh,en):
 rows=[]
 for zr,er in zip(zh,en):rows.append([[paragraph(z,'zh',True),paragraph(e,'en',True)] for z,e in zip(zr,er)])
 n=len(rows[0]);ratios={2:[.3,.7],3:[.25,.39,.36],4:[.21,.29,.28,.22],5:[.09,.22,.25,.24,.20]}.get(n,[1/n]*n)
 t=Table(rows,colWidths=[WIDTH*x for x in ratios],repeatRows=1,hAlign='LEFT')
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),MIST),('GRID',(0,0),(-1,-1),.45,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
 return t
class Report(SimpleDocTemplate):
 def afterFlowable(self,flowable):
  if hasattr(flowable,'bookmark'):
   self.canv.bookmarkPage(flowable.bookmark)
   self.canv.addOutlineEntry(flowable.bookmark_title,flowable.bookmark,0,False)
def frame(c,doc):
 w,h=A4;c.saveState();c.setStrokeColor(LINE);c.line(48,h-39,w-48,h-39)
 c.setFont('Helvetica',7.5);c.setFillColor(TEAL);c.drawString(48,h-29,'CNPS.AI / FASTGPT / CHINESE–ENGLISH PLAYBOOK')
 c.setFillColor(INK);c.setFont('STSong-Light',8);c.drawString(48,28,'中英对照 / 研究日期 2026-09-03')
 c.setFont('Helvetica',8);c.drawRightString(w-48,28,str(doc.page));c.restoreState()
story=[]
story.append(Paragraph('FastGPT 携手 CNPS.AI<br/>出海增长与交付方案',styles['titlezh']))
story.append(Paragraph('FastGPT × CNPS.AI<br/>Global Growth and Delivery Playbook',styles['titleen']))
story.append(Spacer(1,12))
story.append(paragraph('中英文对照版｜28章｜239组内容对照｜原方案23轮实质修订'))
story.append(paragraph('Chinese–English parallel edition | 28 chapters | 239 paired content blocks | 23 substantive revisions in the source','en'))
story.append(paragraph('本版逐块对照原方案，补译原有英文模板，并校验数字、链接和表格。研究日期保持2026-09-03；翻译不表示重新核验外部资料。翻译校验不冒充新一轮23次策略迭代。'))
story.append(paragraph('This edition pairs every source block, adds Chinese translations of English templates, and checks numbers, links and tables. The research date remains 2026-09-03; translation does not imply fresh external verification. Translation checks are not another set of 23 strategy revisions.','en'))
story.append(paragraph('[在线对照版 / Read online](https://www.cnps.ai/resources/fastgpt-cnps-global-growth-bilingual)'))
story.append(Spacer(1,12))
story.append(Paragraph('术语对照 / Terminology',styles['h2zh']))
gz=[['术语','含义']]+[[g[0],g[2]] for g in data['glossary']]
ge=[['Term','Meaning']]+[[g[1],g[3]] for g in data['glossary']]
story.extend([bilingual_table(gz,ge),PageBreak()])
for b in data['blocks']:
 if b['id']=='b000':continue
 zh,en,kind=b['zh'],b['en'],b['type']
 if kind=='break':story.append(PageBreak());continue
 if kind=='heading':
  lev=len(re.match(r'^#+',zh)[0]);z=re.sub(r'^#+ ','',zh);e=re.sub(r'^#+ ','',en)
  p=Paragraph(inline(z),styles['h2zh' if lev==2 else 'h3zh'])
  if re.match(r'第\d+章',z):p.bookmark='chapter-'+str(b['chapter']);p.bookmark_title=z+' / '+e
  story.extend([p,Paragraph(inline(e),styles['h2en' if lev==2 else 'h3en'])]);continue
 if kind=='table':story.extend([bilingual_table(table_rows(zh),table_rows(en)),Spacer(1,12)]);continue
 if kind=='code':
  story.extend([Preformatted('\n'.join(zh.splitlines()[1:-1]),styles['codezh']),Spacer(1,7),Preformatted('\n'.join(en.splitlines()[1:-1]),styles['codeen']),Spacer(1,12)]);continue
 if kind=='list':
  for z,e in zip(zh.splitlines(),en.splitlines()):
   zp=paragraph('- '+z[2:]);zp.keepWithNext=True
   story.extend([zp,paragraph(e[2:],'en'),Spacer(1,4)])
  continue
 zp=paragraph(zh);zp.keepWithNext=True
 story.extend([Paragraph('ZH / CHINESE',styles['label']),zp,Paragraph('EN / ENGLISH',styles['label']),paragraph(en,'en'),Spacer(1,7)])
out=R/'output/pdf/fastgpt-cnps-global-growth-bilingual.pdf';out.parent.mkdir(parents=True,exist_ok=True)
doc=Report(str(out),pagesize=A4,leftMargin=48,rightMargin=48,topMargin=58,bottomMargin=47,title='FastGPT × CNPS.AI: Global Growth Playbook — Chinese–English',author='CNPS.AI')
doc.build(story,onFirstPage=frame,onLaterPages=frame)
reader=PdfReader(out);counts=[len(p.extract_text() or '') for p in reader.pages]
assert len(counts)>20
assert min(counts)>100,counts
assert len(reader.outline)==28,len(reader.outline)
result={'pages':len(counts),'bookmarked_chapters':len(reader.outline),'characters_by_page':counts,'min_characters_per_page':min(counts),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
(R/'research/fastgpt-bilingual-pdf-validation.json').write_text(json.dumps(result,indent=2)+'\n')
(R/'content/reports/fastgpt-bilingual/edition.json').write_text(json.dumps({'pages':len(counts),'bookmarked_chapters':len(reader.outline),'sha256':result['sha256']},indent=2)+'\n')
print(json.dumps(result))
