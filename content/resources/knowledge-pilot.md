# Scope a document-grounded AI assistant

For IT leaders and service providers evaluating a knowledge or support workflow. Start with a single task and a named business owner.

## Prepare the inputs

Provide authorized sample documents, their owners, versions and intended audiences. Include the languages, expected number of users, hosting requirements and existing identity system. Identify stale documents and contradictory versions before ingestion.

Create a test set before tuning. An example design is 100 questions: 50 routine factual questions, 20 comparisons across documents, 15 questions without enough evidence and 15 questions that test access restrictions. These counts are a proposed method, not a measured result.

## Define acceptance

| Measure | Method |
|---|---|
| Correctness | A business reviewer compares the answer with a reference |
| Citation support | The cited passage actually supports the statement |
| Refusal | Unsupported questions produce an appropriate refusal |
| Permissions | Users cannot retrieve documents outside their access |
| Latency | Record a percentile under agreed concurrent use |
| Cost | Include hosting, inference, ingestion, support and human review |

Use separate tuning and holdout questions. Keep failures and do not replace difficult questions after seeing the results. Agree on thresholds with the customer before the test.

## Plan the operating model

Document who updates content, approves access, reviews incorrect answers and handles model changes. Map every external model or speech call; a self-hosted application may still send data to a third-party service.

[Dify](https://github.com/langgenius/dify), [RAGFlow](https://github.com/infiniflow/ragflow), [Qwen3](https://github.com/QwenLM/Qwen3) and [DeepSeek-R1](https://github.com/deepseek-ai/DeepSeek-R1) are research starting points. Check the exact release and license. Dify includes additional conditions; model variants and hosted services can have different terms.

For a method compare of FastGPT-shaped workflows and ChatGPT company knowledge — permissions, citations and review, not a model score — see [FastGPT vs ChatGPT for permissioned enterprise knowledge](/fastgpt/compare/fastgpt-vs-chatgpt-enterprise).

## What to share with CNPS

Describe the business task, document types, countries, languages, users, data constraints and target date. Begin with non-sensitive information. Implementation capabilities and commercial scope are agreed separately.

[Discuss a knowledge assistant evaluation](/request-quote?solution=knowledge-assistants)
