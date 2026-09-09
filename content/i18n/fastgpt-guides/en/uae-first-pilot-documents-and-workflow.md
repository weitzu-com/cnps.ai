# Pick documents and one workflow for a UAE FastGPT first pilot

Name one owner, one approved corpus, one workflow, and a hard-question set before any FastGPT build; measure checked answers, not first drafts.

A UAE first pilot is a bounded knowledge-assistant evaluation: one team, one document family you may use, one task that already costs time, and a written pass rule. CNPS scopes FastGPT as a [partner](/fastgpt). This page does not invent benchmarks. FastGPT-published case percentages on this site are vendor-published; CNPS has not independently audited them. There is no checkout on this site. Use the [knowledge-pilot worksheet](/resources/knowledge-pilot) for the general method; this page names the UAE pack — documents plus one measurable workflow.

## What “one measurable workflow” means

A workflow is measurable when you can name the owner, the input, the output a person will review, and the pass rule. “We will try FastGPT on company knowledge” is not a workflow. “The Dubai after-sales lead uses the approved product manual, revision B, and a reviewer checks the cited passage before use” is.

Write four lines before ingest or model choice:

1. **Owner** — the person who freezes the corpus, accepts the test set, and decides what happens when the answer is thin.
2. **Input** — the document set and the request that arrives today (a lookup, a ticket, an RFQ).
3. **Reviewed output** — the artifact a colleague will use: a cited answer, a handoff packet, or a brief with missing fields flagged.
4. **Pass rule** — what must be true of that reviewed output, including what must be refused.

If two departments want two tasks, run two pilots later. Extra systems that only make a demo look complete are a fail. Hosting, model endpoints and identity belong in the written proposal after this pack is frozen.

## Document set rules

The corpus is the product. A fluent answer from the wrong file is still a miss.

**Approved.** Every file has a person who says it may be used. Personal drives, unnamed folders, exported mail and chat dumps stay out. Legal, HR, privileged or customer-identifying material is out of a first inquiry and a first ingest. Send CNPS non-confidential examples only.

**Versioned.** Name the current revision. Retrieving last year’s manual as if it were revision B is a fail even when the sentence is well written. If English and Arabic copies both exist, freeze the approved language version first. Unaligned translations are a later project.

**Permissioned.** Record who may ask, who may see citations, and what a share link reveals. Never widen access so the demo can answer a question the asker should not see — refuse or hand off. Treat a share link as access. Stale accounts and contractor logins are on the access list or they are out of the test.

Before ingest, list contradictions and stale copies; keep those findings. FastGPT dataset and app roles can express use, edit and manage; the proposal maps that to your identity system. This is a method page, not a security certification.

## Three starter workflows with pass rules

Pick one. All three match how CNPS scopes FastGPT work on the hub. UAE and Gulf settings are examples, not customer claims.

### Manual lookup

A Dubai or Abu Dhabi operations, facilities or after-sales team hunts an approved manual, SOP or service note. The request is a factual question the current revision should answer.

**Pass.** The reviewed answer cites a passage the reviewer can open; that passage supports the sentence; a missing fact becomes a prompt to a person, not a fluent guess; a stale revision is a miss. **Fail.** The model answers from general knowledge, cites a nearby file that does not contain the claim, or the asker retrieves a document outside their access list.

See [Find answers in technical documents](/fastgpt/solutions/technical-knowledge).

### Support handoff

A UAE office IT desk or a Gulf distributor queue handles routine questions from an approved FAQ and sends the rest to a person. The output is a cited reply or a ticket draft with what is known, what is missing, and why it needs a human.

**Pass.** Routine items have a supporting citation; exceptions produce a handoff packet a colleague can act on; account, safety and commercial commitments stay with authorized staff; access is not expanded for the demo. **Fail.** The assistant invents a policy, skips the handoff, or shows a contractor a collection they should not open.

See [Route support requests with context](/fastgpt/solutions/support-triage).

### RFQ brief

Sales receives inquiries from UAE or KSA buyers — often English RFQs against a China product line — and spends the first pass extracting part numbers, quantities, destination and gaps. The output is a reviewable brief, not a priced offer.

**Pass.** Required fields are extracted or flagged missing; matches use only approved product data; a person confirms price, substitutes, availability and delivery; no commercial number is invented. **Fail.** The brief fills gaps from model memory, treats a similar part as the requested part, or is sent to the buyer before review.

