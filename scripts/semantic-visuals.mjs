/** Original explanatory geometry. No customer results, product renders or measured scores. */
const words = (en, zh, ar) => ({ en, zh, ar });
const caption = words('Evaluation map', '评估示意', 'مخطط التقييم');
const documentCaption = words('Buyer resource', '采购资料', 'مرجع للمشتري');
const p = d => `<path d="${d}"/>`;
const box = (x,y,w,h,r=8,c='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"${c?` class="${c}"`:''}/>`;
const circle = (x,y,r,c='') => `<circle cx="${x}" cy="${y}" r="${r}"${c?` class="${c}"`:''}/>`;
const arrow = (x,y,w=35) => p(`M${x} ${y}h${w}m-7-6 7 6-7 6`);
const lines = (x,y,w,n=3,gap=12) => Array.from({length:n},(_,i)=>p(`M${x} ${y+i*gap}h${w-(i%2)*12}`)).join('');
const paper = (x,y,w=70,h=95) => box(x,y,w,h,5,'sv-paper')+lines(x+13,y+22,w-26,4,14);
const chip = (x,y,w=76) => box(x,y,w,w,9,'sv-accent')+box(x+16,y+16,w-32,w-32,4)+[15,30,45,60].map(d=>p(`M${x+d} ${y-10}v10m0 ${w}v10M${x-10} ${y+d}h10m${w} 0h10`)).join('');
const wave = (x,y,heights=[12,25,40,24,55,34,18,31,12],gap=10) => heights.map((h,i)=>p(`M${x+i*gap} ${y-h/2}v${h}`)).join('');
const human = (x,y) => circle(x,y,14,'sv-paper')+p(`M${x-28} ${y+49}v-8a28 28 0 0 1 56 0v8`);
const camera = (x,y) => box(x,y,60,36,7,'sv-paper')+circle(x+42,y+18,10)+p(`M${x+17} ${y+36}v13m-13 0h26`);
const mic = (x,y) => box(x-12,y-27,24,44,12,'sv-accent')+p(`M${x-22} ${y-5}v12a22 22 0 0 0 44 0v-12M${x} ${y+29}v18m-13 0h26`);

const maps = {
  'knowledge-assistants': {
    title:words('From documents to a grounded answer','从文档到有依据的回答','من المستندات إلى إجابة مستندة إلى مصادر'),
    labels:[words('Source documents','来源文档','المستندات المصدرية'),words('Retrieved evidence','检索依据','الأدلة المسترجعة'),words('Human review','人工复核','مراجعة بشرية')],
    draw:()=>paper(38,57,69,103)+paper(51,68,69,103)+arrow(133,119,34)+box(183,59,112,123,10,'sv-soft')+[0,1,2].map(i=>box(196,73+i*32,86,23,4,i===1?'sv-accent':'sv-paper')+lines(207,84+i*32,54,1)).join('')+arrow(308,119,32)+human(390,95)+p('M363 165h54')
  },
  'meeting-ai': {
    title:words('A meeting becomes useful work','让会议记录进入工作','من الاجتماع إلى العمل'),
    labels:[words('Record with consent','知情录音','تسجيل بموافقة'),words('Correct the notes','校对纪要','تدقيق الملاحظات'),words('Assign next actions','分配行动项','تحديد المهام التالية')],
    draw:()=>box(37,55,76,129,16,'sv-paper')+circle(75,158,10,'sv-accent')+wave(48,108,[12,27,45,24,36,15],10)+arrow(126,115,24)+paper(171,50,112,137)+p('M191 150h70m-70 12h40')+arrow(298,115,24)+box(346,47,91,47,9,'sv-soft')+box(346,144,91,47,9,'sv-accent')+circle(362,70,5)+circle(362,168,5)+lines(375,66,44,2,10)+lines(375,164,44,2,10)+p('M329 115h17m-8 0V71h8m-8 44v53h8')
  },
  'edge-vision': {
    title:words('Measure the scene before the model','先看现场，再评估模型','قيّم المشهد قبل النموذج'),
    labels:[words('Camera field of view','相机视野','مجال رؤية الكاميرا'),words('Local inference','本地推理','استدلال محلي'),words('Review exceptions','复核异常','مراجعة الاستثناءات')],
    draw:()=>camera(29,60)+p('M91 68 208 34v167L91 88')+box(130,75,43,85,0,'sv-soft')+p('M123 92V68h24m33 75v24h-24')+arrow(220,115,23)+chip(266,75,76)+p('M357 113h24v-30h24m-24 30v39h24')+circle(414,81,11,'sv-paper')+circle(414,154,11,'sv-accent')
  },
  'voice-prototypes': {
    title:words('Design the whole voice interaction','设计完整语音交互','صمّم التفاعل الصوتي كاملاً'),
    labels:[words('Capture speech','拾取语音','التقاط الكلام'),words('Transport & latency','传输与时延','النقل وزمن الاستجابة'),words('Hear the response','播放响应','سماع الرد')],
    draw:()=>mic(67,103)+arrow(103,112,26)+wave(153,111,[20,36,63,40,22,39,12],11)+box(141,57,98,112,12,'sv-frame')+arrow(252,112,26)+p('M295 96h22l25-22v76l-25-22h-22zM357 90q20 22 0 44m12-57q35 35 0 70')+p('M81 170v22h300v-25')+circle(232,192,6,'sv-accent')
  },
  'robotics-research': {
    title:words('Map motion, limits and human space','明确运动、边界与人的位置','حدّد الحركة والحدود ومكان الإنسان'),
    labels:[words('Joint motion','关节运动','حركة المفاصل'),words('Workspace limits','工作空间','حدود مساحة العمل'),words('Human boundary','人员边界','حدود وجود الأشخاص')],
    draw:()=>p('M37 197h297M69 42v155')+p('M117 197a122 122 0 0 1 190-98')+p('M117 197a69 69 0 0 1 112-54')+box(107,171,62,26,5,'sv-soft')+p('M137 171 181 111 253 80 278 104')+circle(137,170,13,'sv-paper')+circle(181,111,16,'sv-accent')+circle(253,80,12,'sv-paper')+p('M269 111 281 99m-2 6 11 10m-18-3 11 10')+p('M347 38v160')+human(395,112)
  },
  'dify-japan': {
    title:words('Make the workflow inspectable','让工作流可检查','اجعل سير العمل قابلاً للفحص'),
    labels:[words('A defined input','明确输入','مدخلات محددة'),words('Branching workflow','分支流程','سير عمل متفرع'),words('Reviewable output','可复核输出','مخرجات قابلة للمراجعة')],
    draw:()=>box(31,91,79,57,8,'sv-accent')+lines(48,109,44,2,13)+p('M111 119h32V63h41m-41 56v60h41')+box(185,38,110,51,8,'sv-paper')+box(185,153,110,51,8,'sv-paper')+circle(203,64,5)+lines(218,60,58,2,10)+circle(203,179,5)+lines(218,175,58,2,10)+p('M296 64h34v55h31m-31 0v59h-34')+box(362,91,82,57,8,'sv-soft')+p('M378 109h50m-50 15h29')
  },
  'qwen-deepseek': {
    title:words('Compare on the same task','在同一任务上比较','قارن باستخدام المهمة نفسها'),
    labels:[words('Qwen','Qwen','Qwen'),words('Shared evaluation set','同一评估集','مجموعة تقييم مشتركة'),words('DeepSeek','DeepSeek','DeepSeek')],
    draw:()=>box(26,42,104,146,12,'sv-paper')+box(350,42,104,146,12,'sv-paper')+[78,402].map(x=>circle(x,80,21,'sv-soft')+p(`M${x-31} 124h62m-62 17h62m-62 17h35`)).join('')+box(183,72,114,106,7,'sv-accent')+[0,1,2,3].map(i=>p(`M195 ${93+i*21}h90`)).join('')+p('M221 79v91m36-91v91M131 113h51m116 0h51')+circle(240,42,12,'sv-paper')+p('M240 54v18')
  },
  'ragflow-documents': {
    title:words('Keep the structure of the evidence','保留证据的结构','حافظ على بنية الأدلة'),
    labels:[words('Mixed document layout','复杂文档版式','تخطيط مستند مركب'),words('Extract structure','提取结构','استخراج البنية'),words('Trace the source','追溯来源','تتبّع المصدر')],
    draw:()=>box(32,38,119,160,6,'sv-paper')+lines(47,56,77,2,12)+box(47,88,39,45,0,'sv-soft')+lines(96,92,38,4,12)+p('M47 146h86m-86 15h86m-86 15h58')+arrow(162,117,26)+box(207,64,142,104,6,'sv-accent')+p('M207 94h142m-142 24h142m-142 25h142M250 64v104m50-104v104')+p('M350 117h26v57h27')+paper(397,140,52,68)+p('M409 190h27')
  },
  'seeed-intflow': {
    title:words('Observe locally, inspect the event','本地观察，复核事件','راقب محلياً وراجع الحدث'),
    labels:[words('Physical environment','真实环境','البيئة الواقعية'),words('Edge processing','边缘处理','معالجة طرفية'),words('Event review','事件复核','مراجعة الحدث')],
    draw:()=>camera(54,48)+p('M56 99 31 160h122l-36-61')+box(59,135,26,30,2,'sv-soft')+box(100,128,28,37,2,'sv-paper')+p('M128 66h112v21')+chip(203,95,76)+p('M290 132h43')+box(343,65,92,101,8,'sv-paper')+box(356,80,66,40,3,'sv-soft')+lines(356,135,62,2,12)+p('M389 178v24H91v-23')+circle(241,202,7,'sv-accent')
  },
  'seeed-engineering': {
    title:words('Connect hardware to its documentation','连接硬件与工程资料','اربط العتاد بوثائقه الهندسية'),
    labels:[words('Board & interfaces','板卡与接口','اللوحة والواجهات'),words('Integration notes','集成资料','ملاحظات التكامل'),words('Test conditions','测试条件','شروط الاختبار')],
    draw:()=>box(31,50,240,147,12,'sv-soft')+chip(108,82,76)+box(43,69,22,41,2,'sv-paper')+box(42,137,39,39,2,'sv-paper')+box(204,70,49,18,2,'sv-paper')+box(204,140,49,32,2,'sv-paper')+p('M65 89h26m-9 68h26m-40-45h22v23h18M185 99h17v-19h4m-22 61h12v14h8')+[ [44,62],[258,62],[44,185],[258,185] ].map(([x,y])=>circle(x,y,3)).join('')+paper(322,37,115,159)+p('M282 122h39')+circle(301,122,5,'sv-accent')
  },
  'xiaozhi-voice': {
    title:words('Follow the round trip of a voice request','追踪一次语音请求的往返','تتبّع ذهاب الطلب الصوتي وعودته'),
    labels:[words('Device microphone','设备麦克风','ميكروفون الجهاز'),words('Connected service','连接服务','خدمة متصلة'),words('Spoken response','语音响应','رد صوتي')],
    draw:()=>box(35,73,92,115,27,'sv-paper')+box(52,96,58,34,9,'sv-soft')+circle(80,113,7)+[62,75,88,101].map(x=>circle(x,153,2)).join('')+p('M128 99h34V52h135')+arrow(278,52,20)+box(311,31,105,73,13,'sv-accent')+circle(334,55,5)+lines(349,50,48,2,11)+p('M327 86h73M363 105v62H162v-24h-34')+wave(204,167,[14,26,40,20,31,13],10)+p('M132 135l-8 8 8 8')
  },
  'unitree-sdk': {
    title:words('Separate robot control from application logic','明确机器人控制与应用的边界','افصل التحكم بالروبوت عن منطق التطبيق'),
    labels:[words('Robot joints','机器人关节','مفاصل الروبوت'),words('SDK boundary','SDK 边界','حدود SDK'),words('Application control','应用控制','التحكم بالتطبيق')],
    draw:()=>box(58,82,127,41,11,'sv-soft')+p('M77 123 57 153 72 190m88-67 27 30-15 37M91 123 117 150 110 188m36-65-9 25 20 40')+circle(77,123,8,'sv-paper')+circle(160,123,8,'sv-paper')+circle(91,123,6,'sv-accent')+circle(146,123,6,'sv-accent')+box(178,88,27,24,5,'sv-paper')+p('M235 35v167')+box(266,55,168,117,10,'sv-paper')+p('M279 80h141m-114 22-13 12 13 12m87-24 13 12-13 12m-54-14-8 24')+p('M312 192h79m-39-20v20M207 102h59')
  },
  'ufactory-xarm': {
    title:words('Plan the workcell around the task','围绕任务规划工作单元','خطّط خلية العمل حول المهمة'),
    labels:[words('Reach envelope','工作半径','نطاق الوصول'),words('Tool & payload','工具与负载','الأداة والحمولة'),words('Guarded workcell','隔离工作区','خلية عمل محمية')],
    draw:()=>box(40,28,392,188,8,'sv-frame')+p('M89 52v142m59-142v142m60-142v142m60-142v142m60-142v142m60-142v142M63 75h346m-346 59h346')+p('M132 181a125 125 0 0 1 237-54')+circle(163,164,24,'sv-soft')+p('M163 164 222 92 303 114 324 87')+circle(163,164,11,'sv-paper')+circle(222,92,14,'sv-accent')+circle(303,114,11,'sv-paper')+box(338,148,61,43,4,'sv-paper')+p('M350 160h14v17h-14zm23 0h14v17h-14zM318 80l13 10m-16-7 8-11m5 17 8-11')
  },
  'meeting-devices': {
    title:words('One device is not a fleet decision','单台体验与团队采购','تجربة جهاز وقرار تجهيز فريق'),
    labels:[words('Individual experience','个人使用体验','تجربة الفرد'),words('Account ownership','账号归属','ملكية الحساب'),words('Team administration','团队管理','إدارة الفريق')],
    draw:()=>box(31,53,87,138,19,'sv-paper')+wave(46,108,[12,27,44,21,35,14],11)+circle(75,165,10,'sv-accent')+p('M144 44v152')+[0,1,2].map(i=>box(174+i*33,44,23,40,5,'sv-soft')+circle(185+i*33,72,3)).join('')+box(174,104,261,91,7,'sv-paper')+p('M174 134h261m-261 30h261M263 104v91m58-91v91m57-91v91')+[ [289,119],[349,149],[406,179] ].map(([x,y])=>circle(x,y,6,'sv-accent')).join('')+lines(190,119,49,1)+lines(190,149,49,1)+lines(190,179,49,1)
  }
};

const docs = {
 'ai-procurement-checklist': [words('AI procurement','AI 采购','شراء حلول الذكاء الاصطناعي'),words('Decision checklist','决策清单','قائمة اتخاذ القرار'),'checklist'],
 'meeting-device-pilot': [words('Meeting devices','会议设备','أجهزة الاجتماعات'),words('Pilot field guide','试点指南','دليل التجربة الميدانية'),'meeting'],
 'gulf-arabic-english-meeting-notes-pilot': [words('Gulf meeting notes','海湾会议纪要','محاضر اجتماعات خليجية'),words('Bilingual method','双语方法','منهج ثنائي اللغة'),'protocol'],
 'gulf-meeting-consent-and-privacy-test': [words('Gulf meeting consent','海湾会议知情同意','موافقة اجتماعات خليجية'),words('Privacy test protocol','隐私测试规程','بروتوكول اختبار الخصوصية'),'checklist'],
 'china-to-gulf-ai-recording-sourcing': [words('China to Gulf sourcing','中国到海湾采购','التوريد من الصين إلى الخليج'),words('Recording hardware method','录音硬件方法','منهج أجهزة التسجيل'),'rfq'],
 'knowledge-pilot': [words('Knowledge assistants','知识助手','المساعدات المعرفية'),words('Pilot design','试点设计','تصميم التجربة'),'knowledge'],
 'edge-ai-survey': [words('Edge AI','边缘 AI','الذكاء الاصطناعي الطرفي'),words('Site survey','现场勘查','مسح الموقع'),'edge'],
 'voice-prototype': [words('Voice prototypes','语音原型','نماذج أولية صوتية'),words('Interaction brief','交互设计要点','موجز التفاعل'),'voice'],
 'robotics-procurement': [words('Robotics','机器人','الروبوتات'),words('Procurement guide','采购指南','دليل الشراء'),'robot'],
 'rfq-template': [words('Request for quotation','询价需求','طلب عرض سعر'),words('Requirements template','需求模板','نموذج المتطلبات'),'rfq'],
 'china-ai-export-playbook': [words('China AI, global markets','中国 AI · 全球市场','الذكاء الاصطناعي الصيني والأسواق العالمية'),words('Research playbook','出海研究方案','خطة بحثية للأسواق الدولية'),'global'],
 'fastgpt-cnps-global-growth': [words('FastGPT × CNPS','FastGPT × CNPS','FastGPT × CNPS'),words('Global growth playbook','全球增长方案','خطة النمو العالمي'),'growth']
};

function docIcon(kind){
 const frame = box(38,18,89,108,4,'sv-paper');
 switch(kind){
  case 'checklist':return frame+[0,1,2].map(i=>box(51,39+i*27,11,11,2)+p(`M72 ${44+i*27}h39`)).join('');
  case 'meeting':return frame+wave(52,65,[15,30,52,27,43,18],12)+p('M53 107h57');
  case 'knowledge':return box(26,31,48,42,5,'sv-paper')+box(104,79,48,42,5,'sv-accent')+p('M74 52h30v48m-53-27v37h53')+lines(37,45,28,2,13)+lines(115,93,27,2,13);
  case 'edge':return box(24,29,129,91,5,'sv-paper')+p('M38 46h100v57H38z')+box(72,65,35,27,0,'sv-accent')+p('M27 130h123m-116-7-7 7 7 7m109-14 7 7-7 7');
  case 'voice':return mic(56,58)+wave(105,67,[21,37,61,35,19],11)+p('M35 126h108');
  case 'robot':return p('M26 128h131M48 123 78 63 127 41 141 62')+circle(48,123,9,'sv-paper')+circle(78,63,12,'sv-accent')+circle(127,41,9,'sv-paper')+p('M52 119a81 81 0 0 1 104-65');
  case 'rfq':return frame+p('M50 40h65m-65 20h65m-65 25h65m-65 25h65M79 40v70');
  case 'global':return circle(88,74,52,'sv-paper')+p('M36 74h104M45 49h86M45 99h86M88 22q-43 52 0 104m0-104q43 52 0 104')+circle(51,49,5,'sv-accent')+circle(111,99,5,'sv-accent');
  case 'growth':return box(22,30,51,38,5,'sv-paper')+box(104,80,51,38,5,'sv-accent')+p('M74 50h54v29M48 69v30h55')+circle(128,50,6,'sv-paper')+circle(48,99,6,'sv-paper');
  case 'protocol':return frame+p('M52 42h56M52 58h40')+box(50,74,18,14,2,'sv-accent')+p('M76 81h32')+box(50,96,18,14,2)+p('M76 103h32')+box(50,118,18,14,2,'sv-soft')+p('M76 125h24');
  default:return frame;
 }
}

// Explicit only: unrecognised content never gets a recycled decorative fallback.
const aliases = {
 '/fastgpt':'knowledge-assistants',
 '/fastgpt/solutions/technical-knowledge':'knowledge-assistants',
 '/fastgpt/solutions/support-triage':'dify-japan',
 '/fastgpt/solutions/rfq-intake':'rfq-template',
 '/fastgpt/cases/it-support':'dify-japan',
 '/fastgpt/cases/parts-data':'ragflow-documents',
 '/fastgpt/cases/supplier-shortlist':'ai-procurement-checklist',
 '/fastgpt/cases/service-intake':'rfq-template',
 '/fastgpt/cases/education-support':'knowledge-assistants',
 '/fastgpt/cases/governed-knowledge':'knowledge-assistants',
 '/fastgpt/cases/document-review':'ragflow-documents',
 '/fastgpt/cases/logistics-support':'dify-japan'
};

export function createSemanticVisuals({esc}) {
 if(typeof esc!=='function') throw new TypeError('createSemanticVisuals requires an HTML escape function');
 const translated=(entry,l)=>{ if(!entry?.[l])throw Error(`Missing semantic visual language: ${l}`);return esc(entry[l]);};
 function render(l,slug,{compact=false}={}) {
  const key=aliases[slug]||slug.replace(/^\/(?:solutions|case-studies|resources)\//,'');
  const d=maps[key], doc=docs[key];
  if(!d&&!doc)return '';
  if(doc){const [title,kind,icon]=doc;return `<div class="semantic-visual semantic-document sv-document-${icon}${compact?' is-compact':''}" data-visual-kind="document" data-visual-id="${esc(key)}"><div class="sv-document-top"><span>${translated(documentCaption,l)}</span><span class="sv-doc-mark" aria-hidden="true">CNPS</span></div><div class="sv-document-body"><svg viewBox="0 0 180 150" class="sv-document-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${docIcon(icon)}</svg><div><p class="sv-document-kind">${translated(kind,l)}</p><p class="sv-document-title">${translated(title,l)}</p></div></div><div class="sv-document-lines" aria-hidden="true"><i></i><i></i><i></i></div></div>`;}
  return `<div class="semantic-visual semantic-diagram${compact?' is-compact':''}" data-visual-kind="diagram" data-visual-id="${esc(key)}"><div class="sv-heading"><span>${translated(caption,l)}</span><i aria-hidden="true"></i></div><svg class="sv-geometry" viewBox="0 0 480 240" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d.draw()}</svg><div class="sv-labels">${d.labels.map(label=>`<span>${translated(label,l)}</span>`).join('')}</div><p class="sv-explanation">${translated(d.title,l)}</p></div>`;
 }
 return {render};
}
