# CNPS.AI Global Expansion Plan for Chinese AI Applications and Hardware

> Decision edition and public resource center plan · Research date: 2026-09-03 · Revision V22 (22 substantive revisions after the initial draft)
>
> Purpose: help overseas businesses move from understanding Chinese AI solutions to pilots with agreed acceptance criteria, qualified inquiries, and orders with positive contribution margins.
> This report is organized into 32 logical pages. Markdown includes page-break markers, and the website provides reading and print editions. Unless a source is explicitly identified, all amounts, conversion rates, and schedules are planning assumptions, not CNPS's historical performance or current quotations.

### How to read this report and make decisions

Business leaders should first read pages 01–04, 13, 22, and 26–29 to decide categories, budgets, and resources. Sales leaders should focus on pages 03, 12–17, 20–21, 25, and 30 to connect resources to inquiries and orders. Technical and delivery leaders should focus on pages 05–11, 18, 21, and 23–24 to check evidence, tests, and responsibilities. Pages 31–32 support source review and launch acceptance.

The report distinguishes execution recommendations from public facts and retains assumption labels for amounts and targets. Before-and-after SHA-256 hashes, findings, and corrections are documented in the [22-round revision log](/resources/cnps-ai-revisions). The original Markdown can be downloaded and maintained.

### Page-by-page contents

