<!-- source-block: b000 -->

# FastGPT × CNPS.AI: Global Growth and Delivery Playbook

**Language edition: complete standalone English edition. Preserves the 28 chapters and 23 source-content revisions of the 2026-09-03 research edition. This localization is not new research or an additional research revision. Website capabilities and implementation-status descriptions in the report refer to that research date.**

<!-- source-block: b001 -->

**Research date: 2026-09-03 | Public strategy edition | Website: www.cnps.ai | Format: Markdown**

<!-- source-block: b002 -->

**Audience: CNPS management and sales teams, the FastGPT partnership team, international enterprise buyers, and channel partners.**

<!-- source-block: b003 -->

The partnership relationship is based on information supplied by CNPS. This document does not constitute a FastGPT commitment on pricing, delivery dates, territorial exclusivity, or service levels. The cases are references published by FastGPT; CNPS implementation concepts and proposed targets are identified separately. All monetary amounts are pre-tax planning assumptions in US dollars, not effective quotations. This research did not obtain independently audited project data or either party's internal order data.

<!-- source-block: b004 -->

Markdown has no fixed paper size. This report contains 28 substantive chapters with explicit page breaks. An A4 reading edition is also provided; its actual page count is determined by the generated PDF. Version differences, validation findings, and SHA-256 hashes are retained in the revision record. The initial draft is excluded from the count of subsequent revisions.

<!-- source-block: b005 -->

**Core decision: turn verifiable FastGPT capabilities into enterprise implementation services with defined scope, acceptance criteria, and accountable owners. Enter through technical knowledge Q&A, support triage, and RFQ information processing, using small paid pilots to develop repeatable orders.**

<!-- source-block: b006 -->

## Reading guide

<!-- source-block: b007 -->

01 First principles; 02 Buying process; 03 Evidence method; 04 Product boundaries; 05 Partnership responsibilities; 06 Market selection; 07 Ideal customers; 08 Service offerings; 09 Case selection; 10 Case localization; 11 The Dify approach; 12 Other open-source approaches; 13 Evidence from X; 14 GitHub acquisition; 15 Website architecture; 16 English messaging; 17 Search strategy; 18 Content distribution; 19 Inquiry operations; 20 Sales and orders; 21 Pilot acceptance; 22 Technical delivery; 23 Data and licensing; 24 Unit economics; 25 Ninety-day execution; 26 Risks and experiments; 27 Templates and procurement FAQ; 28 Source index.

<!-- source-block: b008 -->

<div class="page-break"></div>

<!-- source-block: b009 -->

<a id="chapter-01"></a>

## Chapter 01: Define growth from first principles

<!-- source-block: b010 -->

Businesses buy AI to improve a task: handle customer requests faster, help employees find the right information, reduce repeated data entry, or create sales opportunities the business can actually handle. Product capabilities can lead to orders only when those improvements justify the costs of procurement, integration, use, and risk.

<!-- source-block: b011 -->

The website therefore needs to help suitable buyers make five judgments: Do I have this problem? Can the solution fit our existing systems? Can we validate it with our own data? Are total costs and responsibilities clear? Whom should we contact next? Each page should answer one of these questions and direct the next step to CNPS.

<!-- source-block: b012 -->

Growth can be decomposed into target-customer reach × relevant-use-case visit rate × valid inquiry rate × opportunity qualification rate × pilot win rate × expansion win rate. If any factor approaches zero, increasing traffic alone is unlikely to generate more orders. Delivery costs, acquisition costs, support workload, refunds, and rework must also be deducted to assess whether growth is healthy.

<!-- source-block: b013 -->

The recommended primary success metric is the number of projects from target international companies that pass the agreed pilot acceptance process and generate collected payment, checked against contribution margin. Page views, GitHub stars, X impressions, and form clicks diagnose the process; they do not replace commercial outcomes.

<!-- source-block: b014 -->

CNPS's proposed value lies in understanding international customers, defining use cases, communicating in English, implementing integrations, and maintaining solutions. FastGPT's value lies in the underlying platform and its development. Delivery capability must validate this division of work; partner status alone does not establish every service capability.

<!-- source-block: b015 -->

### Every metric needs a denominator and attribution

<!-- source-block: b016 -->

Valid inquiry rate = distinct companies submitting valid inquiries during the period / valid sessions on target use-case pages during the same period. A company engaging across several use cases counts as one new opportunity; later scope increases count as expansion. The SQL acceptance rate uses inquiries that have completed human qualification as its denominator, while unreviewed inquiries are reported separately. Orders are recorded separately as signed, invoiced, and paid.

<!-- source-block: b017 -->

Group the primary success metric into cohorts by acquisition month, with 30-, 60-, 90-, and 180-day conversion windows. This avoids mixing current-month traffic with orders acquired months earlier. A short-term learning metric can be the number of conversations with target companies that result in an agreed next step. Financial outcomes still depend on collected payment and actual project costs.

<!-- source-block: b018 -->

<div class="page-break"></div>

<!-- source-block: b019 -->

<a id="chapter-02"></a>

## Chapter 02: How international enterprise buyers decide

<!-- source-block: b020 -->

A developer may initiate an enterprise inquiry, a business manager may explain its value, IT may approve system access, security and procurement may complete reviews, and finance may arrange payment. The website should give each role appropriate evidence while maintaining consistent commitments.

<!-- source-block: b021 -->

| Buyer role | Primary question | Website material | Next step |
| --- | --- | --- | --- |
| Business owner | Which repetitive task can be reduced? | Use cases and measurement methods | Describe the workflow |
| Technical owner | How will data and interfaces connect? | Architecture, boundaries, and interface list | Technical assessment |
| Security owner | Who can access which data? | Data flows and control checklist | Security questionnaire |
| Procurement and finance | What are we buying, and how is it accepted? | Sample SOW and cost breakdown | Written quotation |
| Management | How can we expand with control? | Pilot results and governance plan | Phased expansion |

<!-- source-block: b022 -->

An unprepared, all-purpose AI demonstration may attract interest without revealing a budget. A more useful entry point is: describe one workflow and receive a suggested pilot scope. Initially collect only a work email, company, country or time zone, use case, existing systems, and intended timing. Budget and detailed data questions can follow later.

<!-- source-block: b023 -->

Sales needs consistent definitions. A valid inquiry has usable contact details, a real business use case, and implementation intent. An SQL, or sales-qualified lead, has a confirmed owner, problem, data conditions, and next-step date. A pilot is a distinct phase with defined scope and acceptance criteria. An expansion order is subsequent work that has been signed and entered collection or delivery under the contract. Automated replies and downloads must not be counted as SQLs.

<!-- source-block: b024 -->

<div class="page-break"></div>

<!-- source-block: b025 -->

<a id="chapter-03"></a>

## Chapter 03: Research method and evidence levels

<!-- source-block: b026 -->

The research covers FastGPT's official website, case center, and GitHub repository, alongside the public Dify, RAGFlow, LobeHub, OpenManus, and Chatbox projects. X is used to observe distribution content and adoption signals, followed by cross-checks against company announcements or repositories. The research date is 2026-09-03; historical posts retain their original dates.

<!-- source-block: b027 -->

| Level | Evidence type | What it can support | What it cannot support |
| --- | --- | --- | --- |
| A | Official source code, licenses, and product documentation | Public product and licensing statements | A specific customer's realized return |
| B | Vendor cases or partner announcements | Publicly reported adoption and outcomes | Independent audit or universal results |
| C | Authors' own practice posts on X | Activities publicly demonstrated by those authors | Overall market size or revenue |
| D | Analysis and planning assumptions in this report | Actionable experiment designs | Established facts |

<!-- source-block: b028 -->

Some X posts returned only empty page shells when opened directly. Those entries explicitly rely on public search-index excerpts. The report does not claim authenticated full-text access or cite video content that could not be verified. View counts change over time and are not used as evidence of commercial value.

<!-- source-block: b029 -->

The report uses an ecosystem definition of Chinese AI applications expanding internationally: projects associated with Chinese developers, Chinese-language communities, or a starting point in the Chinese market. It examines their global distribution and enterprise adoption mechanisms. It does not infer incorporation jurisdiction, ultimate control, data residency, or tax status. These must be verified separately for each supplier during procurement.

<!-- source-block: b030 -->

The research did not obtain CNPS baselines for current traffic, conversion rates, contracts, or delivery hours. The market rankings, budgets, funnels, and targets below are adjustable assumptions and must not be described as achieved results.

<!-- source-block: b031 -->

### Handling conflicting sources

<!-- source-block: b032 -->

The Zhaozhao support case uses “40%” differently: the directory summary describes the share of repetitive course-purchase and exam-registration inquiries, while the detailed overview describes an automated handling rate. The denominators conflict. This report and the English case summary exclude that figure. They retain only the clearly stated change in human handoff rate and label it as the publisher's claim. All pain-point distribution percentages in case charts are excluded because sampling and measurement methods are unspecified.

