# Scope a document-grounded AI assistant

For IT leaders and service providers evaluating a knowledge or support workflow. Start with a single task and a named business owner.

## Knowledge pilot method glance

Five checks turn this hub into a transferable knowledge-assistant pilot before you tune models or expand the corpus (checked 27 October 2026).

1. **Permissions** — Authorized sample documents with owners, versions and audiences; identity system and access-restriction questions in the eval set.
2. **Citations** — Answers must point to source documents; keep failures on the holdout set instead of swapping hard questions after results appear.
3. **Human review** — Name who reviews incorrect answers, approves access and handles model changes; map every external model or speech call.
4. **Eval set** — Build a fixed test set before tuning (example method: 100 questions across routine facts, comparisons, insufficient evidence and access limits — counts are a proposed method, not a measured result).
5. **Acceptance** — Separate tuning and holdout questions; agree thresholds with the customer before the test; document the operating model.

![Knowledge pilot method glance: five checks — permissions, citations, human review, eval set, acceptance](/assets/resources/knowledge-pilot-method-glance.webp)

## Prepare the inputs

Provide authorized sample documents, their owners, versions and intended audiences. Include the languages, expected number of users, hosting requirements and existing identity system. Identify stale documents and contradictory versions before ingestion.

Create a test set before tuning. An example design is 100 questions: 50 routine factual questions, 20 comparisons across documents, 15 questions without enough evidence and 15 questions that test access restrictions. These counts are a proposed method, not a measured result.

## Define acceptance

Use separate tuning and holdout questions. Keep failures and do not replace difficult questions after seeing the results. Agree on thresholds with the customer before the test.

## Plan the operating model

Document who updates content, approves access, reviews incorrect answers and handles model changes. Map every external model or speech call; a self-hosted application may still send data to a third-party service.

[Dify](https://github.com/langgenius/dify), [RAGFlow](https://github.com/infiniflow/ragflow), [Qwen3](https://github.com/QwenLM/Qwen3) and [DeepSeek-R1](https://github.com/deepseek-ai/DeepSeek-R1) are research starting points. Check the exact release and license. Dify includes additional conditions; model variants and hosted services can have different terms.

For a method compare of FastGPT-shaped workflows and ChatGPT company knowledge — permissions, citations and review, not a model score — see [FastGPT vs ChatGPT for permissioned enterprise knowledge](/fastgpt/compare/fastgpt-vs-chatgpt-enterprise). For a UAE first-pilot pack — one approved corpus, one measurable workflow, and a hard-question set — see [Pick documents and one workflow for a UAE FastGPT first pilot](/fastgpt/guides/uae-first-pilot-documents-and-workflow).

## What to share with CNPS

Describe the business task, document types, countries, languages, users, data constraints and target date. Begin with non-sensitive information. Implementation capabilities and commercial scope are agreed separately.

[Request a quotation for devices or a pilot.](/request-quote?solution=knowledge-assistants)