- [01 · First principles: why buyers place orders](#page-01)
- [02 · CNPS's current assets and gaps](#page-02)
- [03 · Work backward from orders to content and conversion](#page-03)
- [04 · Market selection and ideal customer profiles](#page-04)
- [05 · Application case: Dify adoption by a Japanese enterprise](#page-05)
- [06 · Model case: Qwen and DeepSeek's global developer pathways](#page-06)
- [07 · Application case: RAGFlow and document-intensive businesses](#page-07)
- [08 · Hardware case: Seeed connects edge AI with deployment](#page-08)
- [09 · Hardware case: XiaoZhi ESP32 and voice devices](#page-09)
- [10 · Hardware case: Unitree's SDK and research procurement](#page-10)
- [11 · Hardware case: UFACTORY xArm's developer procurement entry point](#page-11)
- [12 · Existing product entry points: TicNote and smart glasses](#page-12)
- [13 · Five service packages to commercialize](#page-13)
- [14 · Website information architecture](#page-14)
- [15 · Resource center content standards](#page-15)
- [16 · Case center evidence standards](#page-16)
- [17 · Research, content, and customer acquisition on X](#page-17)
- [18 · GitHub research and developer trust](#page-18)
- [19 · Search acquisition and high-intent pages](#page-19)
- [20 · RFQs and sales qualification](#page-20)
- [21 · Pilots, acceptance, and case creation](#page-21)
- [22 · Pricing, costs, and unit economics](#page-22)
- [23 · Suppliers and delivery systems](#page-23)
- [24 · Compliance and buyer trust materials](#page-24)
- [25 · Partners and channels](#page-25)
- [26 · 90-day implementation plan](#page-26)
- [27 · Budgets and scenario analysis](#page-27)
- [28 · Operational roles and data](#page-28)
- [29 · Experiment design and stopping conditions](#page-29)
- [30 · English public messaging and communication templates](#page-30)
- [31 · Evidence directory and research boundaries](#page-31)
- [32 · Decision checklist, publishing, and maintenance](#page-32)

<a id="page-01"></a>

## Page 01 | First principles: why buyers place orders

Overseas buyers do not procure the label “Chinese AI”; they procure an outcome in their own business environment at acceptable cost and risk. Procurement managers care about supply continuity; technical managers care about integration and performance; business leaders care about adoption; finance leaders care about cash recovery. A purchase can stop if any participant lacks an answer.

CNPS should therefore position itself as an entry point for selecting, validating, and coordinating procurement of Chinese AI applications and hardware. The website first helps customers define problems, compare solutions, and prepare pilots. Supply, deployment, and after-sales capabilities should be confirmed before becoming contractual commitments. The site must reflect services that can actually be delivered.

A transaction has five necessary conditions: a problem worth solving; a suitable solution; evidence the buyer trusts; the ability of both parties to complete delivery; and expected benefits that cover total costs. Content should reduce each uncertainty. Product catalogs, technical articles, cases, and inquiry forms each serve part of this task; publishing volume is not an end in itself.

The recommended north-star metric is “contribution margin from paid orders originating in the resource and case centers.” Early monitoring should focus on qualified inquiries and paid pilots while preserving traceability to that final metric. Page views, X impressions, and GitHub stars are signals to observe, not orders to record.

### A testable value proposition

Buyer net value = realizable business improvement − total cost of ownership − expected loss from failure. Improvements may include less manual review, lower losses from missed defects, or faster document retrieval. “Using AI” is not itself a benefit. Customers must supply the baseline, and benefits must be evaluated through a jointly agreed pilot.

CNPS's chargeable differentiation should center on four tasks: translating requirements into comparable specifications; organizing supply and technical evidence; lowering pilot startup costs; and clarifying delivery and support responsibilities. If customers can obtain equivalent service directly from the manufacturer, CNPS must explain its additional value rather than simply marking up a resale.

The smallest unit of a viable transaction is a specific requirement, a set of verifiable candidates, an acceptance method, and a quotation with clear responsibilities. This is also the test of whether each solution page is useful enough.

<!-- pagebreak -->

<a id="page-02"></a>

## Page 02 | CNPS's current assets and gaps

Direct access on 2026-09-03 confirmed that www.cnps.ai was a product website displaying TicNote recording devices, earbuds, and smart glasses, with purchases directed to shop.cnps.ai. The wholesale page published sales@cnps.ai and a telephone number, but no volume price tiers. Existing strengths include clear product entry points, a purchase path, and an identifiable sales contact. [Existing website](https://www.cnps.ai) · [Wholesale entry point](https://www.cnps.ai/wholesale)

The current gap is the organization of information needed for business procurement: which model fits which team; how pilot success is assessed; what software, training, and support cost beyond the hardware; and when to buy samples directly versus request project assessment. Filling these gaps is closer to generating orders than indiscriminately uploading 100 AI products.

The local GitHub repository initially contained only documentation, while the existing Vercel production deployment came from another code source. The new resource center must establish controlled source files and a build path while retaining existing product, policy, and store entry points. Cloudflare provides domain resolution; this content release should not normally require DNS changes.

Unverified capabilities include brand authorization, inventory, enterprise subscriptions, bulk pricing, customization MOQs, overseas repair partners, supported service languages, and response commitments. Public pages must not present these unknowns as strengths. Invite customers to submit requirements so suitable models and delivery scope can be confirmed, then provide evidence during quotation.

<!-- pagebreak -->

<a id="page-03"></a>

## Page 03 | Work backward from orders to content and conversion

Before an order comes a quotation both parties accept. Before a quotation comes an actionable requirement. Before a requirement comes a buyer who understands the solution and is willing to make contact. This gives a content chain: use-case explanation → verifiable case → technical and purchasing resources → pilot scope → RFQ → quotation → purchase order → delivery → repeat purchase.

Give each page one primary action. Product research pages guide comparison; case pages guide assessment of a similar pilot; purchasing checklists guide requirement submission; buyers who have chosen a standard SKU can enter the store. Many competing buttons can push business buyers toward payment before they have finished selecting a solution.

Define an inquiry as a work item that can progress, not simply a message in an inbox. It should include at least the company, country, use, quantity or site count, timing, and a reply channel. Allow buyers with an uncertain budget to choose “Need guidance,” so qualification does not favor only those who know how to complete a form.

CNPS's value should be demonstrated in the first conversation: return candidate options, key unknowns, and proposed next acceptance steps, rather than simply claiming competitive prices. If a project clearly exceeds supply or implementation capabilities, state the limits and possible partnership options to save time for both sales and customers.

<!-- pagebreak -->

<a id="page-04"></a>

## Page 04 | Market selection and ideal customer profiles

Initially prioritize research into small and medium businesses, system integrators, IT service providers, and distributors that can be served in English. Customers with a specific workflow, available test materials, and access to a decision-maker are more likely to enter paid pilots than businesses that are merely “interested in AI.”

| Candidate customer | Trigger event | Procurement participants | Most-needed evidence |
|---|---|---|---|
| Enterprise IT / MSP | Fragmented knowledge and repetitive tickets | IT lead, information security, business manager | Permission isolation, accurate citations, maintenance costs |
| Meeting-device distributor | Customers request AI recording devices | Procurement, channel manager, after-sales team | Model differences, subscription terms, batch consistency |
| Edge-vision integrator | Multisite camera project | Engineers, project manager | Camera compatibility, latency, recovery after network loss |
| Education and robotics laboratory | New course or research project | Professor, lab manager, procurement | SDK, development rights for the exact model, spare parts |
| OEM product team | Adding voice interaction | Product manager, hardware lead | BOM, backend dependencies, firmware maintenance |

Rank countries by validation speed, existing relationships, and delivery feasibility. English-language demand in the United States, United Kingdom, Canada, Australia, and Singapore can be tested first; Japan can be researched as a route through local partners. EU compliance documents must be assessed for the specific product and use case. This is an assumption about entry sequence, not a market-size ranking.

### Initial accounts and validation method

First build a research sheet for 30 candidate accounts: 10 meeting or office-device distributors, 10 MSPs serving industrial clients, and 10 integrators with edge-computing projects. Fields should include the public company website, core business, public signals relevant to the use case, contact channel, likely project-owner role, and questions to validate. This defines a research sample; it does not invent customer names or orders.

Priority research conditions are: the product may be allowed into the destination country; the team can support the customer's language; the customer can provide test data; and samples and after-sales service are feasible. If a necessary condition fails, stop that country/category combination rather than trying to compensate through more advertising.

Interview questions should cover why the most recent purchase began, who vetoed a project, how total cost is calculated, the biggest concerns about Chinese suppliers, and which validation the buyer would pay for. Expand relevant landing pages after real pain points recur across interviews. Interest without a concrete problem is not sufficient justification to enter a market.

<!-- pagebreak -->

<a id="page-05"></a>

## Page 05 | Application case: Dify adoption by a Japanese enterprise

Dify's official case describes Kakaku.com using Dify Enterprise to organize fragmented AI experiments into enterprise applications. The article explicitly discusses speed, security, and rollout. This is a named overseas adoption case, but it remains vendor-published material rather than an independent audit. [Dify: Kakaku case](https://dify.ai/ja/blog/kakaku-accelerates-ai-adoption-with-dify-fast-secure-and-scalable)

The GitHub repository provides workflows, knowledge retrieval, model connections, and self-hosting entry points. Dify's license is based on Apache 2.0 with additional conditions that require individual review. Do not promise unrestricted white labeling or multitenant resale. [GitHub repository](https://github.com/langgenius/dify) · [License](https://github.com/langgenius/dify/blob/main/LICENSE)

The lesson for CNPS is to charge around a workflow: for example, presales knowledge retrieval, ticket drafting, or product-document searches for equipment distributors. Establish real documents, user permissions, an evaluation set, and human escalation before discussing model choice. The customer buys dependable team use, not simply an installation.

Suitable materials include an English workflow diagram, anonymized input/output samples, acceptance metrics, deployment options, and pilot prerequisites. A suitable CTA is “Scope a knowledge assistant pilot.” A commercial partnership between CNPS and Dify has not been confirmed; the public case must be labeled an industry reference.

<!-- pagebreak -->

<a id="page-06"></a>

## Page 06 | Model case: Qwen and DeepSeek's global developer pathways

The official Qwen3 repository includes English documentation and instructions for local execution and deployment. Official X posts connect model capabilities with local deployment and online trials. The DeepSeek-R1 repository publishes model information and usage recommendations, while Arena-related posts on X show a route into international evaluation and trial channels. [Qwen3](https://github.com/QwenLM/Qwen3) · [Qwen X](https://x.com/Alibaba_Qwen/status/1955782109702078559) · [DeepSeek-R1](https://github.com/deepseek-ai/DeepSeek-R1) · [Arena distribution signal](https://x.com/ml_angelopoulos/status/1881419890940338288)

The replicable mechanism is to reduce the cost of a first evaluation: state the version, deployment method, and task boundaries clearly so customers can validate a small problem. Model popularity does not establish CNPS's ability to sell a complete system, nor guarantee accuracy in the target language or business task.

Prepare an evaluation for turning Chinese technical materials into English presales answers: the customer supplies authorized documents and questions; two interchangeable models are tested in parallel; citations, appropriate refusals, latency, and cost per task are recorded; and business staff review the results. Select based on customer data rather than leaderboard rank.

Self-hosted solutions must include inference hardware, concurrency, context, backups, and operations in the cost model. Model licenses, the base-model conditions of distilled models, and hosted API terms are different layers. “Open source and free” does not summarize all responsibilities.

### Specific license and provenance checks

Dify's public license states that its source code cannot be used to operate a multitenant environment without written authorization, and restricts modifying logos and copyright information when its frontend is involved. If CNPS considers hosting multiple customers or offering white-label service, it should first obtain the applicable commercial authorization. “Can be self-hosted” must not be read as “can be resold without restriction.” [Dify LICENSE](https://github.com/langgenius/dify/blob/main/LICENSE)

The DeepSeek-R1 repository states that code and weights use MIT, while also identifying the base-model origins of its Qwen and Llama distilled versions. Selection sheets must identify the exact checkpoint, rather than simply saying “DeepSeek, MIT.” [DeepSeek license notes](https://github.com/deepseek-ai/DeepSeek-R1#7-license)

“Chinese AI” in this report encompasses Chinese supply chains, related development teams, and their global ecosystems. It does not imply the registered jurisdiction or data-storage location of every project. For global teams such as Dify, the contracting entity must be determined from actual contract documents. A supply-chain label never replaces checks of legal entities, data locations, and authorization chains.

<!-- pagebreak -->

<a id="page-07"></a>

## Page 07 | Application case: RAGFlow and document-intensive businesses

RAGFlow's official repository focuses on document understanding, retrieval, and citations, with self-hosting instructions and multiple document inputs. It belongs on procurement evaluation lists involving large volumes of technical documents, manuals, tables, and scans. [RAGFlow GitHub](https://github.com/infiniflow/ragflow)

CNPS can design a “find the right information” pilot for industrial distributors: sample the customer's real presales questions, create a test set with reference answers, and compare the current manual search workflow with a retrieval assistant. The priority is not longer answers, but correct model names, specifications, units, and applicability conditions.

Treat data quality as a delivery item first. Original file versions, duplicates, scan quality, discontinued products, and regional specification differences all affect results. The system must display sources and dates; refuse when no supporting evidence exists; and escalate prices, lead times, and contractual conditions to sales for confirmation.

The content center should provide a document preparation checklist, permission matrix, data-update process, and evaluation report template. Without public evidence of customer revenue, label this an “open-source solution reference,” not an established commercial success in overseas expansion. CNPS's commercial recommendations are analysis, not an endorsement of CNPS by the upstream repository.

<!-- pagebreak -->

<a id="page-08"></a>

## Page 08 | Hardware case: Seeed connects edge AI with deployment

Seeed's official partner program connects hardware capabilities with enterprise software and system integrators. Its customization service lays out a path from requirements, engineering samples, validation, and pilot production to lifecycle management. This shows that hardware expansion needs both engineering documentation and delivery processes. [Partner program](https://www.seeedstudio.com/blog/2022/04/22/edge-ai-partner-program-accelerate-your-next-gen-ai-product-deliver-ai-solutions-across-industries-together/) · [Customization services](https://www.seeed.cc/jetson-odm)

Seeed's case materials describe deployments of Intflow's livestock vision solution in South Korea, Spain, Japan, Austria, Poland, and elsewhere. They establish public case support for a partnership model combining a local solution provider with Chinese edge hardware; they do not establish that CNPS has equivalent capabilities. [Case materials](https://edgeai.pny.eu/wp-content/uploads/2024/03/Seeed-Studio-succes-stories-pny-webonly.pdf)

A better entry point for CNPS is pilot procurement and integration coordination for a limited use case: one site, specified cameras, bounded target objects, and a defined environment. Quotes should state responsibilities for compute devices, lenses, power supplies, cables, storage, software, and installation together. Comparing only TOPS or device prices overlooks much of a complete system's failure risk.

Content templates should include an edge-vision purchasing checklist, site survey, camera compatibility record, network-loss recovery test, and cost per site. Multicamera demonstrations on X can attract attention, while technical judgments must return to the Wiki, SDK, and field testing. [Seeed X demonstration](https://x.com/seeedstudio/status/2004492392658035139) · [Wiki source](https://github.com/Seeed-Studio/wiki-documents)

<!-- pagebreak -->

<a id="page-09"></a>

## Page 09 | Hardware case: XiaoZhi ESP32 and voice devices

XiaoZhi publishes ESP32-based voice-interaction firmware and multilingual documentation. Its README describes connecting capabilities through models and MCP. The project uses the MIT license; that does not mean connected model services, voices, enclosure designs, or trademarks can be commercialized without restriction. [XiaoZhi GitHub](https://github.com/78/xiaozhi-esp32)

Customers worth researching include exhibition venues, reception desks, training-device providers, and OEM product teams. Start with adult use, bounded tasks, and controllable data. A voice device that answers public exhibit questions has more manageable acceptance and support boundaries than a promised round-the-clock general assistant.

Hardware is only the system's entry point. Microphones, echo cancellation, speakers, networking, backend inference, voice services, content maintenance, and OTA updates all affect the experience. A low device price does not imply low running costs. List monthly service fees, offline behavior, key rotation, and what happens when service ends.

Deliver an engineering prototype package: BOM, wiring instructions, firmware version, backend configuration notes, test recordings, noise scenarios, and device recovery methods. The page should accept inquiries to “Discuss a voice-device prototype.” Do not commit to mass production or suitability for children's products before supplier validation is complete.

<!-- pagebreak -->

<a id="page-10"></a>

## Page 10 | Hardware case: Unitree's SDK and research procurement

Unitree's SDK2 repository publishes interfaces and examples, and its developer center organizes materials by robot category. Open materials help overseas laboratories assess further development feasibility, making the exact model and development rights important pre-purchase questions. [Unitree SDK2](https://github.com/unitreerobotics/unitree_sdk2) · [Developer center](https://support.unitree.com/home/en/developer/)

X contains records of Unitree robots appearing overseas, including Poland. Such videos do not establish productivity, degree of autonomy, final order value, or compliance. The case center should label “overseas publicity signals” separately from “technical documentation.” [Poland publicity record](https://x.com/sz_mediagroup/status/2044007763345584334)

CNPS can research laboratory procurement coordination, configuration checks, transport, and introductions to training partners. The RFQ should ask at least for the exact model, development rights, payload, workspace, control method, research use, software environment, spare parts, and local operator. Suppliers must confirm differences between base and developer editions in writing.

Robotics projects must begin in controlled experimental environments, with simulation before on-site acceptance. Responsible personnel, emergency stops, operating zones, transport insurance, and repair routes all belong in scope. Without local technical support, humanoid robots should not be a primary source in the first 90 days' revenue assumptions.

<!-- pagebreak -->

<a id="page-11"></a>

## Page 11 | Hardware case: UFACTORY xArm's developer procurement entry point

UFACTORY's xArm Python SDK provides robotic-arm control interfaces, documentation, and examples—direct materials for engineers to assess integration feasibility. It establishes that development interfaces exist; alone, it does not establish that a particular customer application operates reliably in production. [xArm Python SDK](https://github.com/xArm-Developer/xArm-Python-SDK)

Typical requirements may involve teaching, research, or pick-and-place validation at a controlled workstation. Customers need to specify workpieces, payload, reach, fixtures, cycle time, space, and conditions under which people approach. The robot itself is not a complete automation system. Grippers, cameras, tooling, safety design, and on-site commissioning may determine final cost.

CNPS's case template should record both successes and failures: test count, success count, workpiece orientation, lighting, operator intervention, recovery time, and software version. Avoid presenting only a successful video; engineers should be able to reproduce the validation conditions.

Such projects suit cooperation with local integrators. Customer contracts should state what CNPS, the manufacturer, and the integrator each deliver, including responsibility for on-site safety assessment and maintenance. Where a support system is not established, accept only configuration-assessment and partnership inquiries.

<!-- pagebreak -->

<a id="page-12"></a>

## Page 12 | Existing product entry points: TicNote and smart glasses

CNPS already has recording-device and smart-glasses entry points, so completing business procurement information around these products should be a priority. Specifications, subscriptions, prices, and regional availability depend on the relevant SKU page and a confirmed written quotation. [Product catalog](https://www.cnps.ai/products) · [Model comparison](https://www.cnps.ai/products/compare)

Create separate guidance for a 10-person sales team, a 20-person training department, and channel sample purchases. Customers need to assess recording conditions, transcription languages, team accounts, export capabilities, subscription ownership, and after-sales responsibility. Enterprise buying is not necessarily a larger retail order: account administration and device reassignment may determine suitability.

Separate smart-glasses capabilities by task: display, translation, photography, or prompts must each be verified. The “AI glasses” label must not imply that every model includes every capability. Wearing comfort, prescription lenses, phone compatibility, and battery life may affect return rates more than model capabilities.

Start with a small sample evaluation and collect adoption, manual correction time, and support issues. Publish CNPS's own cases only after customer authorization. Customer names, logos, photographs, and performance figures without authorization or acceptance records do not belong in the public case center.

<!-- pagebreak -->

<a id="page-13"></a>

## Page 13 | Five service packages to commercialize

| Service package | Outcome the buyer purchases | First deliverable | Upgrade path |
|---|---|---|---|
| Meeting-device evaluation | Identify suitable devices and subscriptions | Requirements check, sample plan, acceptance checklist | Team procurement or channel volume orders |
| Knowledge-assistant pilot | Assess whether document retrieval is reliable | Data preparation, evaluation set, pilot plan | Integration and maintenance, quoted after capability confirmation |
| Edge-vision evaluation | Confirm technical feasibility on site | Site survey, BOM, validation plan | Single-site delivery and multisite replication |
| Voice-device prototype | Turn voice interaction into a testable prototype | Functional scope, firmware and backend inventory | Design validation, pilot production, mass production |
| Robotics procurement coordination | Verify model, rights, and support | Configuration sheet, risk list, partner plan | Laboratory delivery or integration project |

These are recommended directions for productizing services. CNPS must confirm supply and implementation responsibilities before making firm commitments. Pages can first collect “requirements assessment” inquiries. Formal quotations must state exclusions, delivery conditions, payment milestones, and acceptance criteria.

### Priorities under resource constraints

The following scores are internal planning judgments, with 5 being most favorable. Weights are 40% existing product foundation, 30% ease of pilot validation, and 30% low support burden. They are not conclusions from external market research.

| Direction | Existing foundation | Easy to validate | Low support burden | Weighted score | First 90 days' action |
|---|---:|---:|---:|---:|---|
| Meeting devices | 5 | 4 | 4 | 4.4 | Main procurement entry point; first verify enterprise suitability |
| Knowledge assistants | 2 | 4 | 3 | 2.9 | One industry, one workflow, limited pilots |
| Edge vision | 2 | 3 | 2 | 2.3 | Joint assessment with partners capable of field delivery |
| Voice devices | 1 | 3 | 2 | 1.9 | Prototype inquiries only; validate backend costs |
| Robotics | 1 | 2 | 1 | 1.3 | Research configuration and partner inquiries; no speculative inventory |

Recalculate scores after confirming brand authorization, staffing, and suppliers. Do not divide the budget equally among the five directions. During the first cycle, concentrate content and sales time on the first two, and cap concurrent long-cycle hardware projects at a manageable number.

For immature requirements, first sell an assessment with clear boundaries. For requirements with a known model, reduce meetings and proceed to volume quotation. Maintain both paths so a heavy consulting process does not block simple purchasing and retail checkout does not obscure complex project risks.

<!-- pagebreak -->

<a id="page-14"></a>

## Page 14 | Website information architecture

The website's primary entry point should serve overseas buyers in English. The homepage explains how CNPS helps buyers select options and communicate requirements, and presents key use cases, resource links, industry cases, and quotation buttons. Keep the store entry point for buyers who have already chosen a product.

Recommended routes: `/resources` for the resource center; `/case-studies` for cases; `/solutions` for use-case solutions; `/request-quote` for business requirements; and `/resources/china-ai-export-playbook` for this report's reading page. Existing product, support, and policy paths remain accessible.

Resource cards should contain a title, intended role, problem addressed, document type, update date, and next step. Case cards should include industry, country or region, public evidence category, key limitations, and related solution. Filters should focus on purchasing tasks, supported by applications, hardware, purchasing guides, and research materials.

Provide static, indexable body content and independent URLs. Do not hide core materials in dialogs that load only on the client. On phones, show the use and primary action first; allow wide tables to scroll horizontally. All materials should offer copyable text rather than only images or video.

<!-- pagebreak -->

<a id="page-15"></a>

## Page 15 | Resource center content standards

Every purchasing resource should answer at least: who it suits; who it does not suit; required inputs; how to evaluate it; what delivery includes; remaining unknowns; and the next step. Replace vague promises of “improved efficiency” with specific questions.

Initial resources should include an enterprise AI purchasing checklist, meeting-device pilot sheet, knowledge-assistant evaluation sheet, edge-vision site survey, voice-prototype specification, robotics configuration checklist, RFQ template, and total-cost-of-ownership template. Build a complete path around selected use cases rather than seeking encyclopedic coverage.

### First-month editorial calendar

| Week | Purchasing article | Case or technical reference | Download | Follow-on action |
|---|---|---|---|---|
| 1 | How to select team recording devices | Existing CNPS model entry points and suitability checks | Meeting pilot sheet | Bulk quotation |
| 2 | What a private knowledge assistant needs | Dify / Kakaku and RAGFlow | 100-question evaluation sheet | Knowledge-assistant scoping discussion |
| 3 | Whole-system cost of edge vision | Seeed / Intflow and engineering Wiki | Site survey | Single-site assessment |
| 4 | Voice devices from prototype to service | XiaoZhi technical reference and backend boundaries | Prototype specification | Prototype requirements discussion |

Each week, turn one complete resource into 2–3 X posts, and retain original templates and changes on GitHub. The English editor checks units, regions, model names, and action wording; the technical lead checks interfaces and versions; the sales lead checks whether the CTA leads to an actionable follow-up.

A content task is complete only when body text, sources, limitations, download, related pages, and a clear CTA are all ready. Finishing an article without connecting its next step to the sales process is not completion.

Technical material versions must be traceable to a repository, release, or official page. Prices, lead times, licenses, and compliance documents each need update dates. Label diagrams as public-source material, CNPS tests, or proposed designs. Without measurements, do not call a schematic a performance report.

English body copy should give overseas buyers actionable information rather than literally translating Chinese marketing phrases. Titles can directly say “Evaluate AI meeting recorders for your team” or “Plan a private knowledge assistant pilot.” Each resource should end with only the most relevant inquiry action.

<!-- pagebreak -->

<a id="page-16"></a>

## Page 16 | Case center evidence standards

Distinguish four case statuses: vendor-published named-customer cases; open-source technical references; social-platform publicity signals; and CNPS's own delivery cases. They support different judgments and must not be combined as “our customer success stories.”

Use original summaries and analysis of public cases, linking to the source. A case structure includes the business problem, system architecture, verifiable evidence, limitations, purchasing implications, and pilot recommendations. Attribute vendor benefit figures and state their measurement scope. Do not invent methods the source does not explain.

### What this report's evidence can establish

| Reference | What it supports | What it does not support | What CNPS must add |
|---|---|---|---|
| Dify / Kakaku | A vendor publicly describes adoption by a named Japanese enterprise | Revenue, audited benefits, CNPS implementation capabilities | Its own evaluation set and license review |
| Seeed / Intflow | A vendor case collection lists overseas deployment regions | CNPS dealership status or equivalent results at every site | Model checks, supply relationships, and use-case tests |
| Qwen / DeepSeek | Official technical materials and international trial channels exist | Best current model or accuracy on a customer's project | Exact versions and comparison on real tasks |
| RAGFlow / XiaoZhi | Implementation and deployment materials can be examined | Existing overseas paying customers or readiness for mass production | Installation validation, costing, and after-sales design |
| Unitree / xArm | SDKs and development paths exist | Every SKU supports development or can replace human work | Rights, configuration, and on-site safety confirmation |

Dify's named article and anonymous industry pages may use different reporting periods and samples, so this report does not combine their adoption-rate figures. Intflow material comes from a Seeed case collection hosted by PNY and retains its status as vendor material. Benefit percentages without complete measurement context are not used as CNPS forecasts.

CNPS's own cases require contract or project identification, customer authorization, a test plan, actual results, and dates. When a customer cannot be named publicly, describe the industry and scale while retaining internal evidence. Unsupported claims such as “save 80%” or “payback in 3 months” must not be published as facts.

Prioritize details that help buyers decide: failure conditions, input requirements, and steps needing human intervention. Cases earn credibility through clear boundaries, not by making every project look risk-free. Pilots that miss their targets can also produce valuable selection guidance.

<!-- pagebreak -->

<a id="page-17"></a>

## Page 17 | Research, content, and customer acquisition on X

X is useful for finding the language of demand, demonstration formats, and international developer discussions. Research records should include the exact post URL, author, publication date, original claim, and verifiable external evidence. Search indexing is incomplete, so these results must not be described as an exhaustive market survey.

Signals available in this research include Qwen's official trial entry points, Seeed's official multicamera demonstrations, a Japanese Dify user's document-export discussion, Arena's evaluation distribution of DeepSeek, and Unitree's overseas publicity. Together they point to the importance of trial access, integration, local-language content, and developer tools. [Qwen](https://x.com/Alibaba_Qwen/status/1955782109702078559) · [Seeed](https://x.com/seeedstudio/status/2004492392658035139) · [Dify user](https://x.com/yugen_matuni/status/1900815012652085400)

Publish 3 kinds of content each week: an analysis of a real purchasing question, a downloadable template, and a demonstration with stated conditions. Each post should link to its corresponding resource page with explicit source parameters. Help when answering relevant questions; do not bulk-post links into unrelated discussions.

Measure the chain: post → resource page → RFQ → qualified inquiry → pilot. Compare inquiry quality by topic rather than choosing direction by likes. This plan provides content drafts and processes; it does not mean that X posts, direct messages, or third-party contact have occurred.

### X search record and repeatable actions

Search combinations included Dify Japan enterprise, Seeed Studio reComputer edge AI, and Unitree Robotics G1 SDK, restricted to x.com, then checked against official project accounts and specific posts. Dates below come from readable posts; all were searched on 2026-09-03.

| Post | Date | Observation | Action CNPS can reproduce |
|---|---|---|---|
| X01 Qwen official | 2025-08-13 | Capability descriptions link to online trials and local deployment | Connect every technical article to a verifiable experience |
| X02 Seeed official | 2025-12-26 | Multicamera demonstration names hardware and software | State demonstration configurations, conditions, and limitations |
| X03 Japanese Dify user | 2025-03-15 | Discusses the specific workflow need of document export | Explain one small workflow in the customer's language |
| X04 Arena-related publication | 2025-01-20 | The model enters an international public evaluation channel | Give engineers a way to evaluate for themselves |
| X05 Unitree overseas coverage | 2026-04-14 | The Polish setting has publicity value | Learn from the storytelling without treating video as order evidence |

First-month X drafts can cover subscription ownership, a 10-person pilot, incorrect document citations, total camera-system cost, offline voice-device behavior, and robotics development rights. Give each post one download entry point. Example parameters: utm_source=x, utm_medium=organic_social, utm_campaign=meeting_pilot, utm_content=subscription_check. Do not put contact names or email addresses in parameters.

Do not derive technical facts from X's autogenerated trend summaries or cite revenue, margin, or market-share posts that have not been checked against original financial documents.

<!-- pagebreak -->

<a id="page-18"></a>

## Page 18 | GitHub research and developer trust

GitHub lets technical decision-makers examine implementation feasibility. Public repositories should provide an English README, clear versions, reproducible examples, data descriptions, licenses, and known limitations. Business promotion must relate to actual repository contents; do not post sales advertisements in upstream issues.

CNPS can maintain purchasing templates, evaluation scripts, and anonymized sample data in its own repository, linking to the corresponding solution pages. A reproducible document-retrieval evaluation method is more valuable than copying a popular project's README. Do not require an email address to view basic materials.

Review releases, LICENSE, SECURITY, and major compatibility issues for dependencies monthly. Maintain a list of verified versions rather than treating changes on an upstream main branch as automatically production-ready. Example repositories must use only synthetic data or data authorized for public release when customer data is involved.

### Proposed repository structure and release threshold

Suggested structure: docs/buyers for purchasing templates; examples for synthetic data and workflow examples; evals for scoring guidance; CHANGELOG for compatibility changes; and SECURITY for the vulnerability-reporting channel. Specify code and documentation licenses separately. Third-party trademarks and content are not CNPS assets.

The minimum release conditions for an example are: it can be completed in a clean environment by following the README; dependency versions are pinned; sample inputs and outputs can be checked; costs and network dependencies are clear; recovery steps work; and no real customer files, personal information, or keys are present. Designs that have not been run must be labeled “reference design,” not “production-ready.”

Bidirectional GitHub–website links should have a specific purpose. The README points to relevant procurement guidance, and the resource page points to an exact version. Answer issues around real technical questions; direct commercial requirements to the website while preserving technical discussion quality. Useful trust metrics include example completion, fewer repeated questions, and qualified projects introduced—not total stars.

Repositories reviewed for this research include Dify, Qwen3, DeepSeek-R1, RAGFlow, XiaoZhi, Seeed Wiki, Unitree SDK2, and xArm SDK. Repository existence and activity are technical ecosystem signals; they do not directly quantify overseas orders or replace supplier due diligence.

<!-- pagebreak -->

<a id="page-19"></a>

## Page 19 | Search acquisition and high-intent pages

Build pages around procurement questions: AI recorder bulk purchase, private knowledge assistant pilot, edge AI camera deployment checklist, ESP32 voice assistant prototype, and robotics SDK procurement checklist. These are topic hypotheses to validate, not verified search-volume data.

Each page should address a clear intent: selection, budgeting, deployment, alternatives, validation, or purchasing. Its title and description explain the decision it helps make, and its body includes comparison dimensions and sources. Do not mass-produce empty landing pages by swapping country names in otherwise identical text.

Technical implementation requires semantic headings, canonical URLs, a sitemap, crawlable HTML, readable URLs, and appropriate structured information. Public PDFs and Markdown should be discoverable from reading pages, while the main reading page should avoid fragmented positioning through duplicate content.

After publication, use actual Search Console impressions and queries to choose the next topics. Low click-through may indicate a mismatched title; reading without inquiries may indicate CTA, trust, or product-fit problems. Diagnose before increasing article volume.

### Mapping intent to pages

| Query intent | Page content | Primary conversion | Validation |
|---|---|---|---|
| Team-device procurement | Models, subscriptions, pilots, and after-sales | Bulk RFQ | Does it include a specific quantity and destination country? |
| Private knowledge-base implementation | Data, permissions, deployment, and acceptance | Pilot scope | Can the buyer provide authorized documents and an owner? |
| Edge-vision solution | Site, cameras, compute, and TCO | Site survey | Are site and network conditions provided? |
| Voice-device development | BOM, backend, languages, and firmware | Prototype specifications | Are the task and maintenance budget defined? |
| Open robotics platform | SKU, SDK, spares, and training | Configuration assessment | Are development rights and intended use clear? |

These queries are content-planning inputs; search volume and cost per click have not been measured. Obtain 28 days of real query data before deciding title changes and expansion topics. Do not declare organic search ineffective after 1 week without inquiries, or increase spending based on rankings without sales-quality feedback.

English buyer pages and Chinese internal strategy pages should each have independent titles and canonicals. Add hreflang only when language versions correspond in content. Give strategy download pages English explanations and the original Markdown so overseas buyers can distinguish purchasing resources from operational research.

<!-- pagebreak -->

<a id="page-20"></a>

## Page 20 | RFQs and sales qualification

Requirements fields: company, contact person, email, country, intended purchase use, product or solution category, quantity/site count, timing, existing environment, and desired help. Budget is optional; uploading confidential materials is not a condition of initial contact. Explain how submission works and how data will be used.

Initially use the existing sales@cnps.ai address as the clear handoff point and generate structured email drafts. The page must explain that the user still needs to send the email in an email client; it must not claim “inquiry received.” If a CRM is integrated later, show a receipt only after successful server-side storage and handle duplicate submissions.

Qualification focuses on the problem, decision authority, timing, technical feasibility, and budget range. Sales should first confirm its understanding, then ask the fewest necessary follow-up questions. Every qualified inquiry needs an owner, next action, and deadline so information does not remain in an individual's inbox.

### Qualified inquiries and routing rules

A qualified inquiry should include at least a business contact who can reply; an identifiable organization and destination country; a use that fits a product or solution; and some indication of quantity, user count, or site scale. A personal email address does not automatically disqualify a small company, and an unknown budget does not automatically disqualify early evaluation. Robotics and vision projects additionally need a confirmed on-site owner.

Internal scoring assumptions: business pain 0–25, access to decision-makers 0–20, timing 0–15, technical feasibility 0–25, and budget fit 0–15. Scores of 70 or more receive priority assessment; 40–69 require more information; below 40 receive self-service materials. Scores only manage the queue: clearly noncompliant supply or technically infeasible projects cannot qualify for a quotation through a high score.

For standard SKUs, sales directly checks quantity and destination. For solution projects, first confirm data and acceptance. Route channel cooperation to the partner owner. Every reply should end with a concrete next action, such as agreeing a sample scope or specifying target languages, rather than simply “contact us anytime.”

Block firm quotations when key information is missing: model, destination country, development authorization, or data-processing requirements. An estimate may be provided with explicit assumptions, a validity period, and items awaiting confirmation, but not as a commitment that cannot be fulfilled.

### A quotation should be independently approvable

Part 1 identifies the customer entity, project number, destination country, and validity period. Part 2 specifies models, quantities, versions, service outputs, and exclusions. Part 3 lists currency, unit prices, one-time fees, recurring charges, tax assumptions, and trade terms. Part 4 states when lead time begins, acceptance criteria, warranty, and change and cancellation rules.

Payment milestones should align with costs and control. A pilot may be discussed in terms of an initiation payment and an acceptance payment, with proportions negotiated for the project. For custom hardware, first clarify nonrefundable materials and supplier payment obligations. None of these examples is a payment term already offered to a customer.

When a customer sends a PO, sales checks model, terms, and lead-time consistency against the quotation before supply and finance confirm order acceptance. AI may extract differences and draft replies, but authorized people must approve prices, substitute models, lead times, and credit terms.

Lost-order records should at least distinguish canceled procurement, no budget, a competing solution, performance mismatch, lead time, trust, and compliance barriers. Each month, feed the largest addressable causes back into resources and delivery processes.

<!-- pagebreak -->

<a id="page-21"></a>

## Page 21 | Pilots, acceptance, and case creation

Pilot contracts should translate the business problem into observable outcomes. Meeting devices are evaluated on active usage and correction time; knowledge assistants on citation accuracy, permissions, and appropriate refusals; edge vision on missed detections, false alarms, latency, and recovery; voice devices on task completion and noise conditions; and robotics on specified-task success and safety boundaries.

Every pilot starts by recording a baseline and agreeing test samples and success criteria. Acceptance is performed by people jointly designated by buyer and seller, not by a presenter selecting the easiest samples on the day. Metrics must define denominators, and anomalies must be retained in the record.

### An example knowledge-assistant pilot protocol

Create a 100-question acceptance set separate from tuning data: 50 single-document factual questions, 20 cross-document comparisons, 15 insufficient-evidence questions, and 15 permission-isolation questions. This distribution is a proposed protocol, not a test result. Record the standard, answer, citations, human score, and correction time for every question.

Negotiable example thresholds are: at least 63 of 70 answerable questions are correct for the business, with citation support checked individually; at least 14 of 15 unsupported questions receive appropriate refusals; and none of the 15 permission questions exposes restricted content. Passing a finite permission sample does not establish absolute security; architecture and access controls still require review.

Fix the model, index, hardware, concurrency, and warm-up state for performance tests. Use at least 100 representative requests to record p50/p95 response times and failures. Agree latency targets based on the actual task. Allocate costs to completed tasks that pass business review, recording retries, parsing, and manual review as well.

A 2-week pilot plan could allocate days 1–2 to freezing scope, days 3–5 to preparing data, days 6–8 to configuration and tuning, and days 9–10 to independent acceptance. This assumes data, permissions, staff, and environments are available on time; it is not a public delivery promise.

Paid pilots can qualify real demand and cover some engineering work, but outputs and exclusions must be clear before charging. If a pilot misses its targets, deliver a problem list and next-step recommendations rather than using extra fees to extend experimentation indefinitely.

After acceptance, separately request customer permission to publish a case. Authorization should cover name, logo, photographs, metrics, and quotations. Until permission is obtained, keep only internal records. Once published, successful cases help later customers shorten their evaluations.

<!-- pagebreak -->

<a id="page-22"></a>

## Page 22 | Pricing, costs, and unit economics

Quotations should separately identify hardware, subscriptions, implementation, training, freight, taxes, insurance, spares, and maintenance. Confirm tax and import responsibilities for the specific destination and trade terms. A cheap device that creates high support costs may be poor business.

Define contribution margin as net revenue less procurement, payment, fulfillment, direct support, and expected return and warranty costs. Include fixed salaries and similar costs separately in the operating budget to avoid omissions or double counting. Referrals and organic traffic also incur content-production and maintenance costs.

Illustrative assumptions: an order with net revenue of USD 10,000, procurement of 6,000, transport and payment costs of 600, direct implementation and support of 1,200, and a warranty/returns provision of 400 has a contribution margin of USD 1,800. This demonstrates calculation, not a CNPS quotation, actual order, or profit forecast.

Pricing should match responsibility. Procurement coordination differs from on-site integration, and a one-time delivery differs from ongoing service. Supplier-cost updates, exchange rates, and logistics changes should inform quotation validity so fixed website numbers are not interpreted as permanent commitments.

### Buyer total cost of ownership and sensitivity

12-month TCO = hardware and accessories + one-time implementation and training + 12 × monthly subscription/inference/maintenance + freight and taxes + expected downtime and replacement costs. Before bulk purchasing devices, allocate cost over actual active users, not merely everyone issued a device.

Planning example: 20 devices at USD 150 each, 20 accounts at USD 10 each per month, training of USD 600, and freight and other costs of USD 400 yield annual TCO of USD 6,400. If all 20 people use the system, annual cost per person is USD 320; if only 10 continue using it, cost per active user is USD 640. All unit prices here are examples and do not correspond to a current SKU.

If each active user saves a net 0.5 hours per week for 48 weeks a year, with an assumed internal time value of USD 25/hour, theoretical time value is USD 12,000 for 20 people or USD 6,000 for 10. Time saved does not automatically become cash benefit. Apply a customer-confirmed realization factor and subtract correction, training, and maintenance time. Counting generation speed without review time overstates benefits.

<!-- pagebreak -->

<a id="page-23"></a>

## Page 23 | Suppliers and delivery systems

Supplier assessment covers company identity, authorization chains, models, firmware, certificates, test reports, capacity, lead times, packaging, batch traceability, and after-sales service. Documents must match the actual SKU; a report for a similar model cannot substitute for every product.

Establish gates from samples through mass production: requirements freeze, engineering samples, design validation, pilot production, shipment inspection, and arrival acceptance. Every gate needs deliverable documents and clear signing responsibility. After changes to key components or firmware, recheck compatibility and certification implications.

### Responsibility matrix and delivery gates

| Work | CNPS | Manufacturer / supplier | Local partner | Customer |
|---|---|---|---|---|
| Requirements and quotation | Coordinate and define scope | Confirm model and cost | Confirm field work | Approve scope |
| Authorization and product documents | Check and archive | Provide documents for the actual SKU | Check local applicability | Confirm procurement requirements |
| Samples and shipment | Track and assemble acceptance evidence | Production and shipment inspection | Receive as agreed | Approve samples |
| On-site integration | Perform only agreed work | Support with technical documentation | Perform agreed installation and commissioning | Provide site and staff |
| Acceptance and after-sales | External coordination and ticket tracking | Repair or replace under contract | Local support | Sign acceptance and give feedback |

This is a starting point for contract negotiation; it does not automatically assign obligations. Final quotations must name responsibility for each item. A standard sample package includes physical serial numbers, firmware, BOM, packaging photographs, inspection results, and an accessory list. Key component changes during pilot production require confirmation of customer acceptance and documentation effects.

Use project-driven inventory: do not stock high-price robots before demand is validated or customize nonrefundable components before a bulk order is signed. Record at least a second source or replacement route for critical equipment, including resulting changes in software, certification, and after-sales service.

Cross-border hardware needs advance handling of plugs, power supplies, radio bands, manual languages, lithium-battery transport, repair returns, and replacement units. Delivery plans must include logistics buffers and import responsibility. A courier's estimated transit time is not a delivery commitment.

For software, supplier management also includes API availability by region, version upgrades, data-processing terms, and service-discontinuation plans. Customers need to know the cost of changing models or providers. Building replaceability into the architecture is more robust than depending entirely on one popular platform.

<!-- pagebreak -->

<a id="page-24"></a>

## Page 24 | Compliance and buyer trust materials

Determine compliance by product, target market, use case, and CNPS's legal role. Consult current official guidance for the EU AI Act's applicability dates and classifications. Do not treat every AI system as high-risk or use ordinary product certificates as proof of AI-system compliance. [European Commission AI Act](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)

For wireless hardware entering the United States, check the applicable FCC equipment-authorization procedure and documentation for the actual model. For EU CE conformity, identify applicable rules, testing, and responsible entities. Batteries, wireless functions, electrical components, cameras, and recording each require assessment of relevant obligations. [FCC equipment-authorization materials](https://opendata.fcc.gov/Engineering-Technology/EAS-Equipment-Authorization-Grantee-Registrations/3b3k-34jp)

Data-processing materials should explain what is collected, where it is stored, who can access it, retention periods, deletion methods, and subcontractors. Recording and vision solutions should require customers to confirm lawful uses and notice procedures; technical capabilities are not unconditional permission to collect data.

### Data flows and documents customers can review

A typical knowledge-assistant data flow is: customer-authorized documents → controlled storage → parsing and retrieval → model inference → sourced answers → logs with defined retention. Every arrow needs an explanation of cross-border transfers, accessing entities, and transmission protection. Self-hosting an application does not automatically mean model calls are local.

| Item to check | Documents to request or create | Blocking condition |
|---|---|---|
| EU product | Applicable rules, technical documentation, declaration of conformity, and labeling | Documents do not match the actual model |
| Wireless device | Applicable FCC authorization evidence and model matching | Only unrelated module or similar-model information is provided |
| Data processing | Data locations, subcontractors, retention/deletion, and responsibility terms | Data flows cannot be explained |
| AI-system role | Provider/deployer or other roles and use-case classification | Use case and obligations are undetermined |

CE marking concerns the manufacturer's responsibility for conformity with applicable requirements; it must not be described as a universal safety guarantee issued by the EU. See [Your Europe CE guidance](https://europa.eu/youreurope/business/product-rules-compliance/general-product-compliance/ce-marking/index_en.htm). For data processing, see the [European Commission's data-protection explanation](https://commission.europa.eu/law/law-topic/data-protection/data-protection-explained_en). These are starting points for verification; professionals responsible for the market should confirm actual conclusions.

Public trust materials can begin with a clear company identity, support channels, a product-document checklist, and data-flow diagrams. Appropriate professionals should confirm specific regulatory and contract requirements for formal projects. This report provides a project-checking framework, not a substitute for professional advice on a particular market.

<!-- pagebreak -->

<a id="page-25"></a>

## Page 25 | Partners and channels

The best early partners fill delivery gaps: local IT service providers, industry software companies, hardware integrators, and specialist distributors. Cooperation should rest on serving the same customer types with complementary capabilities, not merely sharing each other's content.

Partner pages should define project types, regions, capabilities, lead ownership, and the cooperation process. Trial nonexclusive cooperation, complete a small project, and then discuss territorial authorization or joint branding. Do not claim official dealership status before supplier identity, authorization, and channel policies are confirmed.

Partner economics should be based on net revenue and actual responsibilities. Price lead introductions, implementation, training, and warranty separately so responsibility remains clear when problems arise. Before sharing customer information, define customer awareness, access scope, and intended use.

Quarterly reviews should examine qualified opportunities, closed-order margins, delivery quality, and customer retention from partners. Relationship counts are not outcomes. Stop allocating new projects to partners that repeatedly fail to meet support commitments, and arrange customer-service handover.

### Initial partner communication and service cadence

Start partner research with public company information to confirm customer types, technical capabilities, service regions, and current product lines. Initial communication should offer a resource or pilot idea directly relevant to the partner's business and state each party's work. Do not share customer lists with suppliers without permission.

Communication draft: We are exploring a small pilot for teams that need reliable answers from technical documents. Your integration experience may complement product sourcing and evaluation work from CNPS. Would it be useful to compare one clearly scoped customer requirement and the delivery responsibilities?

This plan provides drafts only; no outreach messages have been sent. Actual outreach should be arranged by the account owner after checking local marketing rules, channel terms, and recipient preferences. Do not scrape GitHub user emails into bulk-mailing lists.

An initial internal service target can be a first human reply within 1 business day of receiving an email; this is not an existing public SLA. If the team cannot meet it reliably, first reduce channel spending. Follow up on inbound inquiries at agreed times. Without a clear next step, keep reminders limited and respect requests to stop contact.

<!-- pagebreak -->

<a id="page-26"></a>

## Page 26 | 90-day implementation plan

| Period | Main work | Verifiable deliverables |
|---|---|---|
| Weeks 1–2 | Confirm initial products, service scope, and contact process | Capability inventory, English resource center, RFQ template |
| Weeks 3–4 | Publish core use cases and industry references | Complete resource path, source ledger, initial buyer interviews |
| Weeks 5–6 | Test content topics and channels | Source-attributed inquiry records, issue categories, revision list |
| Weeks 7–8 | Advance qualified pilots and sample evaluations | Pilot scope, quotations, baselines, and acceptance sets |
| Weeks 9–10 | Validate supply and delivery | Sample reports, support process, partner responsibility matrix |
| Weeks 11–12 | Review channels and unit economics | Initial authorized cases or failure reviews; next-cycle decision |

The 90-day goal is to validate a repeatable acquisition and delivery path, not to cover every category at once. Content, sales, and delivery must work from the same customer problems. Revise pages weekly based on actual inquiries rather than waiting until quarter-end to change direction.

### Stage gates: management targets, not sales promises

Day 30: complete research on 30 accounts, aim for 6 structured buyer conversations, and find at least 2 pain points repeated across different buyers. Collect supply evidence for initial SKUs. If these goals are missed, revise customer profiles and content before expanding paid channels.

Day 60: aim for 3 project opportunities with clear scope, an acceptance owner, and a budget path, with at least 1 entering a paid pilot or sample purchase. If there are only visits and vague interest, do not expand inventory on the assumption that orders are imminent.

Day 90: aim for 1 reusable procurement or delivery process and 1 authorized original case or complete failure review, and check whether order contribution margins are positive. Calibrate actual order targets using the first 30 days' data. Do not promise specific revenue without evidence.

Sequence dependencies: confirm the intake owner and real product information before driving traffic; fix the evaluation set before demonstrating; confirm supply and acceptance before taking bulk orders. Website publication establishes acquisition infrastructure; it does not mean these business objectives have been achieved.

If qualified inquiries are insufficient, check the audience and handoff path. If inquiries are plentiful but pilots are scarce, check quotations and requirement fit. If pilots are plentiful but orders scarce, check actual outcomes, responsibilities, and purchasing processes. Different stages require different corrections.

<!-- pagebreak -->

<a id="page-27"></a>

## Page 27 | Budgets and scenario analysis

Separate initial budgets into one-time setup and ongoing operations, with samples and project working capital listed separately. Site building, research, English editing, demonstration production, customer support, and engineering assessment all take paid time. AI assistance does not make these costs zero.

Planning example: divide 90 days into lean validation, baseline operations, and expansion scenarios, each with limits on content volume, channel spending, and concurrent pilots. Prioritize lean validation until there is evidence of orders or qualified inquiries, and recalculate budgets using actual supplier and staffing quotations.

### Example 90-day operating-resource caps (USD)

| Item | Lean validation | Baseline operations | Expansion validation |
|---|---:|---:|---:|
| Allocated website and content labor | 2,000 | 5,000 | 9,000 |
| English technical editing | 800 | 2,000 | 4,000 |
| Samples and test consumables | 1,000 | 3,000 | 6,000 |
| Sales and technical-assessment hours | 1,500 | 4,000 | 8,000 |
| Tools and small channel experiments | 500 | 1,500 | 4,000 |
| Contingency | 700 | 1,500 | 3,000 |
| Total | 6,500 | 17,000 | 34,000 |

These are resource-budget caps for discussion, not purchasing authorization, actual expenditure, or market quotations. Labor is allocated by hours invested; remove duplicates if finance separately counts full salaries. Customer-order procurement advances, taxes, and inventory are outside this table and require a separate cash plan.

Start with the lean scenario. Set a planning cap of USD 300 for each new-channel experiment. If the cap is reached without a conversation that can be qualified, pause and review. Entry into the baseline scenario requires recurring pain points, at least 1 paid pilot or sample purchase, and a delivery owner. Expansion additionally requires positive contribution margins and a repeatable support process.

| Cost item | Control method | Condition for more investment |
|---|---|---|
| Content and translation | Build around one purchasing problem | The page generates qualified conversations |
| Samples and tests | Define acceptance jointly with target customers | Named project and test plan exist |
| Channel trials | Set small caps and stopping rules | Source is traceable and lead quality is acceptable |
| Technical support | Limit concurrent projects | Reusable delivery materials exist |

Do not calculate budgets solely from ideal conversion rates. Show low, medium, and high scenarios, and examine how response delays, lead times, returns, and collection periods affect cash. Verifiable results should determine spending pace.

<!-- pagebreak -->

<a id="page-28"></a>

## Page 28 | Operational roles and data

Define at least four roles: content and research owner, sales owner, technical-assessment owner, and supply and delivery owner. One person may hold multiple roles, but every opportunity must have one person ultimately accountable for progress.

Customer stages can be new inquiry, information pending, qualified, pilot assessment, quoted, negotiation, won, lost, delivered, and repeat purchase. Every status change records time, reason, next action, and owner, replacing subjective impressions of pipeline health.

Weekly reviews should cover qualified inquiry volume, sources, time to first human reply, pilot-entry rate, and lost-order reasons. Monthly checks should cover contribution margin, support time, refunds, and collection cycles. Distinguish one-time research attention from repeatable commercial conversion.

Customer personal information belongs only in controlled business systems, never public GitHub. Public-site analytics should retain only necessary events and sources. Confirm notice and applicable consent requirements before deploying third-party analytics. Never put full inquiry content or email addresses in URLs.

### Funnel model and attribution limits

| 90-day planning scenario | Relevant visits | Visit-to-inquiry rate | Inquiries | Qualification rate | Qualified opportunities | Win rate | Expected orders |
|---|---:|---:|---:|---:|---:|---:|---:|
| Conservative | 500 | 1% | 5 | 40% | 2 | 20% | 0.4 |
| Baseline | 1,500 | 2% | 30 | 50% | 15 | 20% | 3 |
| Optimistic | 3,000 | 3% | 90 | 60% | 54 | 25% | 13.5 |

Numbers illustrate the multiplicative relationship; they are not forecasts. Fractional orders are statistical expectations and cannot be described as completed orders. Sales cycles may exceed 90 days. Engineering and fulfillment capacity also constrain actual completion; the optimistic scenario does not automatically justify expansion.

If the baseline produces 3 orders at average net revenue of USD 5,000 and an assumed contribution-margin rate of 25%, contribution margin is USD 3,750, insufficient to cover the USD 17,000 baseline operating budget. At the same USD 1,250 contribution per order, at least 14 orders are needed to cover that budget. This highlights the need to improve order value, margins, repeat purchases, or costs; it does not claim 90-day payback.

Record both first source and last meaningful source, and deduplicate by company and project. Count Shopify retail orders in the B2B funnel only when a connection to the relevant opportunity is confirmed. Opening an email draft is not successful submission, and downloading a resource is not a qualified inquiry.

<!-- pagebreak -->

<a id="page-29"></a>

## Page 29 | Experiment design and stopping conditions

The first experiment tests whether purchasing templates produce clearer inquiries. The second tests whether case pages increase willingness to pilot. The third tests whether separate paths for standard SKUs and solution assessments reduce unproductive communication. Define the audience, change, observation period, and decision method before every experiment.

When traffic is low, do not call a difference of a few events statistically significant. Start with structured buyer interviews, coding of sales questions, and conversation reviews. Run formal A/B comparisons only after obtaining sufficient samples, and record concurrent channel and product changes.

Stopping conditions include unconfirmed supply authorization, delivery costs exceeding plausible benefits, customer use cases beyond technical or compliance capabilities, pilots whose results cannot be reproduced, and channels that continually bring product-mismatched traffic. Timely stopping preserves cash and credibility.

Every experiment should produce a clear decision—continue, modify, or stop—with evidence. Record redesigns that did not help so the next round avoids the same error. Website iteration means changing content or process to address an identified problem, not repeatedly changing headlines.

<!-- pagebreak -->

<a id="page-30"></a>

## Page 30 | English public messaging and communication templates

**Homepage proposition:** Evaluate Chinese AI applications and hardware for your business. Explore practical use cases, check the evidence, and share your requirements with CNPS.AI.

**Primary CTA:** Discuss your project. **Procurement CTA:** Request a bulk quotation. **Research CTA:** Explore the resource center.

**Inquiry reply draft:** Thank you for sharing your project. To assess the fit, please confirm your destination country, intended use, pilot quantity or number of users, and target timeline. We will use these details to clarify suitable options, the proposed evaluation scope, and the information needed for a quotation.

**X post draft:** Buying an AI device for a team? Check the subscription, export options, account ownership and support process before comparing the hardware price. We have prepared a buyer checklist at CNPS.AI. Use it to define your pilot before requesting a bulk quote.

**Evidence statement:** These are independently researched industry references. Product availability, commercial terms and implementation scope are confirmed during the quotation process. A reference to a vendor does not imply a partnership with CNPS.AI.

Public messaging should focus on use, evidence, and the next step. Formal replies must not promise unconfirmed lead times, prices, or service levels. Actual publication of posts and outreach drafts should be arranged by the account owner at execution time.

<!-- pagebreak -->

<a id="page-31"></a>

## Page 31 | Evidence directory and research boundaries

| ID | Source and use | Evidence category |
|---|---|---|
| G01 | [Dify](https://github.com/langgenius/dify) and [LICENSE](https://github.com/langgenius/dify/blob/main/LICENSE) | Workflow capabilities and licensing |
| G02 | [Qwen3](https://github.com/QwenLM/Qwen3) | Model deployment materials |
| G03 | [DeepSeek-R1](https://github.com/deepseek-ai/DeepSeek-R1) | Models and usage recommendations |
| G04 | [RAGFlow](https://github.com/infiniflow/ragflow) | Document-retrieval technology |
| G05 | [XiaoZhi ESP32](https://github.com/78/xiaozhi-esp32) | Voice-firmware reference |
| G06 | [Seeed Wiki](https://github.com/Seeed-Studio/wiki-documents) | Engineering-documentation system |
| G07 | [Unitree SDK2](https://github.com/unitreerobotics/unitree_sdk2) | Robotics development interfaces |
| G08 | [xArm SDK](https://github.com/xArm-Developer/xArm-Python-SDK) | Robotic-arm integration interfaces |
| X01 | [Qwen official post](https://x.com/Alibaba_Qwen/status/1955782109702078559) | Official distribution signal |
| X02 | [Seeed official post](https://x.com/seeedstudio/status/2004492392658035139) | Demonstration signal |
| X03 | [Japanese Dify user discussion](https://x.com/yugen_matuni/status/1900815012652085400) | User-demand signal |
| X04 | [DeepSeek / Arena](https://x.com/ml_angelopoulos/status/1881419890940338288) | International evaluation-distribution signal |
| X05 | [Unitree publicity in Poland](https://x.com/sz_mediagroup/status/2044007763345584334) | Media-publicity signal |
| C01 | [Dify Kakaku case](https://dify.ai/ja/blog/kakaku-accelerates-ai-adoption-with-dify-fast-secure-and-scalable) | Vendor-published named case |
| C02 | [Seeed partner program](https://www.seeedstudio.com/blog/2022/04/22/edge-ai-partner-program-accelerate-your-next-gen-ai-product-deliver-ai-solutions-across-industries-together/) | Business-model reference |
| C03 | [Seeed case collection](https://edgeai.pny.eu/wp-content/uploads/2024/03/Seeed-Studio-succes-stories-pny-webonly.pdf) | Vendor case material |
| C04 | [Seeed customization services](https://www.seeed.cc/jetson-odm) | Engineering-delivery process |
| R01 | [EU AI Act](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) | Official rules entry point |
| R02 | [FCC](https://opendata.fcc.gov/Engineering-Technology/EAS-Equipment-Authorization-Grantee-Registrations/3b3k-34jp) | Official equipment-authorization materials |

Research date: 2026-09-03. X research uses publicly indexable pages and cannot cover all posts, replies, or deleted content. GitHub materials validate technical pathways; stars, views, funding, and demonstration videos have not been converted into sales estimates. Market and performance claims from sources are used only within their original scope.

### Research judgments and excluded material

This research found leads through public searches, then checked them against official GitHub repositories, original vendor materials, or official regulatory pages. Publication dates and search dates are recorded separately. Older cases may explain lasting business mechanisms but do not establish current prices or product status. Qwen3 and DeepSeek-R1 are verified case subjects here, not claims about the latest models as of the research date.

Excluded evidence includes X's autogenerated trend summaries, robotics revenue and margin posts not traced to original documents, performance comparisons without test conditions, and CNPS authorization relationships that cannot currently be confirmed. Public crawling initially interpreted the main site as the store; direct HTTP requests and the actual page subsequently confirmed a normal product-site response. The report relies on that direct confirmation.

Cited content is used only for brief summaries and analysis, not full republication of articles, documentation, or vendor images. External brands and links identify sources, not partnerships or endorsements. Upstream licenses apply only to the relevant code and materials and grant CNPS no additional rights in original content.

Additional rules sources: [CE marking](https://europa.eu/youreurope/business/product-rules-compliance/general-product-compliance/ce-marking/index_en.htm), [data-protection explanation](https://commission.europa.eu/law/law-topic/data-protection/data-protection-explained_en), and [current AI Act explanation](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai). Recheck official rules at contract time for each project, especially to avoid relying on changed schedules.

<!-- pagebreak -->

<a id="page-32"></a>

## Page 32 | Decision checklist, publishing, and maintenance

Before launch, confirm: English resources and cases can be read independently; case sources and limitations are clear; public contact details are real; inquiry-button behavior matches its wording; Markdown can be downloaded; mobile use works; existing product and store entry points remain accessible; and new pages expose no customer information or keys.

Before business operations begin, confirm initial products and destination markets, deliverable service packages, supplier documents, sample and engineering budgets, sales ownership, pilot acceptance templates, contracts, and after-sales arrangements. Put unconfirmed items into internal tasks rather than filling website gaps with fabricated claims.

### Assumption ledger and responsibility allocation

| To be confirmed | Why it affects orders | Recommended owner role | Website wording before confirmation |
|---|---|---|---|
| Brand supply and authorization scope | Whether products and brand materials may lawfully be supplied and used | Supply owner | Reference products; supply confirmed during quotation |
| Team-account and subscription capabilities | Whether team use can be sustained | Product owner | Check each model; do not guarantee enterprise features |
| Implementation partners and hours | Whether delivery within scope is feasible | Technical owner | Discuss the assessment scope |
| Destination-country support and repairs | How device problems are handled | Delivery owner | Confirm support arrangements in writing |
| First response and opportunity tracking | Whether content traffic becomes opportunities | Sales owner | Use the existing sales email |
| Sample and cash limits | Avoid an order creating a funding gap | Finance / business owner | Publish no unconfirmed prices or lead times |

These roles have not been assigned to named people in this task. Content publication can be completed first, but quotations, sample orders, contracts, and operational launch still require actual accountable people. All planning budgets and metrics retain their assumption labels.

The minimum set of public facts comprises the existing website, product catalog, store, contact details, and industry materials that can be checked through links. Without evidence, do not promote CNPS customer performance, number of authorized brands, inventory scale, or overseas service capabilities.

Recommended maintenance cadence: review inquiries and page feedback weekly, update sources and versions monthly, and review categories and partners quarterly. If a source disappears, preserve the prior record, mark it for rechecking, and review conclusions that depend on it.

The execution sequence is to validate demand and fulfillment capabilities, then expand content, channels, and categories. The lasting assets to build are verifiable resources, repeatable acceptance methods, reliable partnerships, and delivery experience that earns repeat purchases.