<!-- source-block: b033 -->

A crawler once interpreted the CNPS homepage as a redirect to the shop, whereas a direct HTTP request returned the normal main-site HTML. Implementation decisions rely on direct responses and browser checks. When facts conflict, preserve both the conflict and its resolution instead of selecting the version that appears more useful for sales.

<!-- source-block: b034 -->

<div class="page-break"></div>

<!-- source-block: b035 -->

<a id="chapter-04"></a>

## Chapter 04: Translate FastGPT capabilities into buyer value

<!-- source-block: b036 -->

FastGPT's public repository describes knowledge processing, RAG retrieval, visual workflows, and APIs. Its website also describes enterprise governance and implementation support. Actual capability depends on version, licensing, model choice, and deployment environment. Presales must map each requirement to an appropriate version. [FastGPT website](https://fastgpt.io/); [official repository](https://github.com/labring/FastGPT).

<!-- source-block: b037 -->

| Platform capability | Business outcome that can be offered | Work CNPS needs to provide |
| --- | --- | --- |
| Knowledge retrieval | Find supporting evidence in authorized materials | Document cleaning, version control, and evaluation |
| Visual workflows | Route repetitive tasks through defined rules | Business branches, error handling, and human review |
| APIs and tool connections | Fit into the customer's existing systems | Credential management, adaptation, and access checks |
| Model selection | Choose inference services by quality and cost | Comparative tests, regional fit, and limits |
| Enterprise governance | Meet departmental usage and review requirements | Verify the relevant edition and license item by item |

<!-- source-block: b038 -->

RAG support does not imply error-free answers. Private deployment does not imply that no data ever leaves the customer's environment. External models, OCR, embeddings, logs, and plugins may create additional data paths; the complete flow must be mapped.

<!-- source-block: b039 -->

CNPS should maintain a capability confirmation table containing the requirement, FastGPT version, community or commercial edition, required plugins, evidence link, tested environment, responsible engineer, and limitations. Untested interfaces must be marked “assessment required” and must not appear on the website as completed integrations.

<!-- source-block: b040 -->

<div class="page-break"></div>

<!-- source-block: b041 -->

<a id="chapter-05"></a>

## Chapter 05: Partnership responsibilities for delivery and commerce

<!-- source-block: b042 -->

The recommended model combines FastGPT platform capabilities, CNPS use-case implementation, and an agreed escalation path between the parties. International customers should know who answers requirements, quotes services, addresses platform defects, and maintains third-party interfaces. Partner status does not automatically grant territorial exclusivity, trademark modification rights, or unlimited resale rights.

<!-- source-block: b043 -->

| Work | Proposed CNPS responsibility | Proposed FastGPT responsibility | Customer responsibility |
| --- | --- | --- | --- |
| Discovery | Conduct English interviews and screen use cases | Support platform-fit assessment | Supply a process owner |
| License confirmation | Summarize deployment and business models | Confirm authorization scope and product quotation | Confirm purchasing entity and use |
| Pilot delivery | Prepare data, workflows, interfaces, and evaluation | Provide necessary platform support | Supply data and acceptance owner |
| Live operations | Monitor, train, and provide first-line response | Support platform defects and version upgrades | Approve accounts and business rules |
| Content marketing | Create English pages and local content | Verify case materials and brand use | Separately authorize customer testimonials |

<!-- source-block: b044 -->

Before selling, prepare a partnership operating guide covering lead registration, duplicate leads, quotation validity, cost allocation, channel protection, support boundaries, and escalation contacts. This report does not specify unagreed commissions or treat possible partnership arrangements as signed contracts.

<!-- source-block: b045 -->

CNPS can publicly explain its service scope and strengthen trust through real team information and contact details. If a buyer requests vendor endorsement, arrange a three-party discussion for the actual opportunity or supply partnership evidence that may be shared publicly. Do not create certification badges without FastGPT's confirmation.

<!-- source-block: b046 -->

### Opportunities and incidents need accountable owners

<!-- source-block: b047 -->

The CNPS project owner is accountable for service scope, communication, and delivery coordination. The customer's business owner is accountable for business acceptance, and customer IT approves production accounts and access. Platform defects follow the agreed technical escalation process; CNPS cannot promise FastGPT repair times on its behalf. Each task needs one final acceptance owner, although several people may participate.

<!-- source-block: b048 -->

Lead registration should include first-contact date, company domain, use case, source, and responsible party. Review duplicate leads manually rather than relying only on an individual's email address. Details of revenue sharing and territorial arrangements belong in controlled commercial documents; the public playbook describes only the customer service path.

<!-- source-block: b049 -->

<div class="page-break"></div>

<!-- source-block: b050 -->

<a id="chapter-06"></a>

## Chapter 06: Market selection and entry sequence

<!-- source-block: b051 -->

Initial market selection should maximize learning speed and delivery success. Start by testing Singapore and Southeast Asian regional headquarters reachable in English, plus international trading, manufacturing, and distribution companies accessible through existing relationships. Organic traffic experiments can run in parallel in the United States, United Kingdom, and Australia. Japan becomes a second growth path once a local-language implementation partner is available. This ranking is a resource assumption, not a conclusion about market share.

<!-- source-block: b052 -->

Score five dimensions: access through existing relationships, 30%; fit between pain points and current capabilities, 25%; language and time-zone coverage, 20%; procurement and data complexity, 15%; and payment potential, 10%. Score each from 1 to 5; for complexity, easier conditions receive a higher score. Replace subjective scores with evidence from 15 real company interviews.

<!-- source-block: b053 -->

| Market group | Initial hypothesis to test | Main entry activity | Expansion condition |
| --- | --- | --- | --- |
| English-speaking teams in Singapore/Southeast Asia | Small workflow pilots are easier to organize | Existing relationships and regional channels | Paid pilots and local support |
| Enterprise teams in the US, UK, and Australia | Specific use-case content attracts technical buyers | English search content and GitHub | Acceptable acquisition cost |
| Japan | Local training and channels reduce adoption friction | Japanese-language partners and joint training | Japanese acceptance and support can be delivered |
| European Union | Governance of private deployments matters in procurement | Focused industry content and security assessment | Data and contract reviews pass |

<!-- source-block: b054 -->

Begin with one region, two job roles, and three workflows. Every additional language increases documentation, support, evaluation, and legal communication costs. Geographic expansion without evidence spreads a limited team across more untested assumptions.

<!-- source-block: b055 -->

### Example ranking and conditions that would overturn it

<!-- source-block: b056 -->

Using the weights above, illustrative scores of 4/4/4/3/3 for English-speaking Southeast Asian teams yield 3.75. Scores of 2/4/3/3/5 for the US, UK, and Australia yield 3.15. Scores of 2/4/1/3/4 for Japan before securing a Japanese-language partner yield 2.65. These numbers demonstrate the decision method; they are not research findings. If CNPS's actual customer network is concentrated elsewhere, replace the relationship-access score and recalculate the ranking.

<!-- source-block: b057 -->

Organize the 15 interviews as 5 companies in each of three customer groups. Record the current workflow, monthly task volume, cost of errors, data readiness, purchasing roles, and desired outcome. Count demand evidence only when a buyer is willing to provide appropriately authorized samples and agree on a next step. A polite expression of interest does not qualify.

<!-- source-block: b058 -->

<div class="page-break"></div>

<!-- source-block: b059 -->

<a id="chapter-07"></a>

## Chapter 07: Three ideal customer groups and exclusion criteria

<!-- source-block: b060 -->

The first group consists of manufacturers and distributors of industrial equipment, parts, and specialist products. Knowledge is scattered across manuals, specification sheets, service records, and employee experience; technical sales and after-sales teams repeatedly search for it. Prioritize after-sales managers, technical support leads, and commercial operations managers. Use buyer language such as “technical documentation assistant” and “distributor knowledge base” in entry-point content.

<!-- source-block: b061 -->

The second group consists of B2B software, service, and training companies with repetitive inquiries. Support teams must answer common questions while handing uncertain or high-impact requests to people. Buyers care about resolution rates, handoff quality, error costs, and maintenance workload, not just time to the first token. Entry points include support triage and knowledge-grounded answers.

<!-- source-block: b062 -->

The third group consists of trading, distribution, and project-based service companies that frequently prepare quotations. Inputs may include emails, PDFs, spreadsheets, or incomplete materials requirements. A pilot should first extract requirement fields, flag missing information, and prepare response drafts. Authorized staff still approve pricing, lead times, substitutions, export conditions, and contractual commitments.

<!-- source-block: b063 -->

Shared qualification criteria are a business owner, lawfully usable materials, a recurring workflow, a comparable manual baseline, and willingness to validate with samples. Companies with 50 to 1,000 employees may be an initial interview grouping assumption, not a hard eligibility threshold.

<!-- source-block: b064 -->