See [Turn RFQs into reviewable briefs](/fastgpt/solutions/rfq-intake). Do not start with all three.

## Hard-question set

Write the questions before you tune. Keep the difficult items. The [knowledge-pilot](/resources/knowledge-pilot) worksheet proposes routine facts, comparisons, missing evidence and access tests — a method, not a measured UAE result. Include all four kinds:

**Routine.** Facts the approved corpus should answer in the language you froze — a step in a Dubai site SOP, a warranty line in the approved FAQ, or a field on a sample RFQ.

**Comparison.** Two approved sources a person would read together: revision A versus revision B, English policy versus an approved Arabic customer note, or two similar product families on an RFQ.

**Missing evidence.** Questions the corpus does not contain. The pass is a refusal or a prompt to a person. A confident paragraph without a supporting chunk is a fail.

**Access tests.** Questions whose best document the asker should not see. The pass is a denial or a handoff, not a broader share. Include a share-link case if anyone will open the app through a link.

Do not replace a question because it failed. Failures are the evaluation.

## Measures

Score the checked answer, not the first draft. Agree sample size, baseline and thresholds with the owner before you start. No outcome is guaranteed.

- **Correctness under review** — a person compares the answer with the approved source and the cited passage. Unsupported claims count as misses even when they sound right.
- **Review minutes** — time to accept, edit or escalate, including click-through to the chunk. A fast wrong draft that needs a long edit is not a saving.
- **Access incidents** — any retrieval, citation or share outside the named audience, including a link that leaked a fragment.
- **Cost drivers** — hosting or SaaS seats, model usage, ingestion, and the people who review. List them; do not invent a unit cost.

These measures decide whether the workflow earned a wider rollout. They are not a FastGPT-versus-ChatGPT score, and not a reproduction of vendor case metrics.

## When to stay on ChatGPT company knowledge instead

This is not “always FastGPT.” If the useful answer should follow each user’s existing permissions across connected workplace apps, and your team already works in ChatGPT Business, Enterprise or Edu, start there. Review can be a person reading a sourced chat before they act. Exploring what the organisation already knows is different from certifying one approved manual.

Stay on ChatGPT company knowledge when you cannot yet name a bounded corpus, an owner and a pass rule — or when bounding would mean copying files into a wider share for a demo. Scope a FastGPT-shaped pilot when you can freeze an approved document set, need explicit dataset and app permissions (including what a share link may reveal), and want reviewers to click through to the cited chunk with missing evidence treated as a handoff.

Read the method compare — permissions, citations and review, not a model score: [FastGPT vs ChatGPT for permissioned enterprise knowledge](/fastgpt/compare/fastgpt-vs-chatgpt-enterprise).

## FAQ

**Is this a model benchmark or a FastGPT win-rate?** No. We do not publish — or invent — accuracy, latency or win-rate numbers.

**Do FastGPT case percentages on this site apply to our UAE pilot?** No. Those figures are published by FastGPT. CNPS has not independently audited them and does not promise the same outcome.

**Can we ingest the whole tenant on week one?** No. Start with one approved, versioned, permissioned set. Extra libraries wait until the pass rule holds.

**We have English and Arabic files. Must the first corpus be bilingual?** Not for the first pilot. Freeze the approved language version. Unaligned translations are a later scope.

**Does this page sell a FastGPT license or take payment?** No. This site has no checkout. Licensing, model usage and implementation are identified in a written proposal where applicable.

**What should we bring to CNPS?** The owner, the corpus list (titles, revisions, audiences), the one workflow, the hard-question set, and non-confidential examples. Do not send credentials or production customer data.

## Plan a pilot

If you can name the owner, the approved corpus, the one workflow and the hard-question set, start from the [FastGPT hub](/fastgpt) and [plan a pilot](/fastgpt/contact). Tell us the task, the systems involved, and what a useful reviewed result looks like.

[Plan a pilot](/fastgpt/contact) · [sales@cnps.ai](mailto:sales@cnps.ai) · [Request a quotation](/request-quote?solution=knowledge-assistants)

CNPS is a FastGPT partner. Licensing and implementation are defined in your written proposal. Reference cases are published by FastGPT; CNPS has not independently audited them.

[FastGPT](https://fastgpt.io/) · [GitHub](https://github.com/labring/FastGPT)
