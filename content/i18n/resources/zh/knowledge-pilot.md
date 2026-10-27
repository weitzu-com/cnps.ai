# 定义基于文档的 AI 助手

适用于评估知识或支持流程的 IT 负责人和服务商。从单一任务及明确的业务负责人开始。

## 知识试点方法速览

在调优模型或扩大语料前，用五项核对把本枢纽转成可移交的知识助手试点清单（2026 年 10 月 27 日复核）。

1. **权限** — 已授权示例文档（负责人、版本、读者）；身份系统；评估题集中的访问限制题。
2. **引用** — 答案须指向源文档；保留留出测试失败，不要在看到结果后替换难题。
3. **人工复核** — 明确谁审核错误答案、批准访问、处理模型变化；梳理每个外部模型或语音调用。
4. **评估题集** — 调优前建立固定测试题集（示例方法：100 题，覆盖日常事实、跨文档比较、证据不足与权限限制——数量是建议方法，不是测量结果）。
5. **验收** — 调优题与留出测试题分开；测试前与客户约定阈值；记录运营方式。

![知识试点方法速览：五项核对 — 权限、引用、人工复核、评估题集、验收](/assets/resources/knowledge-pilot-method-glance.webp)

## 准备输入

提供已授权的示例文档，以及文档负责人、版本和目标读者。说明语言、预计用户人数、部署要求与现有身份系统。在导入前识别过时文档与相互矛盾的版本。

调优前建立测试题集。例如可设计 100 个问题：50 个日常事实问题、20 个跨文档比较问题、15 个证据不足的问题，以及 15 个权限限制测试问题。这些数量是建议方法，不是测量结果。

## 定义验收

将调优题与留出测试题分开。保留失败结果，不要在看到结果后替换难题。测试前与客户约定阈值。

## 规划运营方式

记录由谁更新内容、批准访问、审核错误答案以及处理模型变化。梳理每个外部模型或语音调用：应用自托管也可能向第三方服务发送数据。

[Dify](https://github.com/langgenius/dify)、[RAGFlow](https://github.com/infiniflow/ragflow)、[Qwen3](https://github.com/QwenLM/Qwen3) 与 [DeepSeek-R1](https://github.com/deepseek-ai/DeepSeek-R1) 可作为研究起点。检查确切版本和许可。Dify 有附加条件；不同模型变体和托管服务可能采用不同条款。

若要按方法比较 FastGPT 形态的流程与 ChatGPT 公司知识（权限、引用与审核，而不是模型分数），请阅读英文页 [FastGPT vs ChatGPT for permissioned enterprise knowledge](/en/fastgpt/compare/fastgpt-vs-chatgpt-enterprise)。若要选择一套获准语料、一项可测量流程和一组难题作为阿联酋首次试点，请阅读英文页 [Pick documents and one workflow for a UAE FastGPT first pilot](/en/fastgpt/guides/uae-first-pilot-documents-and-workflow)。

## 向 CNPS 提供哪些信息

描述业务任务、文档类型、国家、语言、用户、数据限制和目标日期。从非敏感信息开始，实施能力与商业范围另行约定。

[为设备或试点索取报价。](/request-quote?solution=knowledge-assistants)