Deprioritize requests for high accuracy without source materials, immediate unrestricted access to all data, delivery without an acceptance owner, automated high-impact decisions, or guaranteed sales. Narrow these opportunities or offer diagnostic consulting to avoid turning presales into unlimited free development.

<!-- source-block: b065 -->

### Finding the first target accounts

<!-- source-block: b066 -->

Build a list of 30 candidate companies from existing enterprise customers, public industry-association directories, partner referrals, and inbound inquiries. Record only public company information and lawfully obtained business contact details; do not harvest private email addresses. For each account, write a falsifiable hypothesis and identify its basis—for example, a company with many English technical manuals may need cross-document retrieval for its service team.

<!-- source-block: b067 -->

During qualification, ask how often the task occurs each week, who performs it, which errors are most expensive, who approves a pilot, which materials may be used, and who controls the expansion budget if the pilot succeeds. Do not infer buying capacity solely from employee count or country. Advance only as many accounts each week as the team can answer and serve on time.

<!-- source-block: b068 -->

<div class="page-break"></div>

<!-- source-block: b069 -->

<a id="chapter-08"></a>

## Chapter 08: Make services into purchasable offerings

<!-- source-block: b070 -->

Offer three levels: use-case diagnosis, a bounded pilot, and production implementation with ongoing service. Every project ultimately follows the parties' written statement of work (SOW). The website can describe deliverables and steps. Until an approved price list exists, use “Request a scoped proposal” rather than implying that a uniform price is already effective.

<!-- source-block: b071 -->

| Offering | Proposed scope | Specific deliverables | Exit condition |
| --- | --- | --- | --- |
| Use-case diagnosis | One workflow and a set of sample materials | Workflow map, risks, and pilot recommendation | Explain why if the use case is unsuitable |
| Paid pilot | One department, one use case, limited data | Demonstrable workflow, test results, and cost sheet | Discuss production only after criteria are met |
| Production implementation | Authorized systems and a defined user population | Deployment, interfaces, training, and operations guide | Acceptance and responsibility handover |
| Continuous improvement | Fixed monthly hours or agreed tickets | Knowledge updates, regression checks, and quality reviews | Periodic renewal assessment |

<!-- source-block: b072 -->

A standard pilot can be planned within a 2- to 4-week scheduling window once data, accounts, and approvals are ready. This is a planning assumption. Free POC offers or fastest-delivery claims on official case pages must not be copied into CNPS service guarantees.

<!-- source-block: b073 -->

Each level should state exclusions and separately priced items, including third-party licenses, model consumption, special networking, complex historical data cleaning, additional languages, and round-the-clock response. Use change orders for expansion, specifying added scope, acceptance, cost, and time, so that one pilot does not absorb unlimited work.

<!-- source-block: b074 -->

### Delivery boundaries for the three pilot packages

<!-- source-block: b075 -->

The knowledge Q&A package covers one document family, one business language, and one authorized user group, delivering answers with references and a no-answer path. The RFQ package covers one input template, a limited field set, and read-only product materials, delivering requirement summaries and missing items. The support package covers one FAQ set, one group of routing labels, and one human handoff method, delivering suggested replies and ticket drafts.

<!-- source-block: b076 -->

If data quality or interface conditions are unclear, diagnose before quoting. Reassess scope when a customer adds a second language, ERP write access, or high availability. The delivery clock starts when materials and access are ready; the schedule impact of customer data-preparation delays must be explicit.

<!-- source-block: b077 -->

### Definitions for the customer-value calculator

<!-- source-block: b078 -->

Monthly hours released = monthly task volume × net minutes saved per task × actual adoption share / 60. Net minutes must already deduct review and rework. Adoption includes only tasks that actually use the solution and meet quality requirements. Value of released time = hours released × fully loaded hourly labor cost. Monthly net value = value of released time - additional operations and model costs.

<!-- source-block: b079 -->

Example: 4,000 tasks, 6 net minutes saved per task, 30% adoption, and a $35 hourly rate yield 120 hours and $4,200 in time value. Subtract $800 in additional monthly costs to obtain $3,400. With a one-time investment of $12,000, simple payback is approximately 3.53 months. All inputs are assumptions. This excludes the time value of capital and does not imply equivalent headcount reductions or realized cash savings.

<!-- source-block: b080 -->

After launch, the customer should confirm whether released hours actually shift to valuable work. A website calculator only supports discussion of assumptions; its outputs must not be recorded as realized customer results.

<!-- source-block: b081 -->

<div class="page-break"></div>

<!-- source-block: b082 -->

<a id="chapter-09"></a>

## Chapter 09: The first eight case-center references

<!-- source-block: b083 -->

The following are concise adaptations of FastGPT's official cases. Outcomes are publisher-reported, not independently audited, and are not CNPS delivery results. They do not guarantee that another company will achieve the same outcome. Original sources are listed as C01-C08 in Chapter 28.

<!-- source-block: b084 -->

| Case | Core use case disclosed by the publisher | Starting point for international buyer evaluation |
| --- | --- | --- |
| Yanfeng iSAP | Operations knowledge linked to tickets; reports 70% automated handling of repetitive inquiries | Internal support Q&A and handoff |
| Shangluo Electronics | Part-number interpretation and structured database entry | RFQ field preparation for distributors |
| Yanfeng supplier recommendation | Candidate-supplier matching and risk flags | Assisted procurement shortlisting |
| OPPEIN Home | Call-information extraction and regional dispatch | Structured service inquiries |
| Zhaozhao medical exam training | Knowledge Q&A and human handoff; reports a 42% decrease in handoff rate | Routine inquiry triage |
| Shanghai Posts & Telecommunications Designing Consulting Institute | Policy permissions and project-data queries | Governance of departmental knowledge access |
| Yanfeng financial document review | Initial checks and exception review within BPM workflows | Assisted rules-based checks |
| Chang-Zhu-Tan logistics | Customer Q&A and internal information lookup | Logistics service knowledge support |

<!-- source-block: b085 -->

Prioritize the three references closest to target buyers' work on the homepage: iSAP, part-number processing, and support handoff. Place the others in a filterable library. Highly regulated scenarios should not be the default sales entry point, and the logistics reference does not imply recommendations to promote tobacco sales.

<!-- source-block: b086 -->

Each case card should contain one core fact, one source link, and one CNPS evaluation entry point. Label the proposed adaptation separately as a “CNPS pilot concept” so buyers can distinguish reference evidence from a solution that would be developed for them.

<!-- source-block: b087 -->

### Case admission rules

<!-- source-block: b088 -->

Record the case subject, original URL, publisher, last review date, adopted facts, source limitations, target role, and associated call to action (CTA). Prefer cases attributable to named customers. Label anonymous concepts, templates, and general industry ideas separately; do not mix them into customer results. Provide summaries with links to the full Chinese sources rather than mirroring the entire case collection.

<!-- source-block: b089 -->

Cards containing outcome figures should display “Reported by FastGPT.” Do not use customer logos without permission or translate a Chinese case as though it happened in the United States or Europe. If a source withdraws or changes a figure, or conflicting figures appear, remove the number first and review the affected pages and sales materials.

<!-- source-block: b090 -->

<div class="page-break"></div>

<!-- source-block: b091 -->

<a id="chapter-10"></a>

## Chapter 10: Adapt Chinese cases to international operations

<!-- source-block: b092 -->

Copying a case's interface or wording does not solve local deployment requirements. Transfer the workflow mechanisms: standardized inputs, knowledge retrieval, controlled outputs, exception handoff, and outcome feedback. Replace the original WeCom channels, domestic ERP systems, Chinese materials, and approval practices with the channels and controls the international customer actually uses.

<!-- source-block: b093 -->

For an iSAP-like scenario, CNPS's proposed pilot starts with a customer-authorized manual and FAQ set. Collect representative questions, show answer sources, and explicitly identify requests without supporting evidence. When handoff is needed, generate a ticket draft for staff approval before it enters the customer's chosen system. Microsoft Teams, Slack, Zendesk, and other interfaces require individual assessment; do not claim that ready-to-use connectors already exist.

<!-- source-block: b094 -->

For part-number processing, first establish the authoritative material-code source, units, and synonym list. Output original fields, normalized fields, source locations, and items requiring confirmation. The model must not invent unverified prices or stock levels. Match against read-only master data first, then let sales review the result before it enters the quotation system.

<!-- source-block: b095 -->

Acceptance should cover normal and failure scenarios: incomplete manuals, outdated terms, incorrect models, mixed languages, attachments containing malicious instructions, insufficient permissions, and API timeouts. International buyers need to see what happens when the system fails, not just a selection of favorable demonstrations.

<!-- source-block: b096 -->

### Localization checklist

<!-- source-block: b097 -->

| Dimension | Adaptation | Evidence |
| --- | --- | --- |
| Language | Preserve original model numbers, units, and industry abbreviations; build synonyms | Sample checks by bilingual business specialists |
| Channels | Replace original channels with customer-authorized entry points | Interface availability and authorization records |
| Commercial terms | State currency, taxes, time zones, and quotation validity separately | Customer-approved templates |
| Data | Confirm document sources, retention periods, and regions | Data-flow review |
| Working practices | Have actual employees perform trial tasks | Task observations and feedback forms |

