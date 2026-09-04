# FastGPT 携手 CNPS.AI 出海增长与交付方案 / FastGPT × CNPS.AI: Global Growth and Delivery Playbook

**中英文对照版 / Chinese–English parallel edition**

**版本说明 / Edition note**

本版完整对照原方案28章，共239个内容块。原方案已完成23轮实质修订；本版新增逐块翻译及一致性校验，不把翻译校验冒充新的23轮策略迭代。研究日期保持2026-09-03；翻译不表示重新核验外部资料。

This edition pairs all 28 chapters and 239 content blocks of the original playbook. The source completed 23 substantive revisions. This edition adds block-level translation and consistency checks; those checks are not described as another 23 strategy revisions. The research date remains 2026-09-03. Translation does not imply that external sources were reverified.

[在线对照阅读 / Read online](https://www.cnps.ai/resources/fastgpt-cnps-global-growth-bilingual) · [中文原版 / Chinese source](https://www.cnps.ai/resources/fastgpt-cnps-global-growth) · [原方案迭代记录 / Source revision record](https://www.cnps.ai/resources/fastgpt-cnps-iterations.md)

## 术语对照 / Terminology

| 中文 | English | 含义 / Meaning |
| --- | --- | --- |
| 有效询盘 | Valid inquiry | 有可回复联系方式、真实企业场景和实施意向。<br>An inquiry with usable contact details, a real business use case, and implementation intent. |
| 销售合格线索 | Sales-qualified lead (SQL) | 已确认负责人、问题、数据条件与下一步日期；本方案的销售漏斗中 SQL 指此概念。<br>A lead with a confirmed owner, problem, data conditions, and next-step date; this is the meaning of SQL in the sales funnel. |
| 询价／报价请求 | Request for quotation (RFQ) | 买方向供应方提出产品或服务报价需求。<br>A buyer request for a product or service quotation. |
| 工作说明书 | Statement of work (SOW) | 约定范围、交付物、验收、费用与责任的项目文件。<br>A project document defining scope, deliverables, acceptance, fees, and responsibilities. |
| 试点 | Pilot | 范围明确、可测量、先于生产扩展的验证阶段。<br>A bounded, measurable evaluation phase before production expansion. |
| 基线 | Baseline | 用来比较改善程度的原有工作表现。<br>Existing task performance used as the comparison point. |
| 验收标准 | Acceptance criteria | 双方预先约定、用于判断交付是否达标的规则。<br>Rules agreed in advance to determine whether delivery meets requirements. |
| 贡献毛利 | Contribution margin | 此方案模型中的收入减直接交付成本；并非净利润。<br>Revenue less direct delivery cost in this model; not net profit. |
| 回款 | Collected payment | 实际收到的款项，与签约和开票分别记录。<br>Payment actually received, recorded separately from signing and invoicing. |
| 人工转接 | Human handoff | 将请求和必要背景交给授权人员处理。<br>Transfer of a request and necessary context to authorized staff. |
| 检索增强生成 | Retrieval-augmented generation (RAG) | 将检索到的知识用于生成回答；仍需核验来源与输出。<br>Generation informed by retrieved knowledge; sources and outputs still require validation. |
| 推广行动入口 | Call to action (CTA) | 引导买方执行下一步的按钮或链接。<br>A button or link directing the buyer to the next action. |

<!-- b001 -->

**中文**

**研究日期：2026-09-03｜公开策略版｜主站：www.cnps.ai｜格式：Markdown**

**English**

**Research date: 2026-09-03 | Public strategy edition | Website: www.cnps.ai | Format: Markdown**

<!-- b002 -->

**中文**

**阅读对象：CNPS 管理与销售团队、FastGPT 合作团队、海外企业买方和渠道伙伴。**

**English**

**Audience: CNPS management and sales teams, the FastGPT partnership team, international enterprise buyers, and channel partners.**

<!-- b003 -->

**中文**

合作关系依据 CNPS 提供的信息。本文不构成 FastGPT 对价格、交付期限、独家区域或服务等级的承诺。案例是 FastGPT 官方发布的参考案例，CNPS 的实施设计与建议目标另行标明。金额均为美元、税前规划假设，不是已生效报价。研究没有取得任何项目的独立审计数据或双方内部订单数据。

**English**

The partnership relationship is based on information supplied by CNPS. This document does not constitute a FastGPT commitment on pricing, delivery dates, territorial exclusivity, or service levels. The cases are references published by FastGPT; CNPS implementation concepts and proposed targets are identified separately. All monetary amounts are pre-tax planning assumptions in US dollars, not effective quotations. This research did not obtain independently audited project data or either party's internal order data.

<!-- b004 -->

**中文**

Markdown 没有固定纸张尺寸。本报告以 28 个实质章节组织，使用显式分页标记；同步提供 A4 阅读版，实际页数以生成后的 PDF 为准。版本差异、检查结论和 SHA-256 保存在迭代记录中，初稿不计入后续修订轮次。

**English**

Markdown has no fixed paper size. This report contains 28 substantive chapters with explicit page breaks. An A4 reading edition is also provided; its actual page count is determined by the generated PDF. Version differences, validation findings, and SHA-256 hashes are retained in the revision record. The initial draft is excluded from the count of subsequent revisions.

<!-- b005 -->

**中文**

**核心决策：把可核实的 FastGPT 能力，包装为有边界、有验收、有责任人的企业实施服务。以技术知识问答、客服分流、RFQ 资料整理三个场景切入，用小范围付费试点获得可复制订单。**

**English**

**Core decision: turn verifiable FastGPT capabilities into enterprise implementation services with defined scope, acceptance criteria, and accountable owners. Enter through technical knowledge Q&A, support triage, and RFQ information processing, using small paid pilots to develop repeatable orders.**

<!-- b006 -->

## 阅读导航 / Reading guide

<!-- b007 -->

**中文**

01 第一性原理；02 采购链路；03 证据方法；04 产品边界；05 合作分工；06 市场选择；07 理想客户；08 服务产品；09 案例选择；10 案例本地化；11 Dify 路径；12 其他开源路径；13 X 证据；14 GitHub 获客；15 网站架构；16 英文内容；17 搜索策略；18 内容分发；19 询盘运营；20 销售成交；21 试点验收；22 技术交付；23 数据与许可；24 经济模型；25 九十天执行；26 风险与实验；27 模板与采购 FAQ；28 来源索引。

**English**

01 First principles; 02 Buying process; 03 Evidence method; 04 Product boundaries; 05 Partnership responsibilities; 06 Market selection; 07 Ideal customers; 08 Service offerings; 09 Case selection; 10 Case localization; 11 The Dify approach; 12 Other open-source approaches; 13 Evidence from X; 14 GitHub acquisition; 15 Website architecture; 16 English messaging; 17 Search strategy; 18 Content distribution; 19 Inquiry operations; 20 Sales and orders; 21 Pilot acceptance; 22 Technical delivery; 23 Data and licensing; 24 Unit economics; 25 Ninety-day execution; 26 Risks and experiments; 27 Templates and procurement FAQ; 28 Source index.


<div class="page-break"></div>

<!-- b009 -->

## 第01章：从第一性原理定义增长 / Chapter 01: Define growth from first principles

<!-- b010 -->

**中文**

企业购买 AI 的基本原因是改善某项工作：更快处理客户请求、让员工找到正确资料、减少重复录入、增加能被业务承接的销售机会。产品功能只有在这种改善足以覆盖采购、集成、使用和风险成本时，才可能形成订单。

**English**

Businesses buy AI to improve a task: handle customer requests faster, help employees find the right information, reduce repeated data entry, or create sales opportunities the business can actually handle. Product capabilities can lead to orders only when those improvements justify the costs of procurement, integration, use, and risk.

<!-- b011 -->

**中文**

因此主站的工作不是储存尽可能多的资料，而是帮助合适的采购方完成五项判断：我是否有这个问题；方案能否进入现有系统；能否用我的数据验证；总成本和责任是否清楚；下一步联系谁。每一页都应解决其中一项判断，并把下一步指向 CNPS。

**English**

The website therefore needs to help suitable buyers make five judgments: Do I have this problem? Can the solution fit our existing systems? Can we validate it with our own data? Are total costs and responsibilities clear? Whom should we contact next? Each page should answer one of these questions and direct the next step to CNPS.

<!-- b012 -->

**中文**

增长关系可拆为：目标客户触达量 × 场景相关访问率 × 有效询盘率 × 商机资格通过率 × 试点成交率 × 扩展成交率。任何一项接近零，单纯放大流量都难以增加订单。另需扣除交付成本、获客成本、支持负担和退款返工，才能判断增长是否健康。

**English**

Growth can be decomposed into target-customer reach × relevant-use-case visit rate × valid inquiry rate × opportunity qualification rate × pilot win rate × expansion win rate. If any factor approaches zero, increasing traffic alone is unlikely to generate more orders. Delivery costs, acquisition costs, support workload, refunds, and rework must also be deducted to assess whether growth is healthy.

<!-- b013 -->

**中文**

建议北极星指标为“来自海外目标企业、完成约定试点验收且实际回款的项目数”，并按贡献毛利复核。阅读量、GitHub star、X 曝光和表单点击只用于诊断过程，不代替真实商业结果。

**English**

The recommended primary success metric is the number of projects from target international companies that pass the agreed pilot acceptance process and generate collected payment, checked against contribution margin. Page views, GitHub stars, X impressions, and form clicks diagnose the process; they do not replace commercial outcomes.

<!-- b014 -->

**中文**

CNPS 的价值假设是跨境客户理解、场景梳理、英文沟通、集成实施和持续维护；FastGPT 的价值是底层平台与产品演进。这一分工必须用交付能力验证，不能仅凭合作伙伴身份推断已具备所有服务能力。

**English**

CNPS's proposed value lies in understanding international customers, defining use cases, communicating in English, implementing integrations, and maintaining solutions. FastGPT's value lies in the underlying platform and its development. Delivery capability must validate this division of work; partner status alone does not establish every service capability.

<!-- b015 -->

### 指标必须有分母与归属 / Every metric needs a denominator and attribution

<!-- b016 -->

**中文**

有效询盘率 = 期间收到的去重有效询盘企业数 / 同期目标场景页面的有效会话数。跨场景的同一企业只计一个新商机，后续增加范围计扩展。SQL 通过率以已完成人工资格审核的询盘为分母，同时报告尚未审核数量。订单按签约、已开票、已收款三个状态分别记录。

**English**

Valid inquiry rate = distinct companies submitting valid inquiries during the period / valid sessions on target use-case pages during the same period. A company engaging across several use cases counts as one new opportunity; later scope increases count as expansion. The SQL acceptance rate uses inquiries that have completed human qualification as its denominator, while unreviewed inquiries are reported separately. Orders are recorded separately as signed, invoiced, and paid.

<!-- b017 -->

**中文**

北极星按获客月份形成 cohort，保留 30、60、90、180 天转化窗口，避免把本月流量与数月前的订单混算。短期学习指标可用“安排了明确下一步的目标企业对话数”；财务结果仍以回款和真实项目成本判断。

**English**

Group the primary success metric into cohorts by acquisition month, with 30-, 60-, 90-, and 180-day conversion windows. This avoids mixing current-month traffic with orders acquired months earlier. A short-term learning metric can be the number of conversations with target companies that result in an agreed next step. Financial outcomes still depend on collected payment and actual project costs.


<div class="page-break"></div>

<!-- b019 -->

## 第02章：海外采购方的决策链路 / Chapter 02: How international enterprise buyers decide

<!-- b020 -->

**中文**

一个企业询盘可能由开发者发起，业务主管解释价值，IT 负责人批准系统接入，信息安全和采购部门完成审查，财务安排付款。网站要让这些人获得不同的证据，却看到一致的承诺。

**English**

A developer may initiate an enterprise inquiry, a business manager may explain its value, IT may approve system access, security and procurement may complete reviews, and finance may arrange payment. The website should give each role appropriate evidence while maintaining consistent commitments.

<!-- b021 -->

| 买方角色<br>Buyer role | 首要疑问<br>Primary question | 网站提供的材料<br>Website material | 下一步<br>Next step |
| --- | --- | --- | --- |
| 业务负责人<br>Business owner | 能减少哪项重复工作<br>Which repetitive task can be reduced? | 场景与测量方法<br>Use cases and measurement methods | 提交流程说明<br>Describe the workflow |
| 技术负责人<br>Technical owner | 数据和接口如何接入<br>How will data and interfaces connect? | 架构、边界、接口清单<br>Architecture, boundaries, and interface list | 技术评估<br>Technical assessment |
| 安全负责人<br>Security owner | 谁能访问什么数据<br>Who can access which data? | 数据流和控制清单<br>Data flows and control checklist | 安全问卷<br>Security questionnaire |
| 采购与财务<br>Procurement and finance | 买什么、如何验收<br>What are we buying, and how is it accepted? | SOW 样本、费用构成<br>Sample SOW and cost breakdown | 书面报价<br>Written quotation |
| 管理层<br>Management | 如何扩展且不失控<br>How can we expand with control? | 试点结果与治理计划<br>Pilot results and governance plan | 分阶段扩展<br>Phased expansion |

<!-- b022 -->

**中文**

让买方直接预约一场没有准备的“大而全 AI 演示”，容易吸引兴趣而无法识别预算。更好的入口是“描述一个流程，获取试点范围建议”。首轮只收集工作邮箱、企业、国家或时区、场景、现有系统、期望时间；预算与数据细节可在后续沟通补充。

**English**

An unprepared, all-purpose AI demonstration may attract interest without revealing a budget. A more useful entry point is: describe one workflow and receive a suggested pilot scope. Initially collect only a work email, company, country or time zone, use case, existing systems, and intended timing. Budget and detailed data questions can follow later.

<!-- b023 -->

**中文**

销售内部需要统一词汇。有效询盘指有可回复联系方式、真实企业场景和实施意向；SQL 指已确认负责人、问题、数据条件和下一步日期；试点指有明确范围和验收口径的独立阶段；扩展订单指已签署并按合同进入收款或履约的后续工作。不能把自动回复或下载行为记成 SQL。

**English**

Sales needs consistent definitions. A valid inquiry has usable contact details, a real business use case, and implementation intent. An SQL, or sales-qualified lead, has a confirmed owner, problem, data conditions, and next-step date. A pilot is a distinct phase with defined scope and acceptance criteria. An expansion order is subsequent work that has been signed and entered collection or delivery under the contract. Automated replies and downloads must not be counted as SQLs.


<div class="page-break"></div>

<!-- b025 -->

## 第03章：研究方法与证据等级 / Chapter 03: Research method and evidence levels

<!-- b026 -->

**中文**

本次查询覆盖 FastGPT 官网、官方案例中心、官方 GitHub，以及 Dify、RAGFlow、LobeHub、OpenManus、Chatbox 的公开项目。X 用于观察传播内容和采用信号，再回到企业公告或代码仓库交叉验证。检索日期为 2026-09-03，历史帖子按其原始日期引用。

**English**

The research covers FastGPT's official website, case center, and GitHub repository, alongside the public Dify, RAGFlow, LobeHub, OpenManus, and Chatbox projects. X is used to observe distribution content and adoption signals, followed by cross-checks against company announcements or repositories. The research date is 2026-09-03; historical posts retain their original dates.

<!-- b027 -->

| 等级<br>Level | 类型<br>Evidence type | 能支持什么<br>What it can support | 不能支持什么<br>What it cannot support |
| --- | --- | --- | --- |
| A<br>A | 官方源码、许可、产品文档<br>Official source code, licenses, and product documentation | 产品和许可的公开表述<br>Public product and licensing statements | 特定客户实际回报<br>A specific customer's realized return |
| B<br>B | 厂商案例或合作方公告<br>Vendor cases or partner announcements | 对外公布的采用与效果<br>Publicly reported adoption and outcomes | 独立审计、普遍效果<br>Independent audit or universal results |
| C<br>C | 作者自己的 X 实践帖<br>Authors' own practice posts on X | 作者公开展示的行为<br>Activities publicly demonstrated by those authors | 总体市场规模或收入<br>Overall market size or revenue |
| D<br>D | 本报告分析和规划假设<br>Analysis and planning assumptions in this report | 可供执行的实验设计<br>Actionable experiment designs | 已被验证的事实<br>Established facts |

<!-- b028 -->

**中文**

搜索中直接打开部分 X 帖子仅返回空壳页面，因此这些条目明确使用公开搜索索引摘录，不声称完成了登录后的全文访问，也不引用无法核验的视频内容。访问计数随时间变化，本方案不采用它们证明商业价值。

**English**

Some X posts returned only empty page shells when opened directly. Those entries explicitly rely on public search-index excerpts. The report does not claim authenticated full-text access or cite video content that could not be verified. View counts change over time and are not used as evidence of commercial value.

<!-- b029 -->

**中文**

报告中的“中国 AI 应用出海”采用生态研究口径：包括中国开发者、中文社区或中国市场起点关联的项目，研究其全球传播和企业落地机制；不据此推定公司的注册地、最终控制人、数据驻留地或税务身份。对每个具体供应商，应在采购时单独核实。

**English**

The report uses an ecosystem definition of Chinese AI applications expanding internationally: projects associated with Chinese developers, Chinese-language communities, or a starting point in the Chinese market. It examines their global distribution and enterprise adoption mechanisms. It does not infer incorporation jurisdiction, ultimate control, data residency, or tax status. These must be verified separately for each supplier during procurement.

<!-- b030 -->

**中文**

未取得 CNPS 当前访问、转化率、合同和交付工时基线。后文的市场排序、预算、漏斗和目标均为可更改假设，不能写进“已实现成果”。

**English**

The research did not obtain CNPS baselines for current traffic, conversion rates, contracts, or delivery hours. The market rankings, budgets, funnels, and targets below are adjustable assumptions and must not be described as achieved results.

<!-- b031 -->

### 来源冲突的处理 / Handling conflicting sources

<!-- b032 -->

**中文**

昭昭客服页面的“40%”在目录摘要中指重复购课报考类咨询占比，在详情概览中被描述为自动处理比例，分母不一致。本报告和英文案例不采用这一数值；仅保留来源明确表述的人工转接率变化，并标为发布方自述。案例图表里的痛点分布百分比没有说明抽样和测量方法，全部排除。

**English**

The Zhaozhao support case uses “40%” differently: the directory summary describes the share of repetitive course-purchase and exam-registration inquiries, while the detailed overview describes an automated handling rate. The denominators conflict. This report and the English case summary exclude that figure. They retain only the clearly stated change in human handoff rate and label it as the publisher's claim. All pain-point distribution percentages in case charts are excluded because sampling and measurement methods are unspecified.

<!-- b033 -->

**中文**

抓取器曾把 CNPS 首页解析成跳转商城；直接 HTTP 请求取得的是正常的主站 HTML。线上实施以直接响应及浏览器核验为准。对事实冲突，应保留冲突与处理记录，不能选择看起来更有利于销售的版本。

**English**

A crawler once interpreted the CNPS homepage as a redirect to the shop, whereas a direct HTTP request returned the normal main-site HTML. Implementation decisions rely on direct responses and browser checks. When facts conflict, preserve both the conflict and its resolution instead of selecting the version that appears more useful for sales.


<div class="page-break"></div>

<!-- b035 -->

## 第04章：FastGPT 能力如何转成买方价值 / Chapter 04: Translate FastGPT capabilities into buyer value

<!-- b036 -->

**中文**

FastGPT 的公开仓库描述知识处理、RAG 检索、可视化工作流和 API 等能力。官网还介绍企业治理与实施支持。版本、授权、选用模型和部署环境会影响实际能力，售前必须做需求到版本的映射。[FastGPT 官网](https://fastgpt.io/)；[官方仓库](https://github.com/labring/FastGPT)。

**English**

FastGPT's public repository describes knowledge processing, RAG retrieval, visual workflows, and APIs. Its website also describes enterprise governance and implementation support. Actual capability depends on version, licensing, model choice, and deployment environment. Presales must map each requirement to an appropriate version. [FastGPT website](https://fastgpt.io/); [official repository](https://github.com/labring/FastGPT).

<!-- b037 -->

| 平台能力<br>Platform capability | 可售卖的业务结果<br>Business outcome that can be offered | 需要 CNPS 补齐的工作<br>Work CNPS needs to provide |
| --- | --- | --- |
| 知识检索<br>Knowledge retrieval | 从授权资料中找到答案依据<br>Find supporting evidence in authorized materials | 清洗文档、版本管理、评测<br>Document cleaning, version control, and evaluation |
| 可视化流程<br>Visual workflows | 让重复任务按规则流转<br>Route repetitive tasks through defined rules | 业务分支、错误处理、人审<br>Business branches, error handling, and human review |
| API 与工具连接<br>APIs and tool connections | 嵌入客户已有系统<br>Fit into the customer's existing systems | 凭据管理、适配、权限验证<br>Credential management, adaptation, and access checks |
| 模型选择<br>Model selection | 按质量和成本选择推理服务<br>Choose inference services by quality and cost | 对比测试、区域适配、限额<br>Comparative tests, regional fit, and limits |
| 企业治理<br>Enterprise governance | 满足部门使用与审查需求<br>Meet departmental usage and review requirements | 逐项核实版本和许可证<br>Verify the relevant edition and license item by item |

<!-- b038 -->

**中文**

不能从“支持 RAG”推导为“不会产生错误”；也不能从“可私有部署”推导为“任何数据都不离开客户环境”。外部模型、OCR、嵌入、日志和插件都可能形成额外数据路径，必须绘制完整数据流。

**English**

RAG support does not imply error-free answers. Private deployment does not imply that no data ever leaves the customer's environment. External models, OCR, embeddings, logs, and plugins may create additional data paths; the complete flow must be mapped.

<!-- b039 -->

**中文**

CNPS 应维护一份能力确认表：需求名称、FastGPT 版本、社区或商业版、所需插件、证据链接、已测试环境、负责工程师、限制。表内未验证的接口标注“需评估”，不能出现在网页上作为已完成集成的承诺。

**English**

CNPS should maintain a capability confirmation table containing the requirement, FastGPT version, community or commercial edition, required plugins, evidence link, tested environment, responsible engineer, and limitations. Untested interfaces must be marked “assessment required” and must not appear on the website as completed integrations.


<div class="page-break"></div>

<!-- b041 -->

## 第05章：双方合作的交付与商业分工 / Chapter 05: Partnership responsibilities for delivery and commerce

<!-- b042 -->

**中文**

推荐采用“FastGPT 平台能力 + CNPS 场景实施 + 双方明确升级通道”的合作模式。让海外客户知道谁回应需求、谁开具服务报价、谁处理平台缺陷、谁维护第三方接口。合作伙伴身份本身不自动包含区域独家、商标改用或无限转售权。

**English**

The recommended model combines FastGPT platform capabilities, CNPS use-case implementation, and an agreed escalation path between the parties. International customers should know who answers requirements, quotes services, addresses platform defects, and maintains third-party interfaces. Partner status does not automatically grant territorial exclusivity, trademark modification rights, or unlimited resale rights.

<!-- b043 -->

| 工作<br>Work | CNPS 建议职责<br>Proposed CNPS responsibility | FastGPT 建议职责<br>Proposed FastGPT responsibility | 客户职责<br>Customer responsibility |
| --- | --- | --- | --- |
| 需求发现<br>Discovery | 组织英文访谈、筛选场景<br>Conduct English interviews and screen use cases | 支持平台适配判断<br>Support platform-fit assessment | 提供流程负责人<br>Supply a process owner |
| 许可确认<br>License confirmation | 汇总部署与商业模式<br>Summarize deployment and business models | 确认授权范围与产品报价<br>Confirm authorization scope and product quotation | 确认主体与用途<br>Confirm purchasing entity and use |
| 试点交付<br>Pilot delivery | 清洗、流程、接口、评测<br>Prepare data, workflows, interfaces, and evaluation | 必要的平台技术支持<br>Provide necessary platform support | 提供数据和验收人<br>Supply data and acceptance owner |
| 上线运营<br>Live operations | 监测、培训、一级响应<br>Monitor, train, and provide first-line response | 平台缺陷与版本升级支持<br>Support platform defects and version upgrades | 账号与业务规则审批<br>Approve accounts and business rules |
| 内容营销<br>Content marketing | 英文页面和本地内容<br>Create English pages and local content | 案例材料与品牌核实<br>Verify case materials and brand use | 另行授权客户证言<br>Separately authorize customer testimonials |

<!-- b044 -->

**中文**

建议销售前完成一份合作作业说明，写明线索登记、重复线索处理、报价有效期、费用拆分、渠道保护、客户支持边界和升级联系人。本文不给未约定的返佣比例，也不把双方可能的合作安排当作已签合同。

**English**

Before selling, prepare a partnership operating guide covering lead registration, duplicate leads, quotation validity, cost allocation, channel protection, support boundaries, and escalation contacts. This report does not specify unagreed commissions or treat possible partnership arrangements as signed contracts.

<!-- b045 -->

**中文**

CNPS 可以公开解释自身服务范围，并用真实团队和联系方式增强信任。若买方要求厂家背书，可在实际商机中组织三方会议或提供可公开的合作证明，不能制作未经 FastGPT 确认的认证徽章。

**English**

CNPS can publicly explain its service scope and strengthen trust through real team information and contact details. If a buyer requests vendor endorsement, arrange a three-party discussion for the actual opportunity or supply partnership evidence that may be shared publicly. Do not create certification badges without FastGPT's confirmation.

<!-- b046 -->

### 商机与事故不能没有最终责任人 / Opportunities and incidents need accountable owners

<!-- b047 -->

**中文**

CNPS 项目负责人对服务范围、沟通和交付组织负责；客户业务负责人对业务验收负责；客户 IT 对生产账户和访问审批负责。平台缺陷由双方约定的技术升级流程处理，CNPS 不能自行替 FastGPT 承诺修复时间。任何任务只能有一位最终验收人，可以有多位参与者。

**English**

The CNPS project owner is accountable for service scope, communication, and delivery coordination. The customer's business owner is accountable for business acceptance, and customer IT approves production accounts and access. Platform defects follow the agreed technical escalation process; CNPS cannot promise FastGPT repair times on its behalf. Each task needs one final acceptance owner, although several people may participate.

<!-- b048 -->

**中文**

建议线索登记记录首次接触日期、企业域名、场景、来源和负责方；重复线索先人工核实，不仅按个人邮箱判重。合作双方讨论分成和区域安排的细节应在受控商业文件中记录，公开方案只说明客户服务路径。

**English**

Lead registration should include first-contact date, company domain, use case, source, and responsible party. Review duplicate leads manually rather than relying only on an individual's email address. Details of revenue sharing and territorial arrangements belong in controlled commercial documents; the public playbook describes only the customer service path.


<div class="page-break"></div>

<!-- b050 -->

## 第06章：市场选择与进入顺序 / Chapter 06: Market selection and entry sequence

<!-- b051 -->

**中文**

第一阶段的市场选择应服务于学习速度和交付成功率。建议先测试英语沟通可覆盖的新加坡及东南亚区域总部，以及现有关系能触达的海外贸易、制造和分销企业。美国、英国和澳大利亚可并行开展自然流量实验，日本在获得本地语言实施伙伴后作为第二条增长路线。该排序是资源假设，不是市场份额结论。

**English**

Initial market selection should maximize learning speed and delivery success. Start by testing Singapore and Southeast Asian regional headquarters reachable in English, plus international trading, manufacturing, and distribution companies accessible through existing relationships. Organic traffic experiments can run in parallel in the United States, United Kingdom, and Australia. Japan becomes a second growth path once a local-language implementation partner is available. This ranking is a resource assumption, not a conclusion about market share.

<!-- b052 -->

**中文**

用五个维度打分：现有关系可达性 30%、痛点与现有能力匹配 25%、语言与时区覆盖 20%、采购与数据复杂度 15%、付费潜力 10%。每项 1 至 5 分；复杂度以“越容易越高分”计算。先用 15 次真实企业访谈替换主观分值。

**English**

Score five dimensions: access through existing relationships, 30%; fit between pain points and current capabilities, 25%; language and time-zone coverage, 20%; procurement and data complexity, 15%; and payment potential, 10%. Score each from 1 to 5; for complexity, easier conditions receive a higher score. Replace subjective scores with evidence from 15 real company interviews.

<!-- b053 -->

| 市场群<br>Market group | 第一轮要证明的假设<br>Initial hypothesis to test | 主要进入动作<br>Main entry activity | 扩张条件<br>Expansion condition |
| --- | --- | --- | --- |
| 新加坡/东南亚英语团队<br>English-speaking teams in Singapore/Southeast Asia | 小范围流程试点易组织<br>Small workflow pilots are easier to organize | 现有关系与区域渠道<br>Existing relationships and regional channels | 有付费试点与本地支持<br>Paid pilots and local support |
| 美英澳企业团队<br>Enterprise teams in the US, UK, and Australia | 明确场景内容能吸引技术买方<br>Specific use-case content attracts technical buyers | 英文搜索与 GitHub<br>English search content and GitHub | 达到可接受获客成本<br>Acceptable acquisition cost |
| 日本<br>Japan | 本地培训与渠道能降低采用阻力<br>Local training and channels reduce adoption friction | 日语伙伴与联合培训<br>Japanese-language partners and joint training | 日语验收和支持可履约<br>Japanese acceptance and support can be delivered |
| 欧盟<br>European Union | 私有部署治理是采购重点<br>Governance of private deployments matters in procurement | 精准行业内容与安全评估<br>Focused industry content and security assessment | 数据与合同审查通过<br>Data and contract reviews pass |

<!-- b054 -->

**中文**

先选择一个区域、两个岗位、三个工作流。每扩展一种语言就增加文档、支持、评测和法律沟通成本。没有证据时扩大区域只会把有限团队分散到更多未验证的假设上。

**English**

Begin with one region, two job roles, and three workflows. Every additional language increases documentation, support, evaluation, and legal communication costs. Geographic expansion without evidence spreads a limited team across more untested assumptions.

<!-- b055 -->

### 初始排序示例与反证条件 / Example ranking and conditions that would overturn it

<!-- b056 -->

**中文**

按上述权重，假设东南亚英语团队五项得分为 4/4/4/3/3，综合 3.75；美英澳为 2/4/3/3/5，综合 3.15；有日语伙伴前的日本为 2/4/1/3/4，综合 2.65。得分仅演示决策方法，绝非调研结果。若 CNPS 的真实客户网络主要在其他区域，应直接替换第一项分数并重新排序。

**English**

Using the weights above, illustrative scores of 4/4/4/3/3 for English-speaking Southeast Asian teams yield 3.75. Scores of 2/4/3/3/5 for the US, UK, and Australia yield 3.15. Scores of 2/4/1/3/4 for Japan before securing a Japanese-language partner yield 2.65. These numbers demonstrate the decision method; they are not research findings. If CNPS's actual customer network is concentrated elsewhere, replace the relationship-access score and recalculate the ranking.

<!-- b057 -->

**中文**

15 次访谈建议按三类客户各 5 家组织，记录现有流程、每月任务量、错误代价、数据准备、采购角色和期望结果。只有买方愿意提供合规样本并约定下一步，才计作有需求证据；礼貌表示“有兴趣”不计入。

**English**

Organize the 15 interviews as 5 companies in each of three customer groups. Record the current workflow, monthly task volume, cost of errors, data readiness, purchasing roles, and desired outcome. Count demand evidence only when a buyer is willing to provide appropriately authorized samples and agree on a next step. A polite expression of interest does not qualify.


<div class="page-break"></div>

<!-- b059 -->

## 第07章：三类理想客户与排除条件 / Chapter 07: Three ideal customer groups and exclusion criteria

<!-- b060 -->

**中文**

第一类是工业设备、零部件和专业产品的制造商或分销商。知识散布在手册、规格表、售后记录和员工经验中；技术销售与售后频繁寻找资料。优先接触售后经理、技术支持负责人或商业运营主管，入口内容使用 technical documentation assistant 和 distributor knowledge base 等买方语言。

**English**

The first group consists of manufacturers and distributors of industrial equipment, parts, and specialist products. Knowledge is scattered across manuals, specification sheets, service records, and employee experience; technical sales and after-sales teams repeatedly search for it. Prioritize after-sales managers, technical support leads, and commercial operations managers. Use buyer language such as “technical documentation assistant” and “distributor knowledge base” in entry-point content.

<!-- b061 -->

**中文**

第二类是重复咨询较多的 B2B 软件、服务与培训企业。客服需要回答常见问题，同时把不确定或高影响请求交给人处理。买方关注解决率、转接质量、错误成本和维护工作量，而不仅是首字响应速度。入口为 support triage 和 knowledge-grounded answers。

**English**

The second group consists of B2B software, service, and training companies with repetitive inquiries. Support teams must answer common questions while handing uncertain or high-impact requests to people. Buyers care about resolution rates, handoff quality, error costs, and maintenance workload, not just time to the first token. Entry points include support triage and knowledge-grounded answers.

<!-- b062 -->

**中文**

第三类是报价频繁的贸易、分销和项目型服务企业。输入可能是邮件、PDF、表格或不完整的物料需求。试点先处理需求字段提取、缺失项标注和回复草稿；价格、交期、替代品、出口条件和合同承诺仍由授权人员审批。

**English**

The third group consists of trading, distribution, and project-based service companies that frequently prepare quotations. Inputs may include emails, PDFs, spreadsheets, or incomplete materials requirements. A pilot should first extract requirement fields, flag missing information, and prepare response drafts. Authorized staff still approve pricing, lead times, substitutions, export conditions, and contractual commitments.

<!-- b063 -->

**中文**

共同筛选条件是有业务负责人、有合法可用资料、有重复发生的流程、有可比较的人工基线，并愿意按样本验证。初始企业规模可以以 50 至 1,000 人作为访谈分组假设，而非硬性门槛。

**English**

Shared qualification criteria are a business owner, lawfully usable materials, a recurring workflow, a comparable manual baseline, and willingness to validate with samples. Companies with 50 to 1,000 employees may be an initial interview grouping assumption, not a hard eligibility threshold.

<!-- b064 -->

**中文**

不优先承接：没有资料却要求高准确率、要求立即开放全库、无人负责验收、要求自动作出高影响决定，或者要求保证销量。此类机会应缩小范围或转为诊断咨询，避免把售前变成无限制免费开发。

**English**

Deprioritize requests for high accuracy without source materials, immediate unrestricted access to all data, delivery without an acceptance owner, automated high-impact decisions, or guaranteed sales. Narrow these opportunities or offer diagnostic consulting to avoid turning presales into unlimited free development.

<!-- b065 -->

### 首批账户的发现方法 / Finding the first target accounts

<!-- b066 -->

**中文**

从现有企业客户、公开行业协会成员目录、渠道伙伴推荐和主动询盘建立 30 家候选企业清单。仅记录公开企业信息和合法取得的业务联系方式，不抓取私人邮箱。每家写出一条可证伪假设，例如“英文技术手册较多，售后团队可能需要跨文档检索”，并注明推断来源。

**English**

Build a list of 30 candidate companies from existing enterprise customers, public industry-association directories, partner referrals, and inbound inquiries. Record only public company information and lawfully obtained business contact details; do not harvest private email addresses. For each account, write a falsifiable hypothesis and identify its basis—for example, a company with many English technical manuals may need cross-document retrieval for its service team.

<!-- b067 -->

**中文**

资格审核时询问：这个工作每周重复几次；目前谁做；什么错误最昂贵；谁批准试点；哪些资料可以使用；如果试点成功，谁拥有扩展预算。不要只根据员工数量或某个国家来推定购买能力。每周只推进团队能按时回复和交付的账户数量。

**English**

During qualification, ask how often the task occurs each week, who performs it, which errors are most expensive, who approves a pilot, which materials may be used, and who controls the expansion budget if the pilot succeeds. Do not infer buying capacity solely from employee count or country. Advance only as many accounts each week as the team can answer and serve on time.


<div class="page-break"></div>

<!-- b069 -->

## 第08章：把服务变成可购买的产品 / Chapter 08: Make services into purchasable offerings

<!-- b070 -->

**中文**

推荐三层产品：场景诊断、范围受控试点、生产实施与持续服务。所有项目最终以双方书面 SOW 为准。网站展示交付物和步骤即可；在没有获准价目表之前，使用“Request a scoped proposal”，不要假装存在已生效统一价格。

**English**

Offer three levels: use-case diagnosis, a bounded pilot, and production implementation with ongoing service. Every project ultimately follows the parties' written statement of work (SOW). The website can describe deliverables and steps. Until an approved price list exists, use “Request a scoped proposal” rather than implying that a uniform price is already effective.

<!-- b071 -->

| 产品<br>Offering | 建议范围<br>Proposed scope | 具体交付物<br>Specific deliverables | 退出条件<br>Exit condition |
| --- | --- | --- | --- |
| 场景诊断<br>Use-case diagnosis | 一个流程与一组资料样本<br>One workflow and a set of sample materials | 流程图、风险和试点建议<br>Workflow map, risks, and pilot recommendation | 不适合则给出原因<br>Explain why if the use case is unsuitable |
| 付费试点<br>Paid pilot | 一部门、一场景、有限数据<br>One department, one use case, limited data | 可演示流程、测试结果、成本表<br>Demonstrable workflow, test results, and cost sheet | 达标后再谈生产<br>Discuss production only after criteria are met |
| 生产实施<br>Production implementation | 授权系统与明确用户范围<br>Authorized systems and a defined user population | 部署、接口、培训、运维手册<br>Deployment, interfaces, training, and operations guide | 验收和责任移交<br>Acceptance and responsibility handover |
| 持续改进<br>Continuous improvement | 固定月度工时或约定工单<br>Fixed monthly hours or agreed tickets | 知识更新、回归、质量复盘<br>Knowledge updates, regression checks, and quality reviews | 定期评估续约<br>Periodic renewal assessment |

<!-- b072 -->

**中文**

标准试点建议为 2 至 4 周的排期窗口，前提是数据、账户和审批已准备好。这是规划假设，不能复制官方案例页的免费 POC 或最快交付承诺为 CNPS 的服务保证。

**English**

A standard pilot can be planned within a 2- to 4-week scheduling window once data, accounts, and approvals are ready. This is a planning assumption. Free POC offers or fastest-delivery claims on official case pages must not be copied into CNPS service guarantees.

<!-- b073 -->

**中文**

每一层都应写明不包含什么：第三方许可证、模型用量、特殊网络、复杂历史数据清洗、额外语言、全天候响应等是否单列。扩展时使用变更单，说明增加的范围、验收、费用和时间，避免一次试点承担无限范围。

**English**

Each level should state exclusions and separately priced items, including third-party licenses, model consumption, special networking, complex historical data cleaning, additional languages, and round-the-clock response. Use change orders for expansion, specifying added scope, acceptance, cost, and time, so that one pilot does not absorb unlimited work.

<!-- b074 -->

### 三个试点包的可交付边界 / Delivery boundaries for the three pilot packages

<!-- b075 -->

**中文**

知识问答包：一类文档、一种业务语言、一组授权用户，交付带来源问答与无答案处理。RFQ 包：一种输入模板、有限字段、只读产品资料，交付需求摘要与待补项。客服包：一套 FAQ、一组分流标签、一种人工转接方式，交付建议回复和工单草稿。

**English**

The knowledge Q&A package covers one document family, one business language, and one authorized user group, delivering answers with references and a no-answer path. The RFQ package covers one input template, a limited field set, and read-only product materials, delivering requirement summaries and missing items. The support package covers one FAQ set, one group of routing labels, and one human handoff method, delivering suggested replies and ticket drafts.

<!-- b076 -->

**中文**

若数据质量或接口条件不明确，先做诊断再报价；若客户提出第二语言、ERP 写入或高可用，则重估范围。时间从资料与访问准备完成后起算，并由客户对数据准备延误承担明确的排期影响。

**English**

If data quality or interface conditions are unclear, diagnose before quoting. Reassess scope when a customer adds a second language, ERP write access, or high availability. The delivery clock starts when materials and access are ready; the schedule impact of customer data-preparation delays must be explicit.

<!-- b077 -->

### 客户价值计算器的口径 / Definitions for the customer-value calculator

<!-- b078 -->

**中文**

月度可释放工时 = 月任务量 × 每项净节省分钟 × 实际采用比例 / 60。分钟数必须已扣除复核与返工；采用比例只计实际使用并满足质量要求的任务。工时价值 = 可释放工时 × 全成本小时费率。月净价值 = 工时价值 - 新增运维与模型费用。

**English**

Monthly hours released = monthly task volume × net minutes saved per task × actual adoption share / 60. Net minutes must already deduct review and rework. Adoption includes only tasks that actually use the solution and meet quality requirements. Value of released time = hours released × fully loaded hourly labor cost. Monthly net value = value of released time - additional operations and model costs.

<!-- b079 -->

**中文**

例：4,000 项任务、每项净省 6 分钟、采用 30%、费率 35 美元，得到 120 小时和 4,200 美元工时价值；再扣新增月费 800，得到 3,400 美元。若一次性投入 12,000，简单回收期约 3.53 个月。数据全是假设，不包括资本时间价值，也不表示可以裁减等额人员或已经节省现金。

**English**

Example: 4,000 tasks, 6 net minutes saved per task, 30% adoption, and a $35 hourly rate yield 120 hours and $4,200 in time value. Subtract $800 in additional monthly costs to obtain $3,400. With a one-time investment of $12,000, simple payback is approximately 3.53 months. All inputs are assumptions. This excludes the time value of capital and does not imply equivalent headcount reductions or realized cash savings.

<!-- b080 -->

**中文**

上线后的 ROI 应由客户确认工时是否真正转向有价值工作。网页计算器只帮助讨论假设，不把计算结果存为已实现客户成果。

**English**

After launch, the customer should confirm whether released hours actually shift to valuable work. A website calculator only supports discussion of assumptions; its outputs must not be recorded as realized customer results.


<div class="page-break"></div>

<!-- b082 -->

## 第09章：案例中心的首批八个参考案例 / Chapter 09: The first eight case-center references

<!-- b083 -->

**中文**

下面是 FastGPT 官方案例的简要转述。效果由发布方陈述，未独立审计，不代表 CNPS 的交付成果，也不保证其他企业能重复获得相同结果。各条原文见第 28 章 C01-C08。

**English**

The following are concise adaptations of FastGPT's official cases. Outcomes are publisher-reported, not independently audited, and are not CNPS delivery results. They do not guarantee that another company will achieve the same outcome. Original sources are listed as C01-C08 in Chapter 28.

<!-- b084 -->

| 案例<br>Case | 官方披露的核心场景<br>Core use case disclosed by the publisher | 可供海外买方评估的切入点<br>Starting point for international buyer evaluation |
| --- | --- | --- |
| 延锋 iSAP<br>Yanfeng iSAP | 运维知识与工单衔接；称重复咨询自动处理 70%<br>Operations knowledge linked to tickets; reports 70% automated handling of repetitive inquiries | 内部支持问答与转接<br>Internal support Q&A and handoff |
| 商络电子<br>Shangluo Electronics | 料号解释与结构化数据库写入<br>Part-number interpretation and structured database entry | 分销商 RFQ 字段整理<br>RFQ field preparation for distributors |
| 延锋供应商推荐<br>Yanfeng supplier recommendation | 候选供应商匹配与风险标注<br>Candidate-supplier matching and risk flags | 采购初筛辅助<br>Assisted procurement shortlisting |
| 欧派家居<br>OPPEIN Home | 通话信息提取与区域派单<br>Call-information extraction and regional dispatch | 服务询盘结构化<br>Structured service inquiries |
| 昭昭医考<br>Zhaozhao medical exam training | 知识问答与人工转接；称转接率下降 42%<br>Knowledge Q&A and human handoff; reports a 42% decrease in handoff rate | 常见咨询分流<br>Routine inquiry triage |
| 上海邮电设计咨询研究院<br>Shanghai Posts & Telecommunications Designing Consulting Institute | 制度权限与项目数据查询<br>Policy permissions and project-data queries | 部门知识访问治理<br>Governance of departmental knowledge access |
| 延锋财务审单<br>Yanfeng financial document review | BPM 流程中的初审和异常复核<br>Initial checks and exception review within BPM workflows | 规则检查辅助<br>Assisted rules-based checks |
| 长株潭物流<br>Chang-Zhu-Tan logistics | 客户问答与内部资料查询<br>Customer Q&A and internal information lookup | 物流服务知识支持<br>Logistics service knowledge support |

<!-- b085 -->

**中文**

首页优先展示前三个最贴近客户工作的案例：iSAP、料号整理、客服转接。其余放在可筛选的案例库。不要把高监管场景当作默认销售入口，也不从物流案例推导对烟草业务的推广建议。

**English**

Prioritize the three references closest to target buyers' work on the homepage: iSAP, part-number processing, and support handoff. Place the others in a filterable library. Highly regulated scenarios should not be the default sales entry point, and the logistics reference does not imply recommendations to promote tobacco sales.

<!-- b086 -->

**中文**

每张案例卡只有一个核心事实、一个来源链接和一个 CNPS 评估入口。完整迁移设计应另标为“CNPS pilot concept”，从而让参考证据与将要为客户开发的方案清楚区分。

**English**

Each case card should contain one core fact, one source link, and one CNPS evaluation entry point. Label the proposed adaptation separately as a “CNPS pilot concept” so buyers can distinguish reference evidence from a solution that would be developed for them.

<!-- b087 -->

### 案例准入规则 / Case admission rules

<!-- b088 -->

**中文**

记录案例主体、原文 URL、发布方、最后核对日、采用的事实、原文限制、目标角色和对应 CTA。优先使用可归属到客户名称的案例；匿名方案、模板和一般行业设想单独标注，不能混入“Customer results”。网站提供摘要而非整库镜像，原始中文详情通过出处链接阅读。

**English**

Record the case subject, original URL, publisher, last review date, adopted facts, source limitations, target role, and associated call to action (CTA). Prefer cases attributable to named customers. Label anonymous concepts, templates, and general industry ideas separately; do not mix them into customer results. Provide summaries with links to the full Chinese sources rather than mirroring the entire case collection.

<!-- b089 -->

**中文**

对含效果数字的卡片显示“Reported by FastGPT”。不使用未经许可的客户 logo，也不把中国案例翻译成发生于美国或欧洲。若来源数字撤回、改动或出现冲突，先撤下数字，再复核相关页面和销售材料。

**English**

Cards containing outcome figures should display “Reported by FastGPT.” Do not use customer logos without permission or translate a Chinese case as though it happened in the United States or Europe. If a source withdraws or changes a figure, or conflicting figures appear, remove the number first and review the affected pages and sales materials.


<div class="page-break"></div>

<!-- b091 -->

## 第10章：从中国案例迁移到海外业务 / Chapter 10: Adapt Chinese cases to international operations

<!-- b092 -->

**中文**

复制案例的界面或文字不能解决本地部署问题。需要迁移的是流程机制：输入标准化、知识检索、受控输出、异常转接、结果反馈。原有企业微信、国内 ERP、中文资料和审批习惯，都需要被海外客户实际使用的渠道和控制方式替代。

**English**

Copying a case's interface or wording does not solve local deployment requirements. Transfer the workflow mechanisms: standardized inputs, knowledge retrieval, controlled outputs, exception handoff, and outcome feedback. Replace the original WeCom channels, domestic ERP systems, Chinese materials, and approval practices with the channels and controls the international customer actually uses.

<!-- b093 -->

**中文**

以 iSAP 类场景为例，CNPS 的建议试点从客户授权的一套手册和 FAQ 开始，收集代表性问题，回答时呈现出处，并对没有证据的请求明确说明。需要转接时先生成工单草稿，由员工确认后进入客户选定系统。Microsoft Teams、Slack、Zendesk 或其他接口均需逐项评估，不能声称已经有可直接用的连接器。

**English**

For an iSAP-like scenario, CNPS's proposed pilot starts with a customer-authorized manual and FAQ set. Collect representative questions, show answer sources, and explicitly identify requests without supporting evidence. When handoff is needed, generate a ticket draft for staff approval before it enters the customer's chosen system. Microsoft Teams, Slack, Zendesk, and other interfaces require individual assessment; do not claim that ready-to-use connectors already exist.

<!-- b094 -->

**中文**

以料号场景为例，首先确定物料编码的权威来源、单位和同义词表。输出原始字段、规范化字段、来源位置与待确认项。报价流程不能让模型生成未核实的价格或库存；先与只读主数据匹配，再由销售复核后进入报价系统。

**English**

For part-number processing, first establish the authoritative material-code source, units, and synonym list. Output original fields, normalized fields, source locations, and items requiring confirmation. The model must not invent unverified prices or stock levels. Match against read-only master data first, then let sales review the result before it enters the quotation system.

<!-- b095 -->

**中文**

验收要同时看正常与失败场景：缺页手册、过期条款、错误型号、多语混合、含恶意指令的附件、权限不足、API 超时。国外采购方需要看到系统失败时会怎样，而不是只看事先挑选的最佳演示。

**English**

Acceptance should cover normal and failure scenarios: incomplete manuals, outdated terms, incorrect models, mixed languages, attachments containing malicious instructions, insufficient permissions, and API timeouts. International buyers need to see what happens when the system fails, not just a selection of favorable demonstrations.

<!-- b096 -->

### 本地化检查表 / Localization checklist

<!-- b097 -->

| 维度<br>Dimension | 改造动作<br>Adaptation | 证据<br>Evidence |
| --- | --- | --- |
| 语言<br>Language | 型号、单位、行业缩写保留原文并建同义词<br>Preserve original model numbers, units, and industry abbreviations; build synonyms | 双语业务专家核对样本<br>Sample checks by bilingual business specialists |
| 渠道<br>Channels | 把原渠道替换为客户授权的入口<br>Replace original channels with customer-authorized entry points | 接口可用性与授权记录<br>Interface availability and authorization records |
| 商务<br>Commercial terms | 币种、税费、时区、报价有效期单列<br>State currency, taxes, time zones, and quotation validity separately | 客户批准的模板<br>Customer-approved templates |
| 数据<br>Data | 确认文档来源、保留期限和地区<br>Confirm document sources, retention periods, and regions | 数据流评审<br>Data-flow review |
| 使用习惯<br>Working practices | 由实际员工完成任务试用<br>Have actual employees perform trial tasks | 任务观察与反馈表<br>Task observations and feedback forms |

<!-- b098 -->

**中文**

本地化的完成标准是当地员工能完成指定工作，且知道错误时联系谁。翻译字数、网页语言数量或演示字幕数量都不能替代这一标准。

**English**

Localization is complete when local employees can perform the specified task and know whom to contact when something goes wrong. Translated word counts, website language counts, and demonstration subtitles do not replace that standard.


<div class="page-break"></div>

<!-- b100 -->

## 第11章：Dify 的全球路径给 CNPS 的启发 / Chapter 11: Lessons from Dify's global approach

<!-- b101 -->

**中文**

Dify 的官方 GitHub 提供英文说明、部署入口和企业使用路径；伙伴计划区分转售、技术服务与市场生态。这支持“开发者试用与企业服务可以分层组织”的判断，但不证明 CNPS 可以照搬其价格或增长结果。[仓库](https://github.com/langgenius/dify)；[伙伴计划](https://dify.ai/partners)。

**English**

Dify's official GitHub provides English explanations, deployment entry points, and enterprise usage paths. Its partner program distinguishes resale, technical services, and ecosystem activities. This supports separating developer trials from enterprise services, but does not prove that CNPS can reproduce Dify's pricing or growth. [Repository](https://github.com/langgenius/dify); [partner program](https://dify.ai/partners).

<!-- b102 -->

**中文**

更有价值的交叉证据来自日本京进集团。其 2026-04-10 公告说明与 LangGenius 开始合作，涉及 Dify Enterprise 和员工使用能力建设。X 上也有同日公告传播。它说明本地业务组织、企业治理和人员培训可以构成采用路径；公告本身没有提供可供我们核验的合同金额。[京进公告](https://group.kyoshin.co.jp/news/741333/)。

**English**

A stronger cross-check comes from Japan's Kyoshin Group. Its announcement dated 2026-04-10 describes a new relationship with LangGenius involving Dify Enterprise and employee capability development. The announcement also circulated on X that day. It illustrates an adoption path combining local business organization, enterprise governance, and training. The announcement provides no contract value that this research could verify. [Kyoshin announcement](https://group.kyoshin.co.jp/news/741333/).

<!-- b103 -->

**中文**

CNPS 可迁移的做法是：让技术团队通过可复现的英文演示理解产品；让本地服务伙伴用行业语言讲解；让企业买方得到试点与培训包。日本方向需要日语评测、支持和业务材料，机器翻译只是开始。

**English**

CNPS can adapt the following approach: help technical teams understand the product through reproducible English demonstrations, let local service partners explain it in industry language, and offer enterprise buyers pilot and training packages. Japan requires Japanese-language evaluation, support, and business materials; machine translation is only a starting point.

<!-- b104 -->

**中文**

不应迁移的做法是把 Dify 用户数、融资、star 或客户标识用于证明 FastGPT 的优势，也不把 Dify 的企业功能和插件视作 FastGPT 的内置功能。比较应回到同一数据集、同一权限要求、同一预算和同一验收条件。

**English**

Do not use Dify user counts, funding, stars, or customer logos to prove FastGPT's strengths. Do not present Dify enterprise features or plugins as built-in FastGPT capabilities. Comparisons should use the same dataset, access requirements, budget, and acceptance conditions.


<div class="page-break"></div>

<!-- b106 -->

## 第12章：RAGFlow、LobeHub、Chatbox 与 OpenManus / Chapter 12: RAGFlow, LobeHub, Chatbox, and OpenManus

<!-- b107 -->

**中文**

RAGFlow 的官方仓库用文档处理与检索来组织产品叙述，并提供多语 README 和部署材料。它启发 CNPS 用客户的难文档展示解析与检索质量，把技术能力变成可检查的结果；不能从开源关注推断海外付费规模。[RAGFlow](https://github.com/infiniflow/ragflow)。

**English**

RAGFlow's official repository organizes its product narrative around document processing and retrieval, with multilingual README files and deployment materials. CNPS can learn to demonstrate parsing and retrieval quality on customers' difficult documents, making technical capability inspectable. Open-source attention cannot establish the scale of international paid adoption. [RAGFlow](https://github.com/infiniflow/ragflow).

<!-- b108 -->

**中文**

LobeChat 仓库现已跳转为 LobeHub。报告引用当前官方地址，避免继续把旧名称当作产品当前定位。其公开项目展示英文入口和产品体验的重要性。Chatbox 则展示跨桌面平台使用入口。CNPS 可以借鉴降低首次体验门槛的设计，不能把个人工具采用直接等同于企业采购。[LobeHub](https://github.com/lobehub/lobehub)；[Chatbox](https://github.com/chatboxai/chatbox)。

**English**

The LobeChat repository now redirects to LobeHub. This report uses the current official address instead of treating the old name as the product's current positioning. Its public project demonstrates the importance of English entry points and product experience. Chatbox provides access across desktop platforms. CNPS can borrow designs that reduce friction in the first experience, while avoiding equating individual-tool adoption with enterprise procurement. [LobeHub](https://github.com/lobehub/lobehub); [Chatbox](https://github.com/chatboxai/chatbox).

<!-- b109 -->

**中文**

OpenManus 提供多语说明、代码与演示入口，适合作为开源复现和社区协作的参考。它与 Manus 不是同一商业主体，仓库名称不构成 Manus 授权，也没有提供本研究可核验的企业订单结果。[OpenManus](https://github.com/FoundationAgents/OpenManus)。

**English**

OpenManus provides multilingual explanations, code, and demonstrations, making it a useful reference for reproducible open-source work and community collaboration. It is not the same commercial entity as Manus. The repository name does not grant Manus authorization, and it provides no enterprise order results that this research could verify. [OpenManus](https://github.com/FoundationAgents/OpenManus).

<!-- b110 -->

**中文**

四类启发分别是质量证据、使用体验、低门槛分发、可复现协作。CNPS 的落点应是一份可运行或可审查的场景样例，加上清晰的实施服务入口。卖点不是“我们也有热门 Agent”，而是“我们知道这个工作如何测量、交付和维护”。

**English**

The four lessons concern quality evidence, usability, accessible distribution, and reproducible collaboration. CNPS should deliver a runnable or reviewable use-case example with a clear implementation-service entry point. The commercial proposition is knowing how to measure, deliver, and maintain a workflow, rather than merely offering another popular agent.


<div class="page-break"></div>

<!-- b112 -->

## 第13章：X 上的可核验观察与局限 / Chapter 13: Verifiable observations from X and their limits

<!-- b113 -->

**中文**

以下帖子通过公开搜索索引取得，部分直接页无正文。这里只转述可见内容，不把转发量、播放量和粉丝量当作商业效果。链接见 X01-X05。

**English**

The posts below were found through public search indexes; some direct pages returned no body text. Only visible content is summarized. Reposts, views, and follower counts are not treated as commercial outcomes. Links are listed under X01-X05.

<!-- b114 -->

| 日期与作者<br>Date and author | 可见观察<br>Visible observation | 对 CNPS 的启发<br>Lesson for CNPS | 证据边界<br>Evidence boundary |
| --- | --- | --- | --- |
| 2024-09-05 Luyu Zhang<br>2024-09-05 Luyu Zhang | 分享 Dify 入选 TechCrunch 活动的消息<br>Shared news that Dify was selected for a TechCrunch event | 用国际活动承接公开演示<br>Use international events to support public demonstrations | 非订单证据<br>Not evidence of orders |
| 2025-01-07 Tom<br>2025-01-07 Tom | 日语解释会话变量的实际用法<br>Explained practical use of conversation variables in Japanese | 用一个操作问题写教程<br>Build a tutorial around one operational question | 不采用“100 倍”等修辞<br>Excludes rhetoric such as “100 times” |
| 2025-03-15 まつにぃ<br>2025-03-15 まつにぃ | 讨论 Markdown 文档导出插件<br>Discussed a Markdown document-export plugin | 把输出接入真实办公格式<br>Connect outputs to real office formats | 能力回仓库确认<br>Verify capability in the repository |
| 2026-01-29 Canopy Wave<br>2026-01-29 Canopy Wave | 宣布 Dify 模型市场插件<br>Announced a Dify model-marketplace plugin | 集成合作也是分发入口<br>Integration partnerships can be distribution channels | 属于该作者自述<br>The author's own statement |
| 2026-04-10 digitalpr_jp<br>2026-04-10 digitalpr_jp | 传播京进与 LangGenius 合作<br>Shared the Kyoshin–LangGenius partnership | 本地企业案例比泛宣传具体<br>Local business references are more concrete than generic promotion | 已与企业公告交叉核对<br>Cross-checked against the company announcement |

<!-- b115 -->

**中文**

Markdown Exporter 的实际仓库存在，说明“跨语言传播一个解决真实办公问题的组件”是可观察的现象。它不能证明 FastGPT 可以直接导入 Dify 插件。[插件仓库](https://github.com/bowenliang123/markdown-exporter)。

**English**

The Markdown Exporter repository exists. This supports the observation that a component solving a real office task can circulate across language communities. It does not prove that FastGPT can import Dify plugins directly. [Plugin repository](https://github.com/bowenliang123/markdown-exporter).

<!-- b116 -->

**中文**

推荐 X 内容以短演示、失败案例、评测方法和真实集成过程为主。每条只解决一个问题，并链接到相应场景页面。不要冒充客户、不购买虚假互动、不向陌生用户批量私信。当前交付只准备内容和网站，不代表已在 X 发布。

**English**

Recommended X content focuses on short demonstrations, failure examples, evaluation methods, and real integration work. Each post should solve one problem and link to the relevant use-case page. Do not impersonate customers, purchase fake engagement, or mass-message strangers. The current delivery prepares content and the website; it does not mean posts have been published on X.

<!-- b117 -->

### 从观察到实验的证据链 / The evidence chain from observation to experiment

<!-- b118 -->

**中文**

X03 的办公导出讨论与 S12 仓库相互印证的是“组件存在且被不同语言用户讨论”；X05 与 S07 相互印证的是“日本企业合作已公告”。X01 只支持公开活动传播，X02 只支持教程主题，X04 只支持作者发布了集成消息。五条样本不能用于估算中国 AI 出海成功率，选择它们也存在幸存者偏差。

**English**

The office-export discussion in X03 and repository S12 jointly support that a component exists and is discussed by users in different languages. X05 and S07 confirm that a Japanese business partnership was announced. X01 supports only public event distribution, X02 only the tutorial topic, and X04 only an author's integration announcement. These five samples cannot estimate the success rate of Chinese AI expansion, and their selection is subject to survivorship bias.

<!-- b119 -->

**中文**

CNPS 的下一步实验应分别测量：教程是否带来技术问询、场景演示是否带来诊断会、伙伴活动是否带来合格企业。给每项内容分配独立来源码，并在销售首轮询问客户如何找到 CNPS，避免把最后一次点击当作全部影响。

**English**

CNPS's next experiments should separately measure whether tutorials generate technical inquiries, use-case demonstrations generate diagnostic meetings, and partner events generate qualified companies. Assign a distinct source code to each content item and ask buyers how they found CNPS during the first sales conversation. Do not attribute all influence to the last click.


<div class="page-break"></div>

<!-- b121 -->

## 第14章：GitHub 如何贡献合格询盘 / Chapter 14: How GitHub can generate qualified inquiries

<!-- b122 -->

**中文**

GitHub 对 CNPS 的角色是技术信任入口。建议建设一个公开场景样例仓库，而非复制整套 FastGPT 来制造自己的产品归属。仓库应清楚标注基于 FastGPT，链接上游许可证，并为 CNPS 自有示例另列适当许可。

**English**

GitHub should establish technical trust for CNPS. Build a public use-case example repository instead of copying all of FastGPT to imply ownership of the product. Clearly state that the examples are based on FastGPT, link the upstream license, and assign an appropriate separate license to CNPS-owned examples.

<!-- b123 -->

**中文**

建议仓库内容包含：英文 README、合成样本、输入输出示例、评测集、版本清单、配置模板、故障示例、部署说明和安全说明。README 的前屏回答三个问题：解决哪个工作、如何复现最小结果、何时需要企业实施帮助。末尾再放一条带 UTM 的 CNPS 入口。

**English**

Include an English README, synthetic samples, input/output examples, evaluation sets, version inventory, configuration templates, failure examples, deployment instructions, and security notes. The first README screen should answer which task is solved, how to reproduce a minimal result, and when enterprise implementation help is useful. Add a CNPS entry point with UTM attribution near the end.

<!-- b124 -->

| 样例<br>Example | 初始资产<br>Initial assets | 首次运行应得到的结果<br>Expected first-run result |
| --- | --- | --- |
| Technical support<br>Technical support | 合成产品手册与问答集<br>Synthetic product manuals and Q&A set | 带出处回答及拒答样本<br>Answers with sources and refusal examples |
| RFQ intake<br>RFQ intake | 合成询价与字段定义<br>Synthetic inquiries and field definitions | 结构化字段和缺失项<br>Structured fields and missing information |
| Support handoff<br>Support handoff | 合成咨询与分流规则<br>Synthetic inquiries and routing rules | 可人工确认的工单草稿<br>Ticket drafts ready for human confirmation |

<!-- b125 -->

**中文**

不承诺未验证的“一键导入”。涉及具体 FastGPT workflow JSON 时，要记录确切版本并执行一次干净环境导入；未通过的资产只能称为设计样例。Issue 模板应去除凭据和客户资料，引导真正的产品问题。

**English**

Do not promise untested one-click imports. When providing specific FastGPT workflow JSON, record the exact version and test import in a clean environment. Assets that have not passed this check must be called design examples. Issue templates should exclude credentials and customer information while eliciting genuine product problems.

<!-- b126 -->

**中文**

贡献上游时以修复文档、提供复现和改进测试为主。避免在无关 issue 填广告或抓取开发者邮箱群发。GitHub 明确限制垃圾推广和虚假互动，相关规范见第 28 章 P03。

**English**

Upstream contributions should focus on documentation fixes, reproductions, and better tests. Do not place advertisements in unrelated issues or harvest developer emails for bulk outreach. GitHub restricts spam and fake engagement; see policy P03 in Chapter 28.

<!-- b127 -->

### 样例仓库验收与转化 / Example-repository acceptance and conversion

<!-- b128 -->

**中文**

建议结构为 examples/、datasets/synthetic/、evaluation/、docs/、SECURITY.md、LICENSE 和 .env.example。环境示例只含变量名和安全占位，不含真实凭据。每次 release 记录上游版本、兼容范围、已通过样本数、失败项和维护负责人。

**English**

The proposed structure is examples/, datasets/synthetic/, evaluation/, docs/, SECURITY.md, LICENSE, and .env.example. Environment examples contain only variable names and safe placeholders, never real credentials. Each release should record upstream version, compatibility, passed sample count, failures, and maintenance owner.

<!-- b129 -->

**中文**

README 服务入口示例：需要帮助，把这一工作流适配到贵公司的文档和系统吗？欢迎与 CNPS 讨论范围明确的试点。链接使用 utm_source=github、utm_medium=repository、utm_campaign=fastgpt-pilot。指标是合格企业对话和样例复现问题，不是 star 增速。

**English**

Example README service message: “Need help adapting this workflow to your company documents and systems? Discuss a scoped pilot with CNPS.” Use utm_source=github, utm_medium=repository, and utm_campaign=fastgpt-pilot in the link. Measure qualified business conversations and example-reproduction issues rather than star growth.

<!-- b130 -->

**中文**

目前交付的是发布素材与评测规范；还没有把示例仓库发布到 GitHub，也没有宣称完成真实 FastGPT 环境的导入和模型评测。这项工作属于九十天计划第 15-30 天的工程门槛。

**English**

The current deliverables are publishing materials and evaluation specifications. A public workflow-example repository has not yet been published, and no claim is made that import into a real FastGPT environment or model evaluation has been completed. This work is an engineering gate for days 15-30 of the ninety-day plan.


<div class="page-break"></div>

<!-- b132 -->

## 第15章：CNPS 网站的信息架构 / Chapter 15: Information architecture for the CNPS website

<!-- b133 -->

**中文**

网站新增一个英语优先的企业入口，主任务是把业务兴趣转成可处理的询盘。主站已有硬件和商城内容，因此 FastGPT 路径需要清楚命名，并在首页给出入口，避免让企业买方误以为只能购买录音硬件。

**English**

Add an English-first enterprise entry point whose main purpose is to turn business interest into actionable inquiries. The main site already contains hardware and shop content. Name the FastGPT path clearly and link it from the homepage so enterprise buyers do not assume CNPS only sells recording hardware.

<!-- b134 -->

| 页面<br>Page | 职责<br>Purpose | 主行动按钮<br>Primary CTA |
| --- | --- | --- |
| /fastgpt/<br>/fastgpt/ | 说明合作与实施场景<br>Explain the partnership and implementation use cases | 讨论您的工作流<br>Discuss your workflow |
| /fastgpt/cases/<br>/fastgpt/cases/ | 浏览有来源的参考案例<br>Browse references with sources | 规划类似试点<br>Scope a similar pilot |
| /fastgpt/solutions/…/<br>/fastgpt/solutions/…/ | 把某项工作说具体<br>Explain a specific task | 索取范围明确的方案<br>Request a scoped proposal |
| /fastgpt/contact/<br>/fastgpt/contact/ | 整理需求并联系 CNPS<br>Structure requirements and contact CNPS | 准备询盘邮件<br>Prepare inquiry email |
| /resources/fastgpt-cnps-global-growth/<br>/resources/fastgpt-cnps-global-growth/ | 在线阅读和下载方案<br>Read and download the playbook | 下载 Markdown<br>Download Markdown |

<!-- b135 -->

**中文**

英文页面使用“FastGPT implementation with CNPS”解释角色。厂家信息链接到官方页面，但每个商业 CTA 都回到 CNPS 的询盘入口。案例来源链接承担核验作用，不应替代 CNPS 的销售联系人。

**English**

Use “FastGPT implementation with CNPS” to explain the role on English pages. Link vendor information to official pages, but direct every commercial CTA to the CNPS inquiry entry point. Source links enable verification; they should not replace the CNPS sales contact.

<!-- b136 -->

**中文**

最小可用发布必须包含可读正文、来源、联系方式、适用场景和下一步。网页需要在手机上正常阅读，表格可横向滚动，按键可通过键盘使用。下载不能被一个无效表单拦住；可公开报告应直接可取。

**English**

A minimum viable publication requires readable content, sources, contact details, applicable use cases, and a next step. Pages must be readable on phones, tables horizontally scrollable, and controls operable by keyboard. Downloads must not be blocked by a nonfunctional form; public reports should be directly accessible.

<!-- b137 -->

### 本次内容交付与后续业务实施 / This content delivery and subsequent business implementation

<!-- b138 -->

**中文**

本次制作 14 个 FastGPT 专题页面：1 个入口、1 个案例索引、8 个案例详情、3 个场景方案和1个询盘页；另有报告在线阅读页、Markdown、A4 PDF、完整迭代记录与英文采购指南。英文指南位于 [Buyer guide](https://www.cnps.ai/resources/fastgpt-buyer-guide-en.md)，可供海外采购方直接下载。

**English**

The initial delivery includes 14 FastGPT specialist pages: 1 landing page, 1 case index, 8 case details, 3 use-case solutions, and 1 inquiry page. It also includes an online report, Markdown, A4 PDF, complete revision records, and an English buyer guide. International buyers can directly download the [buyer guide](https://www.cnps.ai/resources/fastgpt-buyer-guide-en.md).

<!-- b139 -->

**中文**

网站上线属于内容与获客入口建设，不表示已部署客户 FastGPT 实例、完成平台试点、发送 X 帖子、开通 CRM 自动接收或获得订单。客户实施和渠道运营按后续九十天计划执行。由于现网源码来自另一部署，本次由同目录主站任务统一合并发布，旧站路由依赖原部署承接，后续应将完整旧站源码归档到同一维护流程。

**English**

Website publication establishes content and acquisition entry points. It does not mean customer FastGPT instances have been deployed, platform pilots completed, X posts sent, automatic CRM intake enabled, or orders won. Customer implementation and channel operations follow the ninety-day plan. Because the original live-site source came from another deployment, the main-site task in the shared directory coordinated the initial combined publication. Legacy routes depend on the original deployment; the full legacy source should subsequently be brought into the same maintenance process.


<div class="page-break"></div>

<!-- b141 -->

## 第16章：海外客户看到的英文信息 / Chapter 16: English messaging for international customers

<!-- b142 -->

**中文**

建议主标题：**让企业知识发挥实际作用。** 支持文案：**CNPS 与 FastGPT 合作，帮助团队规划和实施知识助手、客服工作流及 RFQ 询价资料处理。从一个工作流和双方约定的衡量方法开始。**

**English**

Recommended headline: **Put your business knowledge to work.** Supporting copy: **CNPS works with FastGPT to help teams plan and implement knowledge assistants, support workflows and RFQ intake. Start with one workflow and an agreed way to measure it.**

<!-- b143 -->

**中文**

这一表述把用户能理解的工作置于技术名称之前，同时说明合作和实施角色。网页不使用“零幻觉”“确保合规”“全球最佳”“保证增加订单”等未经证实的断言。

**English**

This language puts a recognizable task before technology names while explaining partnership and implementation roles. Avoid unsubstantiated claims such as zero hallucinations, guaranteed compliance, world's best, or guaranteed order growth.

<!-- b144 -->

**中文**

三组场景标题为“从技术文档中找到答案”“带着完整背景分流客服请求”“把 RFQ 询价整理成可复核的需求摘要”。每组都展示买方需要提供什么、预期得到什么、哪些决定继续由人负责。

**English**

The three use-case headlines are “Find answers in technical documents,” “Route support requests with context,” and “Turn RFQs into reviewable briefs.” Each should explain what the buyer supplies, what output to expect, and which decisions remain with people.

<!-- b145 -->

**中文**

案例标签统一为“FastGPT 发布的参考案例”。案例下方用一句话解释：“CNPS 未对这些结果进行独立审计。您的试点将采用自身的基线和验收标准。”这是对证据来源的说明，应放在合适位置，避免用大段内部流程干扰阅读。

**English**

Use the consistent case label “FastGPT-published reference.” Add: “CNPS did not independently audit these results. Your pilot will use your own baseline and acceptance criteria.” Place this evidence-attribution statement where it helps the reader, without crowding the page with lengthy internal procedures.

<!-- b146 -->

**中文**

FAQ 应直接回答：是否必须更换现有模型；能否在客户环境部署；试点需要哪些资料；是否包含第三方费用；案例是不是 CNPS 客户；如何获取书面报价。不能对未验证的模型、系统和地区一律回答“支持”。

**English**

The FAQ should directly address whether customers must change their existing model, whether deployment in their environment can be assessed, what materials a pilot needs, whether third-party costs are included, whether the cases are CNPS customers, and how to obtain a written quotation. Do not answer “supported” for every untested model, system, or region.


<div class="page-break"></div>

<!-- b148 -->

## 第17章：搜索与 AI 检索入口 / Chapter 17: Search and AI retrieval entry points

<!-- b149 -->

**中文**

搜索内容围绕买方工作与部署条件组织。首批主题可使用 FastGPT implementation partner、enterprise knowledge assistant、technical documentation AI、RFQ automation pilot、self-hosted knowledge base implementation。此处关键词属于内容实验，未取得搜索量或竞价数据。

**English**

Organize search content around buyer tasks and deployment conditions. Initial topics may include FastGPT implementation partner, enterprise knowledge assistant, technical documentation AI, RFQ automation pilot, and self-hosted knowledge base implementation. These keywords are content experiments; search-volume and bid data were not obtained.

<!-- b150 -->

**中文**

每个场景页应包含具体问题、输入和输出、责任边界、数据准备、评测办法、相关案例与联系入口。把同一篇中文材料机械翻成几十个国家页，会增加维护成本和重复内容，而未必增加信任。

**English**

Each use-case page should cover a specific problem, inputs and outputs, responsibility boundaries, data preparation, evaluation, related cases, and contact options. Mechanically translating one Chinese article into dozens of country pages increases maintenance and duplication without necessarily increasing trust.

<!-- b151 -->

**中文**

技术要求是可抓取 HTML、唯一 title 与 description、canonical、站点地图、正文内链、合适的语言标记和真实的结构化数据。仅使用页面确实展示的组织或服务信息，不生成假评分、虚构评价或没有价格依据的商品 Offer。[Google Search Essentials](https://developers.google.com/search/docs/essentials)。

**English**

Technical requirements include crawlable HTML, unique titles and descriptions, canonical links, a sitemap, internal body links, appropriate language attributes, and accurate structured data. Use only organization or service information actually displayed on the page. Do not fabricate ratings, reviews, or product Offers without a pricing basis. [Google Search Essentials](https://developers.google.com/search/docs/essentials).

<!-- b152 -->

**中文**

AI 检索友好意味着定义清晰、来源可追溯、段落可独立理解、发布日期可见。可以提供 Markdown 与简明 llms.txt，但不能承诺任何搜索引擎或 AI 一定收录、推荐或提高排名。提交站点地图后应在真实索引和询盘数据中验证。

**English**

Content suitable for AI retrieval has clear definitions, traceable sources, independently understandable paragraphs, and visible publication dates. Markdown and a concise llms.txt can be provided, but no search engine or AI can be promised to index, recommend, or rank the site higher. Validate actual indexing and inquiry data after submitting the sitemap.

<!-- b153 -->

### 首批搜索主题与页面映射 / Initial search topics and page mapping

<!-- b154 -->

| 买方搜索意图<br>Buyer search intent | 页面主题<br>Page topic | 应回答的具体问题<br>Specific question to answer |
| --- | --- | --- |
| FastGPT implementation partner<br>FastGPT implementation partner | 合作与实施入口<br>Partnership and implementation entry point | 谁负责交付与支持<br>Who owns delivery and support? |
| AI for technical documentation<br>AI for technical documentation | 技术资料场景页<br>Technical-document use case | 如何验证出处与版本<br>How are references and versions verified? |
| RFQ intake automation<br>RFQ intake automation | RFQ 场景页<br>RFQ use case | 如何处理缺失字段和人审<br>How are missing fields and human review handled? |
| support ticket triage AI<br>support ticket triage AI | 客服场景页<br>Support use case | 哪些请求必须转交人工<br>Which requests must go to a person? |
| private AI knowledge base<br>private AI knowledge base | 部署与采购说明<br>Deployment and procurement guidance | 哪些数据会经过外部服务<br>Which data passes through external services? |

<!-- b155 -->

**中文**

避免为“best”“cheapest”制造无依据比较。搜索报告每月检查展示、点击、落地页和询盘质量，先修复页面不可抓取、404 或 CTA 失效等实际问题。不同语言只有在内容、支持与 hreflang 配对完善后上线独立版本。

**English**

Avoid unsupported “best” or “cheapest” comparisons. Review impressions, clicks, landing pages, and inquiry quality monthly. Fix concrete issues such as uncrawlable pages, 404s, and broken CTAs first. Publish separate language editions only when content, support, and hreflang pairing are ready.


<div class="page-break"></div>

<!-- b157 -->

## 第18章：内容分发与四周启动计划 / Chapter 18: Content distribution and the first four weeks

<!-- b158 -->

**中文**

同一项高质量资产可以形成多个有用途的内容：网站长文解释流程，GitHub 样例帮助复现，X 短帖展示一个结果，销售材料帮助采购评估。所有渠道都指向同一场景和同一可核实承诺，减少维护不同版本造成的矛盾。

**English**

A strong asset can support several useful formats: a website article explains the workflow, a GitHub example supports reproduction, an X post demonstrates one result, and sales materials support procurement evaluation. All channels should point to the same use case and verifiable commitment, reducing contradictions across maintained versions.

<!-- b159 -->

| 周<br>Week | 主资产<br>Main asset | X 内容<br>X content | GitHub 内容<br>GitHub content | 销售复用<br>Sales reuse |
| --- | --- | --- | --- | --- |
| 1<br>1 | 技术文档问答评测说明<br>Technical-document Q&A evaluation guide | 有出处与无出处回答对比<br>Answers with and without sources | 合成问答数据集<br>Synthetic Q&A dataset | 诊断访谈问题<br>Diagnostic interview questions |
| 2<br>2 | RFQ 字段整理流程<br>RFQ field-processing workflow | 缺失型号如何被标记<br>How a missing model number is flagged | 字段 schema 和样例<br>Field schema and examples | 试点范围表<br>Pilot scope sheet |
| 3<br>3 | 工单转接设计<br>Ticket handoff design | 何时必须转给人<br>When a person must take over | 分流决策与失败样例<br>Routing decisions and failure examples | 客服负责人演示<br>Demonstration for support owners |
| 4<br>4 | 试点评测报告结构<br>Pilot evaluation report structure | 展示测量方法和限制<br>Measurement methods and limitations | 回归测试说明<br>Regression-test guidance | 管理层复盘页<br>Management review page |

<!-- b160 -->

**中文**

发布频次可从每周 3 条 X 原创、1 篇实用网站内容、1 次样例更新起步。这是团队容量假设。优先确保每条都有真实样例或具体知识，宁可减少频次也不要制造没有内容的“每日发布”。

**English**

An initial cadence could be 3 original X posts, 1 practical website article, and 1 example update per week. This is a team-capacity assumption. Every item should contain a real example or specific knowledge; reduce frequency rather than publishing empty daily updates.

<!-- b161 -->

**中文**

联合活动应以一项工作为主题，例如“从零部件询盘到可复核的 RFQ 需求摘要”。报名后不自动订阅营销列表，演示数据使用合成或已获授权资料。没有客户许可时，不能把销售对话截图作为案例。

**English**

Joint events should focus on one task, such as “From a parts inquiry to a reviewable RFQ brief.” Registration must not automatically subscribe attendees to marketing. Use synthetic or authorized demonstration data. Sales-conversation screenshots cannot become case studies without customer permission.

<!-- b162 -->

### 首批 X 英文草稿 / Initial English drafts for X

<!-- b163 -->

**中文**

**技术文档：** 有用的知识助手应展示答案出处，并在文档不包含答案时明确说明。我们的 FastGPT 试点方法从您的工作流、双方约定的测试集和人工复核开始。请访问 cnps.ai/fastgpt/ 了解具体方法。

**English**

**Technical documents:** A useful knowledge assistant should show where an answer came from—and say when the documents do not contain it. Our FastGPT pilot approach starts with your workflow, an agreed test set and human review. Explore the approach at cnps.ai/fastgpt/.

<!-- b164 -->

**中文**

**RFQ 询价处理：** 一份 RFQ 缺少料号，数量也不明确。有用的 AI 输出应是标明缺失信息的结构化需求摘要。价格与交付承诺仍由您的销售团队负责。欢迎了解 CNPS 的 FastGPT 试点方法。

**English**

**RFQ intake:** An RFQ arrives with a missing part number and an unclear quantity. The useful AI output is a structured brief with the gaps flagged. Pricing and delivery commitments stay with your sales team. See the CNPS FastGPT pilot approach.

<!-- b165 -->

**中文**

**客服：** 快速回答只有正确时才有用。客服试点应同时衡量回答质量、恰当的人工转接、复核时间和成本。CNPS 帮助您围绕一个工作流界定评估范围。

**English**

**Support:** A fast answer is only useful if it is right. For a support pilot, measure answer quality, appropriate handoff, review time and cost together. CNPS helps scope that evaluation around one workflow.

<!-- b166 -->

**中文**

以上仅为待发布草稿，发布前按平台当时长度限制精简并添加对应场景链接。每条配一个真实可复核的合成样例或已授权演示，不能添加不存在的客户成效。销售邮件也只用于回复主动询盘或已有合法联系，不自动群发。

**English**

These are unpublished drafts. Before posting, shorten them to the platform's current limits and add the relevant use-case link. Pair each with a verifiable synthetic example or an authorized demonstration; do not invent customer outcomes. Sales emails are for responding to inbound inquiries or existing lawful contacts, not automated mass outreach.


<div class="page-break"></div>

<!-- b168 -->

## 第19章：询盘处理与 CRM 设计 / Chapter 19: Inquiry handling and CRM design

<!-- b169 -->

**中文**

主站已经公开使用 sales@cnps.ai。第一阶段可以提供需求整理器，生成邮件草稿并让访客自己发送；这一方式不能显示“已提交成功”，也不能被当作后端已存储线索。正式表单需要可靠接收服务后才可启用成功提示。

**English**

The main site already publicly uses sales@cnps.ai. An initial requirement builder can prepare an email draft for the visitor to send. It must not show “submitted successfully” or imply that a lead has been stored by a backend. A server form may display success only after reliable intake is in place.

<!-- b170 -->

**中文**

建议 CRM 字段为企业名称、联系人、工作邮箱、国家时区、来源、场景、现有系统、资料准备状态、预计启动时间、预算区间、负责人、下一步和预计日期。不要在营销表单收集客户生产数据或密钥。

**English**

Recommended CRM fields are company, contact, work email, country/time zone, source, use case, existing systems, data-readiness status, intended start, budget range, owner, next step, and expected date. Marketing forms must not collect production customer data or secrets.

<!-- b171 -->

**中文**

建议打分：场景吻合 25 分、资料可用 20 分、业务负责人 20 分、时间窗口 15 分、预算路径 10 分、技术可交付 10 分。达到 70 分可以进入 SQL 评审；分数只是内部排序工具，不能自动决定客户是否值得服务。

**English**

Suggested scoring: use-case fit, 25 points; usable materials, 20; business owner, 20; timing, 15; budget path, 10; technical deliverability, 10. A score of 70 may trigger SQL review. The score is an internal prioritization tool and must not automatically determine whether a customer deserves service.

<!-- b172 -->

**中文**

归因事件建议依次为 case_view、proposal_intent、brief_prepared、email_open_requested、inquiry_received、sql_accepted、pilot_signed、cash_received。前四项是浏览器行为，后四项必须由收件系统或销售核实。当前页面只把有限的 UTM 参数带入草稿，没有部署分析服务，也没有把联系方式发给第三方统计工具。

**English**

Proposed attribution events are case_view, proposal_intent, brief_prepared, email_open_requested, inquiry_received, sql_accepted, pilot_signed, and cash_received. The first four are browser actions; the last four require confirmation from intake systems or sales. Current pages carry only limited UTM parameters into the draft. No analytics service is deployed, and contact details are not sent to third-party analytics tools.

<!-- b173 -->

**中文**

字段规范示例：utm_source=x/github/partner，utm_medium=organic/repository/referral，utm_campaign=fastgpt-pilot，utm_content=technical-docs-demo。来源参数不能夹带邮箱、企业机密或自由文本。每个真实商机保存首次来源、自述来源与最后触点，定期查看三者差异。

**English**

Example conventions: utm_source=x/github/partner, utm_medium=organic/repository/referral, utm_campaign=fastgpt-pilot, and utm_content=technical-docs-demo. Source parameters must not contain email addresses, business secrets, or free text. Record first source, self-reported source, and last touch for each real opportunity, and periodically compare them.

<!-- b174 -->

**中文**

页面会在浏览器当前会话中保存上述受限来源码，以便从场景页跳到询盘页时保留渠道信息；姓名、邮箱和需求不写入会话存储。禁用脚本时需求表单不可提交，仍可使用直接邮箱链接。浏览器拦截剪贴板或没有邮箱应用时，访客可以手动复制或下载草稿，不会显示已经发出邮件。

**English**

The page stores these limited source codes for the current browser session so attribution survives navigation from a use-case page to the inquiry page. Names, emails, and requirements are not placed in session storage. The requirement form cannot submit with JavaScript disabled, while the direct email link remains usable. If clipboard access is blocked or no mail application exists, visitors can manually copy or download the draft. The page never claims that an email has already been sent.

<!-- b175 -->

**中文**

建议工作日一个工作日内给人工首响，由真实排班能力决定是否公开承诺。第一封回复应复述客户问题、提出两三个关键缺口并约定下一步。复杂问题明确给出预计反馈时间，不用自动邮件制造“销售已处理”的错觉。

**English**

Aim for a human first response within one business day on working days; any public promise must reflect actual staffing. The first reply should restate the customer's problem, identify two or three key gaps, and agree on the next step. Give an expected response time for complex questions. Automated email must not create the impression that sales has already handled the request.

<!-- b176 -->

**中文**

失单原因至少区分无预算、时机不合适、资料不足、许可限制、功能不匹配、采购未通过和竞争方案。每周复盘这些原因，才能判断是流量问题、产品范围问题还是交付能力问题。

**English**

Distinguish at least these loss reasons: no budget, poor timing, insufficient materials, licensing limits, feature mismatch, failed procurement review, and a competing solution. Review them weekly to determine whether the issue is traffic, offering scope, or delivery capability.

<!-- b177 -->

### 接单入口的实际行为 / What the inquiry entry point actually does

<!-- b178 -->

**中文**

本次网站版本采用浏览器内需求整理器：访客填写企业、邮箱、地区、场景和需求后，生成可复制、可下载的英文询盘正文，并主动打开发往 sales@cnps.ai 的邮件草稿。浏览器生成草稿不等于 CNPS 已收到邮件；访客仍须在邮箱中发送。页面同时保留可直接点击的销售邮箱和现有联系页。

**English**

The website version uses a browser-based requirement builder. After entering company, email, region, use case, and requirements, a visitor can generate copyable, downloadable English inquiry text and choose to open a draft addressed to sales@cnps.ai. Generating a draft does not mean CNPS has received an email; the visitor must still send it from their email application. The page also retains a directly clickable sales email and the existing contact page.

<!-- b179 -->

**中文**

后续若启用服务端表单，上线条件是验证收件地址、持久化保存、垃圾过滤、失败重试和人工跟进，并测试真实接收。成功页面只能在服务器确认接收后展示。邮件投递和销售实际阅读应分别记录，避免线索沉没在自动化步骤之间。

**English**

Before enabling a server-side form, verify the recipient address, persistent storage, spam filtering, failure retries, human follow-up, and actual receipt. Show success only after the server confirms acceptance. Record email delivery and sales reading separately so leads do not disappear between automation steps.


<div class="page-break"></div>

<!-- b181 -->

## 第20章：从诊断会走到订单 / Chapter 20: From a diagnostic meeting to an order

<!-- b182 -->

**中文**

建议诊断会 30 分钟：5 分钟确定工作与负责人，10 分钟复盘当前流程，10 分钟了解资料和限制，5 分钟决定是否安排样本评估。会后出一页“问题、范围、数据、验收、下一步”，不要先发送与客户无关的厚重产品手册。

**English**

A diagnostic meeting can take 30 minutes: 5 to establish the task and owner, 10 to review the current workflow, 10 to understand materials and constraints, and 5 to decide whether to evaluate samples. Follow up with one page covering the problem, scope, data, acceptance, and next step, rather than sending an irrelevant, lengthy product manual first.

<!-- b183 -->

**中文**

演示要展示客户工作中的正常、异常和失败样本，并说明哪些结果是合成示例。以客户的人工基线比较时间、质量和成本；若尚未获得基线，明确标为待测。询盘多并不意味着可成交，能否组织评测和预算才是关键。

**English**

Demonstrations should show normal, exceptional, and failure samples from the customer's workflow, identifying synthetic examples. Compare time, quality, and cost against the customer's manual baseline. If that baseline is unavailable, label it as unmeasured. High inquiry volume does not establish sales readiness; the ability to organize evaluation and budget is critical.

<!-- b184 -->

**中文**

SOW 应写明实施主体、业务目的、用户和数据范围、交付物、验收集、费用、排期前提、第三方依赖、变更流程、知识产权、数据处理、终止和移交。条款需要由双方授权人员确认；本文提供结构而非法律意见。

**English**

The SOW should identify the implementing entity, business purpose, user and data scope, deliverables, acceptance set, fees, scheduling prerequisites, third-party dependencies, change process, intellectual property, data handling, termination, and handover. Authorized representatives of both parties must confirm the terms. This report provides a structure, not legal advice.

<!-- b185 -->

**中文**

付款建议采用里程碑，金额和比例按正式报价确认。即便客户要求先演示，也应把免费诊断和有成本的试点明确分开。销售不能承诺“采购就保证效率提升”，应承诺按协议执行测量、交付和整改。

**English**

Milestone payments are recommended, with amounts and proportions confirmed in the formal quotation. Even when a customer asks for an initial demonstration, distinguish free diagnosis from a pilot that incurs costs. Sales should commit to agreed measurement, delivery, and remediation rather than guaranteeing efficiency gains simply from purchase.

<!-- b186 -->

**中文**

试点结束后只对已达标场景提出扩展：增加用户、资料、接口或语言时，都要说明增量成本和回归范围。未达标时出具失败原因和建议，不用更换指标包装成功。

**English**

Propose expansion only for use cases that meet acceptance criteria. Additional users, materials, interfaces, or languages require explicit incremental costs and regression scope. If criteria are not met, explain the failures and recommendations instead of changing the metrics to present success.


<div class="page-break"></div>

<!-- b188 -->

## 第21章：试点设计与验收标准 / Chapter 21: Pilot design and acceptance criteria

<!-- b189 -->

**中文**

建议一个试点覆盖一个流程、一部门和明确资料范围。启动前冻结评测集，划分可回答、需澄清、必须拒答、必须转人工和越权请求。真实生产上线还需更多持续验证；小样本达标仅支持该范围的下一步判断。

**English**

A pilot should cover one workflow, one department, and a defined set of materials. Freeze the evaluation set before starting, including answerable requests, clarification needs, required refusals, mandatory human handoffs, and unauthorized-access requests. Production still requires further ongoing validation. Passing a small sample supports only the next decision within that scope.

<!-- b190 -->

| 维度<br>Dimension | 建议测量方式<br>Suggested measurement | 建议验收方向<br>Proposed acceptance direction |
| --- | --- | --- |
| 正确性<br>Correctness | 业务专家盲评答案与原文<br>Business experts blindly assess answers against source text | 达到双方约定阈值<br>Meet the threshold agreed by both parties |
| 证据<br>Evidence | 检查引用是否支持主要结论<br>Check whether citations support main conclusions | 关键结论可回查<br>Key conclusions can be traced back |
| 权限<br>Permissions | 用跨部门与无权账户测试<br>Test cross-department and unauthorized accounts | 测试集不得出现越权泄漏<br>No unauthorized disclosure in the test set |
| 人审<br>Human review | 缺资料、高影响和异常样本<br>Test missing-data, high-impact, and exceptional samples | 正确转交人处理<br>Correct handoff to a person |
| 时间<br>Time | 相同工作量的人机比较<br>Compare human and assisted work on the same workload | 计入复核时间后改善<br>Improvement after including review time |
| 成本<br>Cost | 模型、基础设施与维护记录<br>Record model, infrastructure, and maintenance costs | 落在约定使用预算<br>Remain within the agreed usage budget |

<!-- b191 -->

**中文**

不能只比较 AI 输出所需秒数与人工全部工作时间。必须把文档准备、错误修正、人工复核和异常处理计入有效成本。试点评估保留未解决项，记录数据版本、模型版本、FastGPT 版本、提示词和运行日期。

**English**

Do not compare only the seconds needed to generate AI output with the entire duration of human work. Include document preparation, corrections, human review, and exception handling in effective cost. Retain unresolved items and record data version, model version, FastGPT version, prompts, and run date.

<!-- b192 -->

**中文**

建议结束交付包括可演示流程、可复核评测表、成本假设、已知限制、上线前待办和交接培训。业务负责人、安全负责人和技术负责人分别确认其负责部分。

**English**

Closing deliverables should include a demonstrable workflow, reviewable evaluation sheet, cost assumptions, known limitations, pre-production actions, and handover training. Business, security, and technical owners each confirm their areas of responsibility.

<!-- b193 -->

### 首轮验收集与阈值草案 / Draft first-round acceptance set and thresholds

<!-- b194 -->

**中文**

建议先准备 120 条样本：60 条可回答问题、20 条需澄清、15 条无依据必须拒答、15 条权限测试、10 条工具故障。另留 30 条从未用于调参的盲测样本。评测由客户业务专家按预先定义的评分表完成，必要时双人复核分歧。

**English**

Begin with 120 samples: 60 answerable questions, 20 requiring clarification, 15 requiring refusal because evidence is absent, 15 permission tests, and 10 tool failures. Hold back another 30 blind-test samples that are never used for tuning. Customer business experts assess results using a predefined rubric, with a second reviewer resolving disagreements where needed.

<!-- b195 -->

**中文**

方向性门槛可设为可回答集正确率至少 90%、关键引用支持率至少 95%、所有权限与必须拒答样本满足约定行为；这些是建议谈判起点，并非 FastGPT 保证。任何严重泄漏或未经授权写入均阻止上线。报告同时给出通过数/总数，说明小样本无法证明总体零风险。

**English**

Illustrative thresholds are at least 90% correctness on the answerable set, at least 95% support for key citations, and agreed behavior for every permission and mandatory-refusal sample. These are proposed negotiation starting points, not FastGPT guarantees. Any serious disclosure or unauthorized write blocks production release. Report passed samples and total samples together, and explain that a small sample cannot prove zero overall risk.

<!-- b196 -->

**中文**

效率以同一批任务的中位处理时间和 P90 衡量，包含人审与重做。仅在质量门槛达标后讨论提效。若增加模型、知识来源或业务语言，重跑受影响集与核心回归集。

**English**

Measure efficiency using median and P90 handling times on the same tasks, including human review and rework. Discuss efficiency gains only after quality thresholds pass. When models, knowledge sources, or business languages change, rerun affected tests and the core regression set.


<div class="page-break"></div>

<!-- b198 -->

## 第22章：参考技术架构与实施流程 / Chapter 22: Reference architecture and implementation process

<!-- b199 -->

**中文**

参考路径为：客户授权资料进入清洗和分类流程，带权限与版本标记建立知识库；业务请求通过身份和场景规则进入 FastGPT；工作流检索证据、调用获准工具并产生草稿；人工审批后才进入需要写入的业务系统；评测和日志支持持续改进。这是 CNPS 的实施设计，不是已部署系统的描述。

**English**

The proposed flow begins with customer-authorized materials being cleaned, classified, and indexed with access and version metadata. Business requests enter FastGPT through identity and use-case rules. Workflows retrieve evidence, call approved tools, and generate drafts. Human approval precedes any write to a business system. Evaluation and logs support ongoing improvement. This is a CNPS implementation design, not a description of an already deployed system.

<!-- b200 -->

**中文**

```text
授权文档 → 解析、元数据与访问规则 → 知识索引
用户／客服请求 → 身份核验 → FastGPT 工作流 → 带来源回答
FastGPT 工作流 → 获准 API → 只读数据
带来源回答 → 人工复核 → 工单／RFQ 草稿
```

**English**

```text
Authorized documents -> Parsing + metadata + access rules -> Knowledge index
User / support request -> Identity check -> FastGPT workflow -> Cited answer
                                               |                 |
                                         Approved API       Human review
                                               |                 |
                                         Read-only data   Ticket / RFQ draft
```

<!-- b201 -->

**中文**

部署需列清模型、嵌入、重排、OCR、数据库、对象存储、备份、日志和外部连接器。每项写明区域、版本、访问主体、成本与故障影响。跨境数据讨论必须覆盖整条链路，不能只说明应用服务器放在哪里。

**English**

The deployment inventory must identify models, embeddings, reranking, OCR, databases, object storage, backups, logs, and external connectors. Record the region, version, access parties, cost, and failure impact for each. Cross-border data discussions must cover the full chain, not just the application server's location.

<!-- b202 -->

**中文**

实施顺序建议为只读访问、影子运行、人审辅助、有限生产和逐步扩展。对写入接口设置权限最小化、幂等键、超时、重试上限和可回滚操作。出现异常时停止自动写入，保留明确可执行的人工流程。

**English**

The recommended sequence is read-only access, shadow operation, human-reviewed assistance, limited production, and gradual expansion. Write interfaces require least privilege, idempotency keys, timeouts, retry limits, and reversible operations. Stop automated writes when exceptions occur and retain a clear, executable manual process.

<!-- b203 -->

### 生产运行的控制点 / Controls for production operation

<!-- b204 -->

**中文**

外部资料均视为数据，文档内的“忽略规则”“调用此网址”等文字不得成为工具指令。检索前落实身份与访问过滤；数据库账户默认只读；可调用工具及目标域名由配置允许清单决定。模型判断不能绕过确定性的权限控制。

**English**

Treat external materials as data. Instructions embedded in documents, such as “ignore the rules” or “call this URL,” must not become tool instructions. Enforce identity and access filtering before retrieval. Database accounts should be read-only by default. Configuration allowlists define callable tools and destination domains. Model judgments must not bypass deterministic access controls.

<!-- b205 -->

**中文**

每个工作流设置运行耗时和费用上限，日志默认去除敏感字段。RFQ 的价格、交期、替代型号和客户邮件只能生成草稿，需授权人员确认。发生第三方故障时进入人工队列，附带必要上下文；不得静默丢单或无限重试。

**English**

Set runtime and cost limits for each workflow and remove sensitive fields from logs by default. RFQ prices, delivery dates, substitute models, and customer emails remain drafts until authorized staff confirm them. Third-party failures should route work to a human queue with necessary context. Never silently lose inquiries or retry without limit.

<!-- b206 -->

**中文**

交付文件应包含依赖版本、备份恢复步骤、紧急停用入口、人工处理方式、监测责任和升级联系人。上线前演练一次外部模型不可用和一次知识库恢复，记录实际恢复时间而非承诺未经测试的指标。

**English**

Delivery documentation should include dependency versions, backup and recovery steps, an emergency stop, manual procedures, monitoring responsibilities, and escalation contacts. Before launch, rehearse an external-model outage and a knowledge-base restore. Record actual recovery times rather than promising untested targets.


<div class="page-break"></div>

<!-- b208 -->

## 第23章：许可、数据与采购风险 / Chapter 23: Licensing, data, and procurement risks

<!-- b209 -->

**中文**

FastGPT 的 LICENSE 采用 Apache 2.0 加附加条件：公开条款允许一定商业使用，但类似 FastGPT 的多租户 SaaS 运营和控制台标识或版权改动涉及具体授权要求。部署前应向 FastGPT 确认实际模式，不把“开源”解释成无限制白标转售。[FastGPT LICENSE](https://github.com/labring/FastGPT/blob/main/LICENSE)。

**English**

FastGPT's LICENSE uses Apache 2.0 with additional conditions. The public terms permit certain commercial uses, while operating a FastGPT-like multi-tenant SaaS and changing console branding or copyright notices involve specific authorization requirements. Confirm the actual delivery model with FastGPT before deployment. Open source does not mean unrestricted white-label resale. [FastGPT LICENSE](https://github.com/labring/FastGPT/blob/main/LICENSE).

<!-- b210 -->

### 许可检查落到具体交付模式 / Apply license checks to the actual delivery model

<!-- b211 -->

| 拟交付模式<br>Proposed delivery model | 需要核实的事项<br>What to verify | 销售文件写法<br>Wording in sales documents |
| --- | --- | --- |
| 客户内部单一企业平台<br>Internal platform for one customer enterprise | 所用版本、企业功能和支持条款<br>Version, enterprise features, and support terms | 平台许可与实施服务分别列明<br>List platform licensing and implementation separately |
| CNPS 应用的后端服务<br>Backend service for a CNPS application | 与上游定义及实际功能是否一致<br>Fit with upstream definitions and actual functionality | 描述最终用户如何使用<br>Describe how end users use the application |
| 类似平台的多租户 SaaS<br>Similar multi-tenant SaaS platform | 取得 FastGPT 明确书面授权<br>Explicit written authorization from FastGPT | 未确认前不售卖该模式<br>Do not sell this model before confirmation |
| 修改控制台标识或版权<br>Changes to console branding or copyright | 取得相应商业许可和品牌许可<br>Relevant commercial and brand permissions | 不承诺默认白标<br>Do not imply white-label rights by default |

<!-- b212 -->

**中文**

上述是对公开许可的采购检查框架，不替代双方协议或专业法律审查。合作证书、代码许可证、客户案例转载和客户 logo 使用是不同的授权事项，必须分别管理。

**English**

This is a procurement-check framework based on the public license. It does not replace the parties' agreements or professional legal review. Partnership certificates, code licenses, republication of customer cases, and customer-logo use are separate permissions that require separate management.

<!-- b213 -->

**中文**

企业采购需要确认处理主体、数据类别、处理地点、子处理者、访问权限、保留期限、删除方式和事件通知机制。欧盟项目需逐项评估 GDPR 及适用 AI Act 义务；适用时间和系统分类以当前法规与专业审查为准，不从“私有部署”直接宣称合规。[欧盟 AI Act 官方说明](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)。

**English**

Enterprise procurement should confirm processing entities, data categories, processing locations, subprocessors, access rights, retention, deletion, and incident-notification mechanisms. EU projects require individual assessment of GDPR and applicable AI Act duties. Applicability dates and system classification depend on current law and professional review. Private deployment alone does not establish compliance. [Official EU AI Act overview](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai).

<!-- b214 -->

**中文**

不把未核实的 SOC 2、ISO 27001、HIPAA、数据零出境或全天候 SLA 放到 CNPS 网页。可以提供真实可说明的控制设计，并在采购阶段由客户审查。来源案例中的权限描述也不能当作当前 CNPS 系统的认证。

**English**

Do not put unverified SOC 2, ISO 27001, HIPAA, zero cross-border data-transfer, or round-the-clock SLA claims on CNPS pages. Present actual control designs that can be explained and reviewed during procurement. Permission features described in a source case do not certify a current CNPS system.

<!-- b215 -->

### 最小数据与采购材料 / Minimum data and procurement materials

<!-- b216 -->

**中文**

初次询盘仅需业务联系和流程描述。真实客户记录、个人敏感信息、账号口令和生产数据不要通过公开表单或演示工具收集。试点启动后再按双方约定的数据传输方式、权限和保留期限提供样本。营销订阅需单独选择，不能把询盘视为无限期订阅同意。

**English**

An initial inquiry needs only business contact information and a workflow description. Do not collect real customer records, sensitive personal data, passwords, or production data through public forms or demonstration tools. Once a pilot begins, exchange samples using the agreed transfer method, access rights, and retention period. Marketing subscription requires a separate choice; an inquiry is not consent to indefinite subscription.

<!-- b217 -->

**中文**

采购资料包应提供真实公司主体、服务联系人、分包与平台角色、数据流、控制说明、SOW、支持范围和退出方式。客户要求删除时需覆盖应用、日志、索引和备份保留规则，并说明哪些义务影响删除时点。具体数据保护条款应按地区和业务由双方审核，不能用此公开方案替代。

**English**

The procurement pack should contain the actual company entity, service contact, subcontractor and platform roles, data flows, control explanations, SOW, support scope, and exit process. Deletion requests must address the application, logs, indexes, and backup-retention rules, including obligations that affect deletion timing. The parties should review data-protection terms for the relevant region and business; this public playbook cannot replace those terms.

<!-- b218 -->

**中文**

安全重点包括附件中的提示词注入、未经授权的工具调用、跨租户资料泄漏、敏感日志、供应链插件和过期版本。需要定期查看上游安全公告并规划更新，而非将一次演示通过视为长期安全。[官方安全页](https://github.com/labring/FastGPT/security)。

**English**

Security priorities include prompt injection in attachments, unauthorized tool calls, cross-tenant disclosure, sensitive logs, supply-chain plugins, and outdated versions. Review upstream security notices regularly and plan updates. Passing one demonstration does not establish long-term security. [Official security page](https://github.com/labring/FastGPT/security).


<div class="page-break"></div>

<!-- b220 -->

## 第24章：预算、单位经济与敏感性 / Chapter 24: Budget, unit economics, and sensitivity

<!-- b221 -->

**中文**

以下数字仅用于规划实验，未代表任何双方现有价格。先从能够承担的销售和交付能力反推预算，再用真实数据修正。不能把官网发布视作已经创造收入。

**English**

The figures below are for planning experiments and do not represent either party's current prices. Work backward from affordable sales and delivery capacity to set a budget, then revise it using actual data. Website publication must not be treated as revenue already generated.

<!-- b222 -->

**中文**

建议 90 天实验预算暂设 18,000 美元：内容与本地化 3,000，样例与试点资产 5,000，销售与渠道运营 4,000，安全及合同准备 2,000，小规模分发实验 2,000，预备费 2,000。它包含现金与内部工时的估算价值；实际支出需单独审批，本报告并未授权投放或采购。

**English**

An illustrative 90-day experiment budget is $18,000: $3,000 for content and localization, $5,000 for examples and pilot assets, $4,000 for sales and channel operations, $2,000 for security and contract preparation, $2,000 for small distribution experiments, and $2,000 contingency. It includes cash and estimated internal labor value. Actual spending needs separate approval; this report authorizes no advertising or purchasing.

<!-- b223 -->

**中文**

漏斗基准情景为 3,000 次目标访问 × 2% 有效询盘 × 40% SQL × 25% 试点成交，即 6 个试点。若其中 50% 扩展，则对应 3 个后续项目。各转化率都是假设；在周期较长时，扩展回款可能发生在 90 天之后。

**English**

The base-case funnel is 3,000 target visits × 2% valid inquiry rate × 40% SQL rate × 25% pilot win rate, producing 6 pilots. If 50% expand, this implies 3 subsequent projects. Every conversion rate is an assumption. With longer sales cycles, expansion payments may arrive after the 90-day period.

<!-- b224 -->

**中文**

示例试点服务费 3,000，直接交付成本 1,800，贡献 1,200；示例实施费 12,000，直接成本 7,200，贡献 4,800。模型和平台许可是否包含必须另行约定。按此示例，6 个试点和 3 个实施贡献合计 21,600，尚需减去未包含的获客与固定费用，不能称为净利润。

**English**

An illustrative pilot fee of $3,000 with $1,800 direct delivery cost contributes $1,200. An illustrative implementation fee of $12,000 with $7,200 direct cost contributes $4,800. Whether model costs and platform licensing are included must be separately agreed. Under these assumptions, 6 pilots and 3 implementations contribute $21,600 before acquisition and fixed costs not already included. This is not net profit.

<!-- b225 -->

### 避免成本重复计算 / Avoid counting costs twice

<!-- b226 -->

**中文**

18,000 的实验预算只计可复用资产、获客和项目准备，不包含具体收费客户项目的直接交付工时。若某员工同时负责两者，必须按实际工时拆分。同一笔许可证、开发工时或模型用量只能计入一次。基准情景收入为 54,000，直接成本 32,400，贡献 21,600；再扣完整实验预算剩 3,600，仍未扣税、融资、其他管理费，且不保证在 90 天全部收款。

**English**

The $18,000 experiment budget covers only reusable assets, acquisition, and project preparation; it excludes direct delivery hours for specific paying customer projects. Split the actual hours of staff who perform both activities. Count each license, development hour, or model charge only once. Base-case revenue is $54,000, direct cost $32,400, and contribution $21,600. Deducting the full experiment budget leaves $3,600 before tax, financing, and other overheads, with no guarantee that all payment is collected within 90 days.

<!-- b227 -->

| 情景<br>Scenario | 访问/询盘率/SQL率/试点率<br>Visits / inquiry rate / SQL rate / pilot win rate | 预期试点数<br>Expected pilots | 按50%扩展<br>At 50% expansion |
| --- | --- | --- | --- |
| 低<br>Low | 1,000 / 1% / 25% / 20%<br>1,000 / 1% / 25% / 20% | 0.5<br>0.5 | 0.25<br>0.25 |
| 基准<br>Base | 3,000 / 2% / 40% / 25%<br>3,000 / 2% / 40% / 25% | 6<br>6 | 3<br>3 |
| 高<br>High | 5,000 / 3% / 50% / 30%<br>5,000 / 3% / 50% / 30% | 22.5<br>22.5 | 11.25<br>11.25 |

<!-- b228 -->

**中文**

小数是概率期望，实际合同必须为整数。高情景远超初期团队可能的承接能力，应设每两周并行试点上限并排队，不把潜在线索直接算成收入。按基准漏斗，一个获得扩展的组合贡献为 2×1,200+4,800=7,200；要覆盖18,000实验预算约需2.5组，即至少3组，前提是上述成本假设成立。

**English**

Fractions are probabilistic expected values; actual contracts are whole numbers. The high scenario may substantially exceed an early team's capacity. Set a cap on concurrent pilots for each two-week period and queue excess work. Do not count potential leads directly as revenue. In the base funnel, one combination yielding an expansion contributes 2×1,200+4,800=7,200. Covering the $18,000 experiment budget requires about 2.5 such combinations, hence at least 3, provided the cost assumptions hold.

<!-- b229 -->

**中文**

应同时测量现金回收期、项目范围蔓延、返工率和支持工时。报价能力不足时，宁可提高最低项目范围或缩小场景，也不要靠低价承接大量无法维护的定制工作。

**English**

Also measure cash payback time, scope creep, rework rate, and support hours. If pricing capability is weak, raise the minimum engagement scope or narrow the use case rather than accepting large volumes of unsustainable customization at low prices.


<div class="page-break"></div>

<!-- b231 -->

## 第25章：九十天执行与责任人 / Chapter 25: Ninety-day execution and accountable roles

<!-- b232 -->

**中文**

以实际项目启动日为第 1 天，不把资料发布日期作为已经执行的起点。以下角色需要 CNPS 指定真人负责；未提供姓名时使用角色，不虚构团队人数和能力。

**English**

Day 1 is the actual project start date, not the date this material was published. CNPS must assign real people to the roles below. Where names are unavailable, use role titles without inventing team size or capability.

<!-- b233 -->

| 时间<br>Period | 负责人<br>Owner | 必须交付<br>Required deliverables | 放行条件<br>Release condition |
| --- | --- | --- | --- |
| 第 1-14 天<br>Days 1-14 | 项目负责人 + 内容负责人<br>Project owner + content owner | 合作边界、英文页、案例源、接单流程<br>Partnership boundaries, English pages, case sources, inquiry process | 联系入口可用、陈述可核验<br>Working contact entry point and verifiable claims |
| 第 15-30 天<br>Days 15-30 | 售前 + 工程负责人<br>Presales + engineering owner | 访谈、合成样例、三种场景演示<br>Interviews, synthetic examples, three use-case demonstrations | 至少一场景可完整评测<br>At least one use case can be evaluated end to end |
| 第 31-60 天<br>Days 31-60 | 销售 + 交付负责人<br>Sales + delivery owner | 范围受控试点与每周复盘<br>Bounded pilots and weekly reviews | 验收、工时和客户反馈齐全<br>Complete acceptance, time, and customer-feedback records |
| 第 61-90 天<br>Days 61-90 | 项目负责人 + 合作团队<br>Project owner + partnership team | 扩展建议、渠道教材、经济复盘<br>Expansion proposals, channel training materials, economic review | 有回款或明确暂停原因<br>Collected payment or a clear reason to pause |

<!-- b234 -->

**中文**

每周例会只围绕四件事：本周获得了什么客户证据、哪些假设被推翻、下一项动作由谁何时完成、是否需要停止某项投入。页面数量和社交活跃度不能取代这些问题。

**English**

Weekly meetings should address four questions: What customer evidence did we obtain? Which assumptions were overturned? Who will complete the next action, and when? Should any investment stop? Page counts and social activity cannot replace these questions.

<!-- b235 -->

**中文**

第一阶段完成定义是网站入口与销售流程可用，第二阶段是样例可复现，第三阶段是客户验收，第四阶段才是可复制的服务产品。即使未形成扩展订单，只要明确识别出需求或交付限制，也应真实记录，避免把活动完成当成商业成功。

**English**

Phase one is complete when website entry points and sales processes work. Phase two requires reproducible examples; phase three requires customer acceptance; only phase four establishes a repeatable service offering. Even without expansion orders, record discovered demand or delivery constraints honestly. Completed activities do not equal commercial success.

<!-- b236 -->

### 不能被日程替代的放行门槛 / Release gates that dates cannot replace

<!-- b237 -->

| 门槛<br>Gate | 放行人角色<br>Approving role | 必须看到的证据<br>Required evidence |
| --- | --- | --- |
| 可销售<br>Ready to sell | CNPS 商务负责人<br>CNPS commercial owner | 可提供的服务与平台授权相符<br>Offered services match platform authorization |
| 可接单<br>Ready to receive inquiries | 销售运营负责人<br>Sales operations owner | 联系入口、收件责任人与跟进流程<br>Working contact path, intake owner, and follow-up process |
| 可试点<br>Ready to pilot | 交付负责人<br>Delivery owner | 数据权限、样本、范围和验收人<br>Data permissions, samples, scope, and acceptance owner |
| 可生产<br>Ready for production | 客户 IT 与业务负责人<br>Customer IT and business owners | 质量、权限、恢复和人审通过<br>Quality, access, recovery, and human-review checks pass |
| 可扩量<br>Ready to scale | 项目负责人<br>Project owner | 回款、毛利、支持负担可承受<br>Affordable collection cycle, margin, and support load |

<!-- b238 -->

**中文**

启动前为每个角色填入真实姓名和替补；本文未替 CNPS 任命人员。首月销售任务可由一个人兼任多个角色，但所有待办仍需唯一负责人和截止时间。未通过生产门槛的项目不能因为日程到了第60天而直接上线。

**English**

Assign a real name and backup for every role before starting; this report does not appoint staff for CNPS. One person may hold several first-month sales roles, but every action still needs a unique owner and deadline. A project that has not passed its production gate cannot go live merely because day 60 has arrived.


<div class="page-break"></div>

<!-- b240 -->

## 第26章：风险、实验与停止条件 / Chapter 26: Risks, experiments, and stop conditions

<!-- b241 -->

| 风险<br>Risk | 早期信号<br>Early signal | 处理动作<br>Response |
| --- | --- | --- |
| 来访者不匹配<br>Visitors are a poor fit | 下载多、企业对话少<br>Many downloads, few business conversations | 改场景标题和渠道<br>Change use-case headlines and channels |
| 有兴趣无预算<br>Interest without budget | 演示多、无人推进采购<br>Many demonstrations, nobody advancing procurement | 收紧诊断资格<br>Tighten diagnostic qualification |
| 资料质量差<br>Poor data quality | 错误集中于扫描和旧版本<br>Errors concentrated in scans and old versions | 先卖数据准备阶段<br>Offer data preparation first |
| 试点范围失控<br>Uncontrolled pilot scope | 每周新增接口和语言<br>New interfaces and languages added weekly | 使用变更单<br>Use change orders |
| 许可边界不清<br>Unclear licensing | 客户要求白标 SaaS<br>Customer requests white-label SaaS | 先核实授权再报价<br>Verify authorization before quoting |
| 支持负担过重<br>Excessive support load | 单项目长期占用工程师<br>One project occupies engineers for extended periods | 明确服务包与升级路径<br>Define service packages and escalation paths |

<!-- b242 -->

**中文**

实验 A 比较“平台功能”与“一个流程结果”的标题，使用合格询盘率而非点击率判断。实验 B 比较带来源的案例与流程演示，观察诊断会推进率。实验 C 比较泛表单与需求整理器，观察有效信息完整度与人工处理成本。

**English**

Experiment A compares platform-feature headlines with single-workflow outcome headlines, judging valid inquiry rate rather than click-through rate. Experiment B compares sourced cases with workflow demonstrations, measuring progression to diagnostic meetings. Experiment C compares a generic form with a requirement builder, assessing information completeness and human handling cost.

<!-- b243 -->

**中文**

样本很小时只作方向判断，不声称统计显著。连续几次对话不能代表一个国家的总体需求。记录访客来源、企业岗位、问题和下一步，防止把不同渠道质量混在一起。

**English**

Small samples support directional judgments only, not claims of statistical significance. A few conversations cannot represent an entire country's demand. Record visitor source, business role, problem, and next step so differences in channel quality are not mixed together.

<!-- b244 -->

**中文**

建议在完成 15 次目标客户访谈后复盘是否存在重复问题；完成 3 个有明确验收的试点后复盘是否可以形成标准服务。若缺乏重复需求、交付始终超预算或合规前提无法满足，应暂停扩量并调整切入点。

**English**

After 15 target-customer interviews, review whether recurring problems exist. After 3 pilots with explicit acceptance criteria, review whether a standard service can be formed. Pause scaling and adjust the entry point if demand does not repeat, delivery consistently exceeds budget, or compliance prerequisites cannot be met.


<div class="page-break"></div>

<!-- b246 -->

## 第27章：可直接使用的英文模板与采购 FAQ / Chapter 27: Ready-to-use English templates and procurement FAQ

<!-- b247 -->

**中文**

**主动询盘回复草稿**

**English**

**Inbound reply draft**

<!-- b248 -->

**中文**

感谢您说明工作流程。为了界定有价值的试点，能否分享主要任务、涉及的系统，以及几个不涉密的示例问题或请求？我们将据此讨论所需数据、复核步骤和验收计划。现阶段请不要发送凭据或生产环境中的客户记录。

**English**

Thank you for describing your workflow. To scope a useful pilot, could you share the main task, the systems involved, and a few non-confidential example questions or requests? We will use these to discuss the data needed, the review steps and an acceptance plan. Please do not send credentials or production customer records at this stage.

<!-- b249 -->

**中文**

**试点需求简报**

**English**

**Pilot brief**

<!-- b250 -->

**中文**

业务任务／流程负责人／当前基线／已获授权的数据／部署偏好／支持语言／预期输出／人工审批／验收样本／排除范围／成本假设／下一决策日期。

**English**

Business task / process owner / current baseline / approved data / deployment preference / supported language / expected output / human approval / acceptance sample / exclusions / cost assumptions / next decision date.

<!-- b251 -->

**中文**

**采购常见问题**

**English**

**Procurement FAQ**

<!-- b252 -->

**中文**

**CNPS 是平台厂商吗？** CNPS 是 FastGPT 的合作伙伴，提供需求界定和实施服务。平台许可与 CNPS 服务在书面方案中分别确定。

**English**

**Is CNPS the platform vendor?** CNPS is a FastGPT partner providing scoping and implementation services. Platform licensing and CNPS services are defined in the written proposal.

<!-- b253 -->

**中文**

**能否使用我们自己的环境？** 我们可以评估在您的环境中部署。模型端点、文档处理、备份和集成都必须纳入数据流审查。

**English**

**Can we use our own environment?** We can assess a deployment in your environment. Model endpoints, document processing, backups and integrations must be included in the data-flow review.

<!-- b254 -->

**中文**

**公开案例是 CNPS 的客户项目吗？** 参考案例由 FastGPT 发布，用于说明可能的工作流程；您的项目将拥有自身的范围和验收标准。

**English**

**Are the published cases CNPS customer projects?** The reference cases are published by FastGPT. They are provided to explain possible workflows; your project will have its own scope and acceptance criteria.

<!-- b255 -->

**中文**

**决定全面上线之前，我们会获得什么？** 一份范围明确的试点方案，说明输入、输出、假设和测量方式。双方按约定复盘试点后，再推进生产上线。

**English**

**What do we get before committing to a rollout?** A scoped pilot proposal describing inputs, outputs, assumptions and measurement. Production rollout follows an agreed review of the pilot.

<!-- b256 -->

**中文**

**如何索取方案？** 请联系 sales@cnps.ai，或使用 www.cnps.ai 的 FastGPT 询盘页面。告诉我们一个工作流程及其负责人。

**English**

**How do we request a proposal?** Contact sales@cnps.ai or use the FastGPT inquiry page on www.cnps.ai. Tell us one workflow and who owns it.


<div class="page-break"></div>

<!-- b258 -->

## 第28章：来源索引与更新规则 / Chapter 28: Source index and update rules

<!-- b259 -->

**中文**

访问核对日为 2026-09-03。链接中的 main 分支会变化，正式交付时应记录选用版本或 commit。案例总结采用发布方文字，不复制原始图表和整篇材料。下列来源支持事实观察，策略建议属于 CNPS 的分析。

**English**

Sources were checked on 2026-09-03. Linked main branches can change; record the selected version or commit for a formal delivery. Case summaries draw on the publishers' accounts without reproducing original charts or full articles. The sources below support factual observations; strategic recommendations are CNPS's analysis.

<!-- b260 -->

### 产品、生态与规则 / Products, ecosystems, and policies

<!-- b261 -->

- S01 [FastGPT 官网](https://fastgpt.io/)：公开产品定位。

  S01 [FastGPT website](https://fastgpt.io/): public product positioning.

- S02 [FastGPT GitHub](https://github.com/labring/FastGPT)：源码与使用入口。

  S02 [FastGPT GitHub](https://github.com/labring/FastGPT): source code and usage entry points.

- S03 [FastGPT LICENSE](https://github.com/labring/FastGPT/blob/main/LICENSE)：商业许可附加条件。

  S03 [FastGPT LICENSE](https://github.com/labring/FastGPT/blob/main/LICENSE): additional commercial licensing conditions.

- S04 [FastGPT 案例中心](https://solutions.fastgpt.cn/customers)：案例与方案目录，二者需区分。

  S04 [FastGPT case center](https://solutions.fastgpt.cn/customers): directory of cases and solution concepts, which must be distinguished.

- S05 [Dify GitHub](https://github.com/langgenius/dify)：开源与部署路径。

  S05 [Dify GitHub](https://github.com/langgenius/dify): open-source and deployment paths.

- S06 [Dify partners](https://dify.ai/partners)：服务和生态分层。

  S06 [Dify partners](https://dify.ai/partners): service and ecosystem segmentation.

- S07 [京进与 LangGenius 合作公告，2026-04-10](https://group.kyoshin.co.jp/news/741333/)：日本企业合作。

  S07 [Kyoshin–LangGenius partnership announcement, 2026-04-10](https://group.kyoshin.co.jp/news/741333/): Japanese enterprise partnership.

- S08 [RAGFlow](https://github.com/infiniflow/ragflow)：文档与检索产品组织。

  S08 [RAGFlow](https://github.com/infiniflow/ragflow): product organization around documents and retrieval.

- S09 [LobeHub](https://github.com/lobehub/lobehub)：当前仓库，原 lobe-chat 重定向。

  S09 [LobeHub](https://github.com/lobehub/lobehub): current repository, redirected from lobe-chat.

- S10 [Chatbox](https://github.com/chatboxai/chatbox)：桌面客户端分发。

  S10 [Chatbox](https://github.com/chatboxai/chatbox): desktop-client distribution.

- S11 [OpenManus](https://github.com/FoundationAgents/OpenManus)：开源复现参考。

  S11 [OpenManus](https://github.com/FoundationAgents/OpenManus): reference for open-source reproduction.

- S12 [Markdown Exporter](https://github.com/bowenliang123/markdown-exporter)：文档导出生态。

  S12 [Markdown Exporter](https://github.com/bowenliang123/markdown-exporter): document-export ecosystem.

- P01 [欧盟 AI Act](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)：法规适用需另评估。

  P01 [EU AI Act](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai): applicability requires separate assessment.

- P02 [Google Search Essentials](https://developers.google.com/search/docs/essentials)：技术和内容基本要求。

  P02 [Google Search Essentials](https://developers.google.com/search/docs/essentials): basic technical and content requirements.

- P03 [GitHub Acceptable Use](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies)：平台推广边界。

  P03 [GitHub Acceptable Use](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies): boundaries for platform promotion.

- P04 [FastGPT Security](https://github.com/labring/FastGPT/security)：安全公告与报告流程。

  P04 [FastGPT Security](https://github.com/labring/FastGPT/security): security notices and reporting process.

<!-- b262 -->

### 八个案例原文 / Original sources for the eight cases

<!-- b263 -->

- C01 [延锋 iSAP](https://solutions.fastgpt.cn/customers/manufacturing-production-processing/isap-it-ops-robot-solution)

  C01 [Yanfeng iSAP](https://solutions.fastgpt.cn/customers/manufacturing-production-processing/isap-it-ops-robot-solution)

- C02 [商络料号](https://solutions.fastgpt.cn/customers/manufacturing-production-processing/ai-part-number-analyzer-system)

  C02 [Shangluo part-number processing](https://solutions.fastgpt.cn/customers/manufacturing-production-processing/ai-part-number-analyzer-system)

- C03 [延锋供应商](https://solutions.fastgpt.cn/customers/manufacturing-production-processing/fastgpt-supplier-recommendation-system)

  C03 [Yanfeng supplier recommendation](https://solutions.fastgpt.cn/customers/manufacturing-production-processing/fastgpt-supplier-recommendation-system)

- C04 [欧派派单](https://solutions.fastgpt.cn/customers/e-commerce-retail-trade/retail-ai-dispatch-platform)

  C04 [OPPEIN dispatch](https://solutions.fastgpt.cn/customers/e-commerce-retail-trade/retail-ai-dispatch-platform)

- C05 [昭昭客服](https://solutions.fastgpt.cn/customers/education-training-research-study/ai-intelligent-customer-service)

  C05 [Zhaozhao support](https://solutions.fastgpt.cn/customers/education-training-research-study/ai-intelligent-customer-service)

- C06 [制度与项目查询](https://solutions.fastgpt.cn/customers/construction-engineering-renovation/text-sql-institution-agent)

  C06 [Policy and project queries](https://solutions.fastgpt.cn/customers/construction-engineering-renovation/text-sql-institution-agent)

- C07 [延锋审单](https://solutions.fastgpt.cn/customers/manufacturing-production-processing/ai-financial-audit-solution)

  C07 [Yanfeng document review](https://solutions.fastgpt.cn/customers/manufacturing-production-processing/ai-financial-audit-solution)

- C08 [物流知识客服](https://solutions.fastgpt.cn/customers/transportation-logistics/yc-intelligent-customer-service)

  C08 [Logistics knowledge support](https://solutions.fastgpt.cn/customers/transportation-logistics/yc-intelligent-customer-service)

<!-- b264 -->

### X 观察样本 / Observation samples from X

<!-- b265 -->

- X01 [Luyu Zhang：国际活动，2024-09-05](https://x.com/goocarlos/status/1831721654227234941)

  X01 [Luyu Zhang: international event, 2024-09-05](https://x.com/goocarlos/status/1831721654227234941)

- X02 [Tom：日语工作流教程，2025-01-07](https://x.com/0x__tom/status/1876558928018088123)

  X02 [Tom: Japanese workflow tutorial, 2025-01-07](https://x.com/0x__tom/status/1876558928018088123)

- X03 [まつにぃ：文档导出，2025-03-15](https://x.com/yugen_matuni/status/1900815012652085400)

  X03 [まつにぃ: document export, 2025-03-15](https://x.com/yugen_matuni/status/1900815012652085400)

- X04 [Canopy Wave：模型插件，2026-01-29](https://x.com/CanopyWave_CW/status/2016822425439392093/photo/1)

  X04 [Canopy Wave: model plugin, 2026-01-29](https://x.com/CanopyWave_CW/status/2016822425439392093/photo/1)

- X05 [digitalpr_jp：日本合作，2026-04-10](https://x.com/digitalpr_jp/status/2042456153519464803)

  X05 [digitalpr_jp: Japanese partnership, 2026-04-10](https://x.com/digitalpr_jp/status/2042456153519464803)

<!-- b266 -->

**中文**

每次更新需记录事实变化、影响页面、修改责任人和复核日期。公开策略中的假设应在取得客户许可和可靠数据后逐步替换为实证，案例授权或材料失效时撤下相关内容。

**English**

For every update, record factual changes, affected pages, the responsible editor, and review date. Replace public-strategy assumptions with evidence as customer permission and reliable data become available. Remove affected content when case authorization or supporting materials cease to be valid.