<!-- source-block: b098 -->

Localization is complete when local employees can perform the specified task and know whom to contact when something goes wrong. Translated word counts, website language counts, and demonstration subtitles do not replace that standard.

<!-- source-block: b099 -->

<div class="page-break"></div>

<!-- source-block: b100 -->

<a id="chapter-11"></a>

## Chapter 11: Lessons from Dify's global approach

<!-- source-block: b101 -->

Dify's official GitHub provides English explanations, deployment entry points, and enterprise usage paths. Its partner program distinguishes resale, technical services, and ecosystem activities. This supports separating developer trials from enterprise services, but does not prove that CNPS can reproduce Dify's pricing or growth. [Repository](https://github.com/langgenius/dify); [partner program](https://dify.ai/partners).

<!-- source-block: b102 -->

A stronger cross-check comes from Japan's Kyoshin Group. Its announcement dated 2026-04-10 describes a new relationship with LangGenius involving Dify Enterprise and employee capability development. The announcement also circulated on X that day. It illustrates an adoption path combining local business organization, enterprise governance, and training. The announcement provides no contract value that this research could verify. [Kyoshin announcement](https://group.kyoshin.co.jp/news/741333/).

<!-- source-block: b103 -->

CNPS can adapt the following approach: help technical teams understand the product through reproducible English demonstrations, let local service partners explain it in industry language, and offer enterprise buyers pilot and training packages. Japan requires Japanese-language evaluation, support, and business materials; machine translation is only a starting point.

<!-- source-block: b104 -->

Do not use Dify user counts, funding, stars, or customer logos to prove FastGPT's strengths. Do not present Dify enterprise features or plugins as built-in FastGPT capabilities. Comparisons should use the same dataset, access requirements, budget, and acceptance conditions.

<!-- source-block: b105 -->

<div class="page-break"></div>

<!-- source-block: b106 -->

<a id="chapter-12"></a>

## Chapter 12: RAGFlow, LobeHub, Chatbox, and OpenManus

<!-- source-block: b107 -->

RAGFlow's official repository organizes its product narrative around document processing and retrieval, with multilingual README files and deployment materials. CNPS can learn to demonstrate parsing and retrieval quality on customers' difficult documents, making technical capability inspectable. Open-source attention cannot establish the scale of international paid adoption. [RAGFlow](https://github.com/infiniflow/ragflow).

<!-- source-block: b108 -->

The LobeChat repository now redirects to LobeHub. This report uses the current official address instead of treating the old name as the product's current positioning. Its public project demonstrates the importance of English entry points and product experience. Chatbox provides access across desktop platforms. CNPS can borrow designs that reduce friction in the first experience, while avoiding equating individual-tool adoption with enterprise procurement. [LobeHub](https://github.com/lobehub/lobehub); [Chatbox](https://github.com/chatboxai/chatbox).

<!-- source-block: b109 -->

OpenManus provides multilingual explanations, code, and demonstrations, making it a useful reference for reproducible open-source work and community collaboration. It is not the same commercial entity as Manus. The repository name does not grant Manus authorization, and it provides no enterprise order results that this research could verify. [OpenManus](https://github.com/FoundationAgents/OpenManus).

<!-- source-block: b110 -->

The four lessons concern quality evidence, usability, accessible distribution, and reproducible collaboration. CNPS should deliver a runnable or reviewable use-case example with a clear implementation-service entry point. The commercial proposition is knowing how to measure, deliver, and maintain a workflow, rather than merely offering another popular agent.

<!-- source-block: b111 -->

<div class="page-break"></div>

<!-- source-block: b112 -->

<a id="chapter-13"></a>

## Chapter 13: Verifiable observations from X and their limits

<!-- source-block: b113 -->

The posts below were found through public search indexes; some direct pages returned no body text. Only visible content is summarized. Reposts, views, and follower counts are not treated as commercial outcomes. Links are listed under X01-X05.

<!-- source-block: b114 -->

| Date and author | Visible observation | Lesson for CNPS | Evidence boundary |
| --- | --- | --- | --- |
| 2024-09-05 Luyu Zhang | Shared news that Dify was selected for a TechCrunch event | Use international events to support public demonstrations | Not evidence of orders |
| 2025-01-07 Tom | Explained practical use of conversation variables in Japanese | Build a tutorial around one operational question | Excludes rhetoric such as “100 times” |
| 2025-03-15 まつにぃ | Discussed a Markdown document-export plugin | Connect outputs to real office formats | Verify capability in the repository |
| 2026-01-29 Canopy Wave | Announced a Dify model-marketplace plugin | Integration partnerships can be distribution channels | The author's own statement |
| 2026-04-10 digitalpr_jp | Shared the Kyoshin–LangGenius partnership | Local business references are more concrete than generic promotion | Cross-checked against the company announcement |

<!-- source-block: b115 -->

The Markdown Exporter repository exists. This supports the observation that a component solving a real office task can circulate across language communities. It does not prove that FastGPT can import Dify plugins directly. [Plugin repository](https://github.com/bowenliang123/markdown-exporter).

<!-- source-block: b116 -->

Recommended X content focuses on short demonstrations, failure examples, evaluation methods, and real integration work. Each post should solve one problem and link to the relevant use-case page. Do not impersonate customers, purchase fake engagement, or mass-message strangers. The current delivery prepares content and the website; it does not mean posts have been published on X.

<!-- source-block: b117 -->

### The evidence chain from observation to experiment

<!-- source-block: b118 -->

The office-export discussion in X03 and repository S12 jointly support that a component exists and is discussed by users in different languages. X05 and S07 confirm that a Japanese business partnership was announced. X01 supports only public event distribution, X02 only the tutorial topic, and X04 only an author's integration announcement. These five samples cannot estimate the success rate of Chinese AI expansion, and their selection is subject to survivorship bias.

<!-- source-block: b119 -->

CNPS's next experiments should separately measure whether tutorials generate technical inquiries, use-case demonstrations generate diagnostic meetings, and partner events generate qualified companies. Assign a distinct source code to each content item and ask buyers how they found CNPS during the first sales conversation. Do not attribute all influence to the last click.

<!-- source-block: b120 -->

<div class="page-break"></div>

<!-- source-block: b121 -->

<a id="chapter-14"></a>

## Chapter 14: How GitHub can generate qualified inquiries

<!-- source-block: b122 -->

GitHub should establish technical trust for CNPS. Build a public use-case example repository instead of copying all of FastGPT to imply ownership of the product. Clearly state that the examples are based on FastGPT, link the upstream license, and assign an appropriate separate license to CNPS-owned examples.

<!-- source-block: b123 -->

Include an English README, synthetic samples, input/output examples, evaluation sets, version inventory, configuration templates, failure examples, deployment instructions, and security notes. The first README screen should answer which task is solved, how to reproduce a minimal result, and when enterprise implementation help is useful. Add a CNPS entry point with UTM attribution near the end.

<!-- source-block: b124 -->

| Example | Initial assets | Expected first-run result |
| --- | --- | --- |
| Technical support | Synthetic product manuals and Q&A set | Answers with sources and refusal examples |
| RFQ intake | Synthetic inquiries and field definitions | Structured fields and missing information |
| Support handoff | Synthetic inquiries and routing rules | Ticket drafts ready for human confirmation |

<!-- source-block: b125 -->

Do not promise untested one-click imports. When providing specific FastGPT workflow JSON, record the exact version and test import in a clean environment. Assets that have not passed this check must be called design examples. Issue templates should exclude credentials and customer information while eliciting genuine product problems.

<!-- source-block: b126 -->

Upstream contributions should focus on documentation fixes, reproductions, and better tests. Do not place advertisements in unrelated issues or harvest developer emails for bulk outreach. GitHub restricts spam and fake engagement; see policy P03 in Chapter 28.

<!-- source-block: b127 -->

### Example-repository acceptance and conversion

<!-- source-block: b128 -->

The proposed structure is examples/, datasets/synthetic/, evaluation/, docs/, SECURITY.md, LICENSE, and .env.example. Environment examples contain only variable names and safe placeholders, never real credentials. Each release should record upstream version, compatibility, passed sample count, failures, and maintenance owner.

<!-- source-block: b129 -->

Example README service message: “Need help adapting this workflow to your company documents and systems? Discuss a scoped pilot with CNPS.” Use utm_source=github, utm_medium=repository, and utm_campaign=fastgpt-pilot in the link. Measure qualified business conversations and example-reproduction issues rather than star growth.

<!-- source-block: b130 -->

The current deliverables are publishing materials and evaluation specifications. A public workflow-example repository has not yet been published, and no claim is made that import into a real FastGPT environment or model evaluation has been completed. This work is an engineering gate for days 15-30 of the ninety-day plan.

<!-- source-block: b131 -->

<div class="page-break"></div>

<!-- source-block: b132 -->

<a id="chapter-15"></a>

## Chapter 15: Information architecture for the CNPS website

<!-- source-block: b133 -->

Add an English-first enterprise entry point whose main purpose is to turn business interest into actionable inquiries. The main site already contains hardware and shop content. Name the FastGPT path clearly and link it from the homepage so enterprise buyers do not assume CNPS only sells recording hardware.

<!-- source-block: b134 -->

| Page | Purpose | Primary CTA |
| --- | --- | --- |
| /fastgpt/ | Explain the partnership and implementation use cases | Discuss your workflow |
| /fastgpt/cases/ | Browse references with sources | Scope a similar pilot |
| /fastgpt/solutions/…/ | Explain a specific task | Request a scoped proposal |
| /fastgpt/contact/ | Structure requirements and contact CNPS | Prepare inquiry email |
| /resources/fastgpt-cnps-global-growth/ | Read and download the playbook | Download Markdown |

<!-- source-block: b135 -->

Use “FastGPT implementation with CNPS” to explain the role on English pages. Link vendor information to official pages, but direct every commercial CTA to the CNPS inquiry entry point. Source links enable verification; they should not replace the CNPS sales contact.

<!-- source-block: b136 -->

A minimum viable publication requires readable content, sources, contact details, applicable use cases, and a next step. Pages must be readable on phones, tables horizontally scrollable, and controls operable by keyboard. Downloads must not be blocked by a nonfunctional form; public reports should be directly accessible.

<!-- source-block: b137 -->

### This content delivery and subsequent business implementation

<!-- source-block: b138 -->

The initial delivery includes 14 FastGPT specialist pages: 1 landing page, 1 case index, 8 case details, 3 use-case solutions, and 1 inquiry page. It also includes an online report, Markdown, A4 PDF, complete revision records, and an English buyer guide. International buyers can directly download the [buyer guide](https://www.cnps.ai/resources/fastgpt-buyer-guide-en.md).

<!-- source-block: b139 -->

Website publication establishes content and acquisition entry points. It does not mean customer FastGPT instances have been deployed, platform pilots completed, X posts sent, automatic CRM intake enabled, or orders won. Customer implementation and channel operations follow the ninety-day plan. Because the original live-site source came from another deployment, the main-site task in the shared directory coordinated the initial combined publication. Legacy routes depend on the original deployment; the full legacy source should subsequently be brought into the same maintenance process.

<!-- source-block: b140 -->

<div class="page-break"></div>

<!-- source-block: b141 -->

<a id="chapter-16"></a>

## Chapter 16: English messaging for international customers

<!-- source-block: b142 -->

Recommended headline: **Put your business knowledge to work.** Supporting copy: **CNPS works with FastGPT to help teams plan and implement knowledge assistants, support workflows and RFQ intake. Start with one workflow and an agreed way to measure it.**

<!-- source-block: b143 -->

This language puts a recognizable task before technology names while explaining partnership and implementation roles. Avoid unsubstantiated claims such as zero hallucinations, guaranteed compliance, world's best, or guaranteed order growth.

<!-- source-block: b144 -->

The three use-case headlines are “Find answers in technical documents,” “Route support requests with context,” and “Turn RFQs into reviewable briefs.” Each should explain what the buyer supplies, what output to expect, and which decisions remain with people.

<!-- source-block: b145 -->

Use the consistent case label “FastGPT-published reference.” Add: “CNPS did not independently audit these results. Your pilot will use your own baseline and acceptance criteria.” Place this evidence-attribution statement where it helps the reader, without crowding the page with lengthy internal procedures.

<!-- source-block: b146 -->

The FAQ should directly address whether customers must change their existing model, whether deployment in their environment can be assessed, what materials a pilot needs, whether third-party costs are included, whether the cases are CNPS customers, and how to obtain a written quotation. Do not answer “supported” for every untested model, system, or region.

<!-- source-block: b147 -->

<div class="page-break"></div>

<!-- source-block: b148 -->

<a id="chapter-17"></a>

## Chapter 17: Search and AI retrieval entry points

<!-- source-block: b149 -->

Organize search content around buyer tasks and deployment conditions. Initial topics may include FastGPT implementation partner, enterprise knowledge assistant, technical documentation AI, RFQ automation pilot, and self-hosted knowledge base implementation. These keywords are content experiments; search-volume and bid data were not obtained.

<!-- source-block: b150 -->

Each use-case page should cover a specific problem, inputs and outputs, responsibility boundaries, data preparation, evaluation, related cases, and contact options. Mechanically translating one Chinese article into dozens of country pages increases maintenance and duplication without necessarily increasing trust.

<!-- source-block: b151 -->

Technical requirements include crawlable HTML, unique titles and descriptions, canonical links, a sitemap, internal body links, appropriate language attributes, and accurate structured data. Use only organization or service information actually displayed on the page. Do not fabricate ratings, reviews, or product Offers without a pricing basis. [Google Search Essentials](https://developers.google.com/search/docs/essentials).

<!-- source-block: b152 -->

Content suitable for AI retrieval has clear definitions, traceable sources, independently understandable paragraphs, and visible publication dates. Markdown and a concise llms.txt can be provided, but no search engine or AI can be promised to index, recommend, or rank the site higher. Validate actual indexing and inquiry data after submitting the sitemap.

<!-- source-block: b153 -->

### Initial search topics and page mapping

<!-- source-block: b154 -->

| Buyer search intent | Page topic | Specific question to answer |
| --- | --- | --- |
| FastGPT implementation partner | Partnership and implementation entry point | Who owns delivery and support? |
| AI for technical documentation | Technical-document use case | How are references and versions verified? |
| RFQ intake automation | RFQ use case | How are missing fields and human review handled? |
| support ticket triage AI | Support use case | Which requests must go to a person? |
| private AI knowledge base | Deployment and procurement guidance | Which data passes through external services? |

<!-- source-block: b155 -->

Avoid unsupported “best” or “cheapest” comparisons. Review impressions, clicks, landing pages, and inquiry quality monthly. Fix concrete issues such as uncrawlable pages, 404s, and broken CTAs first. Publish separate language editions only when content, support, and hreflang pairing are ready.

<!-- source-block: b156 -->

<div class="page-break"></div>

<!-- source-block: b157 -->

<a id="chapter-18"></a>

## Chapter 18: Content distribution and the first four weeks

<!-- source-block: b158 -->

A strong asset can support several useful formats: a website article explains the workflow, a GitHub example supports reproduction, an X post demonstrates one result, and sales materials support procurement evaluation. All channels should point to the same use case and verifiable commitment, reducing contradictions across maintained versions.

<!-- source-block: b159 -->

| Week | Main asset | X content | GitHub content | Sales reuse |
| --- | --- | --- | --- | --- |
| 1 | Technical-document Q&A evaluation guide | Answers with and without sources | Synthetic Q&A dataset | Diagnostic interview questions |
| 2 | RFQ field-processing workflow | How a missing model number is flagged | Field schema and examples | Pilot scope sheet |
| 3 | Ticket handoff design | When a person must take over | Routing decisions and failure examples | Demonstration for support owners |
| 4 | Pilot evaluation report structure | Measurement methods and limitations | Regression-test guidance | Management review page |

<!-- source-block: b160 -->

An initial cadence could be 3 original X posts, 1 practical website article, and 1 example update per week. This is a team-capacity assumption. Every item should contain a real example or specific knowledge; reduce frequency rather than publishing empty daily updates.

<!-- source-block: b161 -->

Joint events should focus on one task, such as “From a parts inquiry to a reviewable RFQ brief.” Registration must not automatically subscribe attendees to marketing. Use synthetic or authorized demonstration data. Sales-conversation screenshots cannot become case studies without customer permission.

<!-- source-block: b162 -->

### Initial English drafts for X

<!-- source-block: b163 -->

**Technical documents:** A useful knowledge assistant should show where an answer came from—and say when the documents do not contain it. Our FastGPT pilot approach starts with your workflow, an agreed test set and human review. Explore the approach at cnps.ai/fastgpt/.

<!-- source-block: b164 -->

**RFQ intake:** An RFQ arrives with a missing part number and an unclear quantity. The useful AI output is a structured brief with the gaps flagged. Pricing and delivery commitments stay with your sales team. See the CNPS FastGPT pilot approach.

<!-- source-block: b165 -->

**Support:** A fast answer is only useful if it is right. For a support pilot, measure answer quality, appropriate handoff, review time and cost together. CNPS helps scope that evaluation around one workflow.

<!-- source-block: b166 -->

These are unpublished drafts. Before posting, shorten them to the platform's current limits and add the relevant use-case link. Pair each with a verifiable synthetic example or an authorized demonstration; do not invent customer outcomes. Sales emails are for responding to inbound inquiries or existing lawful contacts, not automated mass outreach.

<!-- source-block: b167 -->

<div class="page-break"></div>

<!-- source-block: b168 -->

<a id="chapter-19"></a>

## Chapter 19: Inquiry handling and CRM design

<!-- source-block: b169 -->

The main site already publicly uses sales@cnps.ai. An initial requirement builder can prepare an email draft for the visitor to send. It must not show “submitted successfully” or imply that a lead has been stored by a backend. A server form may display success only after reliable intake is in place.

<!-- source-block: b170 -->

Recommended CRM fields are company, contact, work email, country/time zone, source, use case, existing systems, data-readiness status, intended start, budget range, owner, next step, and expected date. Marketing forms must not collect production customer data or secrets.

<!-- source-block: b171 -->

Suggested scoring: use-case fit, 25 points; usable materials, 20; business owner, 20; timing, 15; budget path, 10; technical deliverability, 10. A score of 70 may trigger SQL review. The score is an internal prioritization tool and must not automatically determine whether a customer deserves service.

<!-- source-block: b172 -->

Proposed attribution events are case_view, proposal_intent, brief_prepared, email_open_requested, inquiry_received, sql_accepted, pilot_signed, and cash_received. The first four are browser actions; the last four require confirmation from intake systems or sales. Current pages carry only limited UTM parameters into the draft. No analytics service is deployed, and contact details are not sent to third-party analytics tools.

<!-- source-block: b173 -->

Example conventions: utm_source=x/github/partner, utm_medium=organic/repository/referral, utm_campaign=fastgpt-pilot, and utm_content=technical-docs-demo. Source parameters must not contain email addresses, business secrets, or free text. Record first source, self-reported source, and last touch for each real opportunity, and periodically compare them.

<!-- source-block: b174 -->

The page stores these limited source codes for the current browser session so attribution survives navigation from a use-case page to the inquiry page. Names, emails, and requirements are not placed in session storage. The requirement form cannot submit with JavaScript disabled, while the direct email link remains usable. If clipboard access is blocked or no mail application exists, visitors can manually copy or download the draft. The page never claims that an email has already been sent.

<!-- source-block: b175 -->

Aim for a human first response within one business day on working days; any public promise must reflect actual staffing. The first reply should restate the customer's problem, identify two or three key gaps, and agree on the next step. Give an expected response time for complex questions. Automated email must not create the impression that sales has already handled the request.

<!-- source-block: b176 -->

Distinguish at least these loss reasons: no budget, poor timing, insufficient materials, licensing limits, feature mismatch, failed procurement review, and a competing solution. Review them weekly to determine whether the issue is traffic, offering scope, or delivery capability.

<!-- source-block: b177 -->

### What the inquiry entry point actually does

<!-- source-block: b178 -->

The website version uses a browser-based requirement builder. After entering company, email, region, use case, and requirements, a visitor can generate copyable, downloadable English inquiry text and choose to open a draft addressed to sales@cnps.ai. Generating a draft does not mean CNPS has received an email; the visitor must still send it from their email application. The page also retains a directly clickable sales email and the existing contact page.

<!-- source-block: b179 -->

Before enabling a server-side form, verify the recipient address, persistent storage, spam filtering, failure retries, human follow-up, and actual receipt. Show success only after the server confirms acceptance. Record email delivery and sales reading separately so leads do not disappear between automation steps.

<!-- source-block: b180 -->

<div class="page-break"></div>

<!-- source-block: b181 -->

<a id="chapter-20"></a>

## Chapter 20: From a diagnostic meeting to an order

<!-- source-block: b182 -->

A diagnostic meeting can take 30 minutes: 5 to establish the task and owner, 10 to review the current workflow, 10 to understand materials and constraints, and 5 to decide whether to evaluate samples. Follow up with one page covering the problem, scope, data, acceptance, and next step, rather than sending an irrelevant, lengthy product manual first.

<!-- source-block: b183 -->

Demonstrations should show normal, exceptional, and failure samples from the customer's workflow, identifying synthetic examples. Compare time, quality, and cost against the customer's manual baseline. If that baseline is unavailable, label it as unmeasured. High inquiry volume does not establish sales readiness; the ability to organize evaluation and budget is critical.

<!-- source-block: b184 -->

The SOW should identify the implementing entity, business purpose, user and data scope, deliverables, acceptance set, fees, scheduling prerequisites, third-party dependencies, change process, intellectual property, data handling, termination, and handover. Authorized representatives of both parties must confirm the terms. This report provides a structure, not legal advice.

<!-- source-block: b185 -->

Milestone payments are recommended, with amounts and proportions confirmed in the formal quotation. Even when a customer asks for an initial demonstration, distinguish free diagnosis from a pilot that incurs costs. Sales should commit to agreed measurement, delivery, and remediation rather than guaranteeing efficiency gains simply from purchase.

<!-- source-block: b186 -->

Propose expansion only for use cases that meet acceptance criteria. Additional users, materials, interfaces, or languages require explicit incremental costs and regression scope. If criteria are not met, explain the failures and recommendations instead of changing the metrics to present success.

<!-- source-block: b187 -->

<div class="page-break"></div>

<!-- source-block: b188 -->

<a id="chapter-21"></a>

## Chapter 21: Pilot design and acceptance criteria

<!-- source-block: b189 -->

A pilot should cover one workflow, one department, and a defined set of materials. Freeze the evaluation set before starting, including answerable requests, clarification needs, required refusals, mandatory human handoffs, and unauthorized-access requests. Production still requires further ongoing validation. Passing a small sample supports only the next decision within that scope.

<!-- source-block: b190 -->

| Dimension | Suggested measurement | Proposed acceptance direction |
| --- | --- | --- |
| Correctness | Business experts blindly assess answers against source text | Meet the threshold agreed by both parties |
| Evidence | Check whether citations support main conclusions | Key conclusions can be traced back |
| Permissions | Test cross-department and unauthorized accounts | No unauthorized disclosure in the test set |
| Human review | Test missing-data, high-impact, and exceptional samples | Correct handoff to a person |
| Time | Compare human and assisted work on the same workload | Improvement after including review time |
| Cost | Record model, infrastructure, and maintenance costs | Remain within the agreed usage budget |

<!-- source-block: b191 -->

Do not compare only the seconds needed to generate AI output with the entire duration of human work. Include document preparation, corrections, human review, and exception handling in effective cost. Retain unresolved items and record data version, model version, FastGPT version, prompts, and run date.

<!-- source-block: b192 -->

Closing deliverables should include a demonstrable workflow, reviewable evaluation sheet, cost assumptions, known limitations, pre-production actions, and handover training. Business, security, and technical owners each confirm their areas of responsibility.

<!-- source-block: b193 -->

### Draft first-round acceptance set and thresholds

<!-- source-block: b194 -->

Begin with 120 samples: 60 answerable questions, 20 requiring clarification, 15 requiring refusal because evidence is absent, 15 permission tests, and 10 tool failures. Hold back another 30 blind-test samples that are never used for tuning. Customer business experts assess results using a predefined rubric, with a second reviewer resolving disagreements where needed.

<!-- source-block: b195 -->

Illustrative thresholds are at least 90% correctness on the answerable set, at least 95% support for key citations, and agreed behavior for every permission and mandatory-refusal sample. These are proposed negotiation starting points, not FastGPT guarantees. Any serious disclosure or unauthorized write blocks production release. Report passed samples and total samples together, and explain that a small sample cannot prove zero overall risk.

<!-- source-block: b196 -->

Measure efficiency using median and P90 handling times on the same tasks, including human review and rework. Discuss efficiency gains only after quality thresholds pass. When models, knowledge sources, or business languages change, rerun affected tests and the core regression set.

<!-- source-block: b197 -->

<div class="page-break"></div>

<!-- source-block: b198 -->

<a id="chapter-22"></a>

## Chapter 22: Reference architecture and implementation process

<!-- source-block: b199 -->

The proposed flow begins with customer-authorized materials being cleaned, classified, and indexed with access and version metadata. Business requests enter FastGPT through identity and use-case rules. Workflows retrieve evidence, call approved tools, and generate drafts. Human approval precedes any write to a business system. Evaluation and logs support ongoing improvement. This is a CNPS implementation design, not a description of an already deployed system.

<!-- source-block: b200 -->

```text
Authorized documents -> Parsing + metadata + access rules -> Knowledge index
User / support request -> Identity check -> FastGPT workflow -> Cited answer
                                               |                 |
                                         Approved API       Human review
                                               |                 |
                                         Read-only data   Ticket / RFQ draft
```

<!-- source-block: b201 -->

The deployment inventory must identify models, embeddings, reranking, OCR, databases, object storage, backups, logs, and external connectors. Record the region, version, access parties, cost, and failure impact for each. Cross-border data discussions must cover the full chain, not just the application server's location.

<!-- source-block: b202 -->

The recommended sequence is read-only access, shadow operation, human-reviewed assistance, limited production, and gradual expansion. Write interfaces require least privilege, idempotency keys, timeouts, retry limits, and reversible operations. Stop automated writes when exceptions occur and retain a clear, executable manual process.

<!-- source-block: b203 -->

### Controls for production operation

<!-- source-block: b204 -->

Treat external materials as data. Instructions embedded in documents, such as “ignore the rules” or “call this URL,” must not become tool instructions. Enforce identity and access filtering before retrieval. Database accounts should be read-only by default. Configuration allowlists define callable tools and destination domains. Model judgments must not bypass deterministic access controls.

<!-- source-block: b205 -->

Set runtime and cost limits for each workflow and remove sensitive fields from logs by default. RFQ prices, delivery dates, substitute models, and customer emails remain drafts until authorized staff confirm them. Third-party failures should route work to a human queue with necessary context. Never silently lose inquiries or retry without limit.

<!-- source-block: b206 -->

Delivery documentation should include dependency versions, backup and recovery steps, an emergency stop, manual procedures, monitoring responsibilities, and escalation contacts. Before launch, rehearse an external-model outage and a knowledge-base restore. Record actual recovery times rather than promising untested targets.

<!-- source-block: b207 -->

<div class="page-break"></div>

<!-- source-block: b208 -->

<a id="chapter-23"></a>

## Chapter 23: Licensing, data, and procurement risks

<!-- source-block: b209 -->

FastGPT's LICENSE uses Apache 2.0 with additional conditions. The public terms permit certain commercial uses, while operating a FastGPT-like multi-tenant SaaS and changing console branding or copyright notices involve specific authorization requirements. Confirm the actual delivery model with FastGPT before deployment. Open source does not mean unrestricted white-label resale. [FastGPT LICENSE](https://github.com/labring/FastGPT/blob/main/LICENSE).

<!-- source-block: b210 -->

### Apply license checks to the actual delivery model

<!-- source-block: b211 -->

| Proposed delivery model | What to verify | Wording in sales documents |
| --- | --- | --- |
| Internal platform for one customer enterprise | Version, enterprise features, and support terms | List platform licensing and implementation separately |
| Backend service for a CNPS application | Fit with upstream definitions and actual functionality | Describe how end users use the application |
| Similar multi-tenant SaaS platform | Explicit written authorization from FastGPT | Do not sell this model before confirmation |
| Changes to console branding or copyright | Relevant commercial and brand permissions | Do not imply white-label rights by default |

<!-- source-block: b212 -->

This is a procurement-check framework based on the public license. It does not replace the parties' agreements or professional legal review. Partnership certificates, code licenses, republication of customer cases, and customer-logo use are separate permissions that require separate management.

<!-- source-block: b213 -->

Enterprise procurement should confirm processing entities, data categories, processing locations, subprocessors, access rights, retention, deletion, and incident-notification mechanisms. EU projects require individual assessment of GDPR and applicable AI Act duties. Applicability dates and system classification depend on current law and professional review. Private deployment alone does not establish compliance. [Official EU AI Act overview](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai).

<!-- source-block: b214 -->

Do not put unverified SOC 2, ISO 27001, HIPAA, zero cross-border data-transfer, or round-the-clock SLA claims on CNPS pages. Present actual control designs that can be explained and reviewed during procurement. Permission features described in a source case do not certify a current CNPS system.

<!-- source-block: b215 -->

### Minimum data and procurement materials

<!-- source-block: b216 -->

An initial inquiry needs only business contact information and a workflow description. Do not collect real customer records, sensitive personal data, passwords, or production data through public forms or demonstration tools. Once a pilot begins, exchange samples using the agreed transfer method, access rights, and retention period. Marketing subscription requires a separate choice; an inquiry is not consent to indefinite subscription.

<!-- source-block: b217 -->

The procurement pack should contain the actual company entity, service contact, subcontractor and platform roles, data flows, control explanations, SOW, support scope, and exit process. Deletion requests must address the application, logs, indexes, and backup-retention rules, including obligations that affect deletion timing. The parties should review data-protection terms for the relevant region and business; this public playbook cannot replace those terms.

<!-- source-block: b218 -->

Security priorities include prompt injection in attachments, unauthorized tool calls, cross-tenant disclosure, sensitive logs, supply-chain plugins, and outdated versions. Review upstream security notices regularly and plan updates. Passing one demonstration does not establish long-term security. [Official security page](https://github.com/labring/FastGPT/security).

<!-- source-block: b219 -->

<div class="page-break"></div>

<!-- source-block: b220 -->

<a id="chapter-24"></a>

## Chapter 24: Budget, unit economics, and sensitivity

<!-- source-block: b221 -->

The figures below are for planning experiments and do not represent either party's current prices. Work backward from affordable sales and delivery capacity to set a budget, then revise it using actual data. Website publication must not be treated as revenue already generated.

<!-- source-block: b222 -->

An illustrative 90-day experiment budget is $18,000: $3,000 for content and localization, $5,000 for examples and pilot assets, $4,000 for sales and channel operations, $2,000 for security and contract preparation, $2,000 for small distribution experiments, and $2,000 contingency. It includes cash and estimated internal labor value. Actual spending needs separate approval; this report authorizes no advertising or purchasing.

<!-- source-block: b223 -->

The base-case funnel is 3,000 target visits × 2% valid inquiry rate × 40% SQL rate × 25% pilot win rate, producing 6 pilots. If 50% expand, this implies 3 subsequent projects. Every conversion rate is an assumption. With longer sales cycles, expansion payments may arrive after the 90-day period.

<!-- source-block: b224 -->

An illustrative pilot fee of $3,000 with $1,800 direct delivery cost contributes $1,200. An illustrative implementation fee of $12,000 with $7,200 direct cost contributes $4,800. Whether model costs and platform licensing are included must be separately agreed. Under these assumptions, 6 pilots and 3 implementations contribute $21,600 before acquisition and fixed costs not already included. This is not net profit.

<!-- source-block: b225 -->

### Avoid counting costs twice

<!-- source-block: b226 -->

The $18,000 experiment budget covers only reusable assets, acquisition, and project preparation; it excludes direct delivery hours for specific paying customer projects. Split the actual hours of staff who perform both activities. Count each license, development hour, or model charge only once. Base-case revenue is $54,000, direct cost $32,400, and contribution $21,600. Deducting the full experiment budget leaves $3,600 before tax, financing, and other overheads, with no guarantee that all payment is collected within 90 days.

<!-- source-block: b227 -->

| Scenario | Visits / inquiry rate / SQL rate / pilot win rate | Expected pilots | At 50% expansion |
| --- | --- | --- | --- |
| Low | 1,000 / 1% / 25% / 20% | 0.5 | 0.25 |
| Base | 3,000 / 2% / 40% / 25% | 6 | 3 |
| High | 5,000 / 3% / 50% / 30% | 22.5 | 11.25 |

<!-- source-block: b228 -->

Fractions are probabilistic expected values; actual contracts are whole numbers. The high scenario may substantially exceed an early team's capacity. Set a cap on concurrent pilots for each two-week period and queue excess work. Do not count potential leads directly as revenue. In the base funnel, one combination yielding an expansion contributes 2×1,200+4,800=7,200. Covering the $18,000 experiment budget requires about 2.5 such combinations, hence at least 3, provided the cost assumptions hold.

<!-- source-block: b229 -->

Also measure cash payback time, scope creep, rework rate, and support hours. If pricing capability is weak, raise the minimum engagement scope or narrow the use case rather than accepting large volumes of unsustainable customization at low prices.

<!-- source-block: b230 -->

<div class="page-break"></div>

<!-- source-block: b231 -->

<a id="chapter-25"></a>

## Chapter 25: Ninety-day execution and accountable roles

<!-- source-block: b232 -->

Day 1 is the actual project start date, not the date this material was published. CNPS must assign real people to the roles below. Where names are unavailable, use role titles without inventing team size or capability.

<!-- source-block: b233 -->

| Period | Owner | Required deliverables | Release condition |
| --- | --- | --- | --- |
| Days 1-14 | Project owner + content owner | Partnership boundaries, English pages, case sources, inquiry process | Working contact entry point and verifiable claims |
| Days 15-30 | Presales + engineering owner | Interviews, synthetic examples, three use-case demonstrations | At least one use case can be evaluated end to end |
| Days 31-60 | Sales + delivery owner | Bounded pilots and weekly reviews | Complete acceptance, time, and customer-feedback records |
| Days 61-90 | Project owner + partnership team | Expansion proposals, channel training materials, economic review | Collected payment or a clear reason to pause |

<!-- source-block: b234 -->

Weekly meetings should address four questions: What customer evidence did we obtain? Which assumptions were overturned? Who will complete the next action, and when? Should any investment stop? Page counts and social activity cannot replace these questions.

<!-- source-block: b235 -->

Phase one is complete when website entry points and sales processes work. Phase two requires reproducible examples; phase three requires customer acceptance; only phase four establishes a repeatable service offering. Even without expansion orders, record discovered demand or delivery constraints honestly. Completed activities do not equal commercial success.

<!-- source-block: b236 -->

### Release gates that dates cannot replace

<!-- source-block: b237 -->

| Gate | Approving role | Required evidence |
| --- | --- | --- |
| Ready to sell | CNPS commercial owner | Offered services match platform authorization |
| Ready to receive inquiries | Sales operations owner | Working contact path, intake owner, and follow-up process |
| Ready to pilot | Delivery owner | Data permissions, samples, scope, and acceptance owner |
| Ready for production | Customer IT and business owners | Quality, access, recovery, and human-review checks pass |
| Ready to scale | Project owner | Affordable collection cycle, margin, and support load |

<!-- source-block: b238 -->

Assign a real name and backup for every role before starting; this report does not appoint staff for CNPS. One person may hold several first-month sales roles, but every action still needs a unique owner and deadline. A project that has not passed its production gate cannot go live merely because day 60 has arrived.

<!-- source-block: b239 -->

<div class="page-break"></div>

<!-- source-block: b240 -->

<a id="chapter-26"></a>

## Chapter 26: Risks, experiments, and stop conditions

<!-- source-block: b241 -->

| Risk | Early signal | Response |
| --- | --- | --- |
| Visitors are a poor fit | Many downloads, few business conversations | Change use-case headlines and channels |
| Interest without budget | Many demonstrations, nobody advancing procurement | Tighten diagnostic qualification |
| Poor data quality | Errors concentrated in scans and old versions | Offer data preparation first |
| Uncontrolled pilot scope | New interfaces and languages added weekly | Use change orders |
| Unclear licensing | Customer requests white-label SaaS | Verify authorization before quoting |
| Excessive support load | One project occupies engineers for extended periods | Define service packages and escalation paths |

<!-- source-block: b242 -->

Experiment A compares platform-feature headlines with single-workflow outcome headlines, judging valid inquiry rate rather than click-through rate. Experiment B compares sourced cases with workflow demonstrations, measuring progression to diagnostic meetings. Experiment C compares a generic form with a requirement builder, assessing information completeness and human handling cost.

<!-- source-block: b243 -->

Small samples support directional judgments only, not claims of statistical significance. A few conversations cannot represent an entire country's demand. Record visitor source, business role, problem, and next step so differences in channel quality are not mixed together.

<!-- source-block: b244 -->

After 15 target-customer interviews, review whether recurring problems exist. After 3 pilots with explicit acceptance criteria, review whether a standard service can be formed. Pause scaling and adjust the entry point if demand does not repeat, delivery consistently exceeds budget, or compliance prerequisites cannot be met.

<!-- source-block: b245 -->

<div class="page-break"></div>

<!-- source-block: b246 -->

<a id="chapter-27"></a>

## Chapter 27: Ready-to-use English templates and procurement FAQ

<!-- source-block: b247 -->

**Inbound reply draft**

<!-- source-block: b248 -->

Thank you for describing your workflow. To scope a useful pilot, could you share the main task, the systems involved, and a few non-confidential example questions or requests? We will use these to discuss the data needed, the review steps and an acceptance plan. Please do not send credentials or production customer records at this stage.

<!-- source-block: b249 -->

**Pilot brief**

<!-- source-block: b250 -->

Business task / process owner / current baseline / approved data / deployment preference / supported language / expected output / human approval / acceptance sample / exclusions / cost assumptions / next decision date.

<!-- source-block: b251 -->

**Procurement FAQ**

<!-- source-block: b252 -->

**Is CNPS the platform vendor?** CNPS is a FastGPT partner providing scoping and implementation services. Platform licensing and CNPS services are defined in the written proposal.

<!-- source-block: b253 -->

**Can we use our own environment?** We can assess a deployment in your environment. Model endpoints, document processing, backups and integrations must be included in the data-flow review.

<!-- source-block: b254 -->

**Are the published cases CNPS customer projects?** The reference cases are published by FastGPT. They are provided to explain possible workflows; your project will have its own scope and acceptance criteria.

<!-- source-block: b255 -->

**What do we get before committing to a rollout?** A scoped pilot proposal describing inputs, outputs, assumptions and measurement. Production rollout follows an agreed review of the pilot.

<!-- source-block: b256 -->

**How do we request a proposal?** Contact sales@cnps.ai or use the FastGPT inquiry page on www.cnps.ai. Tell us one workflow and who owns it.

<!-- source-block: b257 -->

<div class="page-break"></div>

<!-- source-block: b258 -->

<a id="chapter-28"></a>

## Chapter 28: Source index and update rules

<!-- source-block: b259 -->

Sources were checked on 2026-09-03. Linked main branches can change; record the selected version or commit for a formal delivery. Case summaries draw on the publishers' accounts without reproducing original charts or full articles. The sources below support factual observations; strategic recommendations are CNPS's analysis.

<!-- source-block: b260 -->

### Products, ecosystems, and policies

<!-- source-block: b261 -->

- S01 [FastGPT website](https://fastgpt.io/): public product positioning.
- S02 [FastGPT GitHub](https://github.com/labring/FastGPT): source code and usage entry points.
- S03 [FastGPT LICENSE](https://github.com/labring/FastGPT/blob/main/LICENSE): additional commercial licensing conditions.
- S04 [FastGPT case center](https://solutions.fastgpt.cn/customers): directory of cases and solution concepts, which must be distinguished.
- S05 [Dify GitHub](https://github.com/langgenius/dify): open-source and deployment paths.
- S06 [Dify partners](https://dify.ai/partners): service and ecosystem segmentation.
- S07 [Kyoshin–LangGenius partnership announcement, 2026-04-10](https://group.kyoshin.co.jp/news/741333/): Japanese enterprise partnership.
- S08 [RAGFlow](https://github.com/infiniflow/ragflow): product organization around documents and retrieval.
- S09 [LobeHub](https://github.com/lobehub/lobehub): current repository, redirected from lobe-chat.
- S10 [Chatbox](https://github.com/chatboxai/chatbox): desktop-client distribution.
- S11 [OpenManus](https://github.com/FoundationAgents/OpenManus): reference for open-source reproduction.
- S12 [Markdown Exporter](https://github.com/bowenliang123/markdown-exporter): document-export ecosystem.
- P01 [EU AI Act](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai): applicability requires separate assessment.
- P02 [Google Search Essentials](https://developers.google.com/search/docs/essentials): basic technical and content requirements.
- P03 [GitHub Acceptable Use](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies): boundaries for platform promotion.
- P04 [FastGPT Security](https://github.com/labring/FastGPT/security): security notices and reporting process.

<!-- source-block: b262 -->

### Original sources for the eight cases

<!-- source-block: b263 -->

- C01 [Yanfeng iSAP](https://solutions.fastgpt.cn/customers/manufacturing-production-processing/isap-it-ops-robot-solution)
- C02 [Shangluo part-number processing](https://solutions.fastgpt.cn/customers/manufacturing-production-processing/ai-part-number-analyzer-system)
- C03 [Yanfeng supplier recommendation](https://solutions.fastgpt.cn/customers/manufacturing-production-processing/fastgpt-supplier-recommendation-system)
- C04 [OPPEIN dispatch](https://solutions.fastgpt.cn/customers/e-commerce-retail-trade/retail-ai-dispatch-platform)
- C05 [Zhaozhao support](https://solutions.fastgpt.cn/customers/education-training-research-study/ai-intelligent-customer-service)
- C06 [Policy and project queries](https://solutions.fastgpt.cn/customers/construction-engineering-renovation/text-sql-institution-agent)
- C07 [Yanfeng document review](https://solutions.fastgpt.cn/customers/manufacturing-production-processing/ai-financial-audit-solution)
- C08 [Logistics knowledge support](https://solutions.fastgpt.cn/customers/transportation-logistics/yc-intelligent-customer-service)

<!-- source-block: b264 -->

### Observation samples from X

<!-- source-block: b265 -->

- X01 [Luyu Zhang: international event, 2024-09-05](https://x.com/goocarlos/status/1831721654227234941)
- X02 [Tom: Japanese workflow tutorial, 2025-01-07](https://x.com/0x__tom/status/1876558928018088123)
- X03 [まつにぃ: document export, 2025-03-15](https://x.com/yugen_matuni/status/1900815012652085400)
- X04 [Canopy Wave: model plugin, 2026-01-29](https://x.com/CanopyWave_CW/status/2016822425439392093/photo/1)
- X05 [digitalpr_jp: Japanese partnership, 2026-04-10](https://x.com/digitalpr_jp/status/2042456153519464803)

<!-- source-block: b266 -->

For every update, record factual changes, affected pages, the responsible editor, and review date. Replace public-strategy assumptions with evidence as customer permission and reliable data become available. Remove affected content when case authorization or supporting materials cease to be valid.
