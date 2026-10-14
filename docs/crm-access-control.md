# CRM 私有入口、协作权限与方案迁移

## 行为与边界

`crm.cnps.ai` 为唯一私有业务域名。根路径进入登录/个人工作台；`/w` 与工作台使用同一 CRM 短信会话，方案授权独立于公司成员资格。官网 `/w` 和已知附件的 GET/HEAD 使用 307 迁移；旧 POST 返回 410，不转发验证码、Cookie 或请求体。重定向丢弃查询参数，防止旧链接携带凭据。`/api/w` 等直连入口也检查 Host；官网与部署别名不能提供私有响应。CRM 域名拒绝官网内容和公开询盘接口。预览私有入口默认全部关闭，不能用生产凭据模拟登录。

路由中间件负责域名入口，API handler 再次检查，业务服务核验实际资源权限。Origin 仅允许 CRM；不信任 X-Forwarded-Host、请求身份/角色或 URL 中的资源归属。每个接口继续执行 no-store/noindex、CSP、禁止嵌入及 MIME 防嗅探策略。

客户会话维持最新产品设置：固定 30 天，Cookie 为 Lax，允许从微信/邮件链接返回；所有写请求仍需同源 Origin 和专用请求头。管理员、经理、伙伴和方案受邀人固定 8 小时、Strict。挑战五分钟、共享短信额度不变。既有八小时会话不自动延长。禁用身份会提高 `identityVersion`；重新启用后旧会话仍无效。原有客户/经理 `authEpoch` 机制继续生效。

## 授权模型

- 现有客户公司/联系人/经理授权保持不变，不重建 Twenty 数据或移动联系人。
- `partnerOrganizations`：管理员显式登记的真实 Twenty 伙伴公司。经理仅从该目录选择联系人，不得枚举任意客户组织。
- `partnerGrants`：真实联系人 HMAC、伙伴组织、客户公司、单个项目、明确任务/资料 ID、操作、有效期、授权人、版本。每次访问复核原生联系人状态、手机号身份、原组织和客户公司。任务进展按 grant 隔离；伙伴不能看到其他伙伴、客户名单、预算、内部事项、历史决定或原生对象地址。
- `proposalGrants`：独立的方案及附件操作授权，不产生公司/项目成员。新增授权默认只查看，下载明确指定附件。
- `identities`：管理员停用/恢复身份及版本；不删除历史授权。
- `sensitiveRequests`：经理提出资料版本访问申请，只有管理员可批准/拒绝/撤销。批准绑定 grant 版本和当前文件版本，文件换版后不得复用旧批准。
- 客户新授权默认 selected + view；下载独立勾选，all 范围必须 `includeFuture:true`。既有无 operations 字段的授权兼容旧下载规则，不扩张项目或资料范围。
- 普通协作资料须由管理员标记 `collaboration`；未分类默认为 internal。internal/commercial 文件给伙伴访问均需管理员批准。客户发布与伙伴授权相互独立。
- 同一身份通过 `contextId` 选择 member/partner 范围；服务端重新核验，不能通过上下文选择提权，伙伴上下文不进入内部管理分支。首期伙伴不开放 AI、审批和导出。

## 新接口

沿用 `/api/crm` 与 `/api/crm-workspace`。会话返回授权 contexts、独立 proposals、验证时间与绝对到期时间；内部 revocation generation 不返回客户端。业务 GET/POST 可带 contextId，其余输入仍按服务端真实 company/project/document ID 解析。

GET views：

| view | 参数与限制 |
|---|---|
| accessGrants | companyId 可选；经理限自己公司，管理员可看方案及停用身份 |
| partnerOrganizations | companyId；只返回已登记伙伴组织的最小联系人资料 |
| sensitiveRequests | companyId；公司管理人员 |
| partnerSubmissions | companyId、projectId；内部管理人员看项目提交，伙伴仅看自己的提交 |
| submissionDownload | companyId、submissionId；仅内部审阅，读取后再次核验权限 |

POST actions：

| action | 参数 |
|---|---|
| registerPartnerOrganization | organizationId；管理员 |
| grantPartner | companyId，fields:{contactId,projectId,taskIds,documentIds,operations,expiresAt?} |
| revokePartner | companyId、grantId |
| grantProposal | fields:{phone,proposalId,assetIds,operations,expiresAt?}；管理员，仅支持现有 wasion-web-v1 |
| revokeProposal | grantId；管理员 |
| setIdentityStatus | identityId、disabled；管理员，不允许停用自己 |
| setDocumentClassification | companyId、documentId、classification；管理员 |
| requestSensitiveAccess | companyId，fields:{grantId,documentId,reason} |
| decideSensitiveAccess | companyId、requestId、decision:approve/reject/revoke；管理员 |
| partnerUpdateProgress | companyId、taskId，fields:{status,comment?}；明确 progress 权限 |
| submitPartnerDelivery | companyId，fields:{title,filename,mimeType,base64}；明确 submit 权限 |
| reviewPartnerSubmission | companyId、submissionId，fields:{decision:approve/reject,comment?} |

伙伴提交最多 3 MiB，沿用资料 MIME 白名单和私有文件网关。上传后复核授权及公司 revision。审核通过时在同一次公司 CAS 中形成新的内部草稿及审核结果；重复审核冲突，不覆盖正式资料或自动发布。文件发布和后续客户/伙伴授权仍是独立操作。猜 ID/无权为 404，未登录为 401，并发冲突为 409，依赖不可用为 503。

## 数据迁移与恢复

`node scripts/crm-access-migration.mjs --env=/受控生产配置 --env=/受控方案配置 --output=/受控备份目录` 默认演练；加 `--apply` 才写目录。脚本：

1. 导出 business 与独立 audit namespace，使用原方案密钥 AES-GCM 加密、0600 保存，读回解密验证，并验证方案包恢复密钥匹配。
2. 将旧方案名单与现行项目、发布版本、客户资料范围求交集。只创建独立方案授权，不增加公司成员或经理；无法匹配者不迁入。
3. 迁入授权标记 legacyRestricted。在线仍核验当前生产白名单与原生联系人、现有公司/项目/资料权限；本地名单过期也不能扩大线上内容权限。
4. 使用目录 revision CAS 一次提交；保存迁移版本，重复运行不重建已撤销授权；提交后完整读回比较。

迁移只新增目录字段及事件，不修改原方案密文、Twenty、原项目、原授权、撤权历史或密钥。管理员后续显式重新授予独立方案权限时才移除该授权的 legacy 限制。

访问事件独立写入 `cnps:crm:audit:v1:event:<时间>:<UUID>`，避免页面并行读取触发权限目录 CAS 冲突；记录 HMAC 主体、动作、公司及结果，不记录验证码、Cookie、模型提示或正文。拒绝事件另输出固定状态监控日志。授权、发布和审核事件仍在原目录/公司 CAS 中。迁移工具及香港定时加密备份均覆盖 business/inquiry/audit namespace；备份按固定审计时间水位分批读取，验证事件 schema，隔离恢复后读回比对。参见 `ops/crm-backup/`。

## 发布与验收

先验证演练与备份，再应用幂等迁移，最后通过 PR 合并 main 触发 Vercel Git 发布。禁止 feature branch 手动生产部署。发布后逐项验证官网跳转、旧 POST 410、别名与直连 API 404、匿名内容/附件不可读、官网公开路径可用，以及真实短信登录/同会话方案/下载/退出。登录与下载的用户设备接收需实际浏览器验收；离线 mock 不作已完成声明。

`npm test` 包含跨公司/跨项目、字段白名单、伙伴进展/提交审核、敏感批准换版撤回、上传/下载中撤权、多上下文、会话版本、方案独立授权、迁移幂等及页面交互测试。手机 390px 及桌面浏览器在隔离 fixture 上检查控制可见性与溢出；fixture 不部署。

出现问题时保持默认拒绝，可关闭新授权/入口；不得恢复旧目录快照或旧白名单来绕过现行撤权。307 在确认迁移稳定后再单独改为永久跳转。

## 规范访问地址

CRM 域名已经表达业务边界，因此页面不再重复 `/crm` 前缀。登录入口为 `https://crm.cnps.ai/`，工作台为 `/workspace`，独立方案仍为 `/w`，演示仍为 `/demo/wasion`。通知模板、交付链接、方案退出、页头导航及登录回跳统一生成规范地址。`/api/crm` 和 `/api/crm-workspace` 保留既有接口协议。

旧 `/crm`、`/crm/`、`/crm/workspace` 及尾斜线入口的 GET/HEAD 使用 308 规范化；保留经校验的公司、项目、交付和身份上下文，丢弃其他查询参数。历史 returnTo 中的旧工作台路径同样规范化，禁止外部地址和登录循环。旧入口 POST 返回 410，不转发请求体。官网工作台链接只跳转到 CRM；预览、别名和 handler 均执行同一边界。官网根路径仅在官网域名跳转 `/en`，CRM 根路径直接显示登录或重定向至已授权工作台。

## Response delivery checks (2026-10-14)

File responses reload the session and authorize the resource after preparation audits, immediately before sending bytes. This covers downloads, pending submissions, proposal assets and HEAD. JSON reads and AI results compare directory/company revisions after auditing and discard stale results with 409. Legacy overlapping grants cannot elevate a customer context.

Prepared-file events do not claim delivery. Only response finish records a completed response with resource/version IDs; early disconnects do not. The handler waits for durable auditing before completing. Historical response evidence remains valid after later revocation. Audit failures emit a fixed monitoring signal. No file bodies, Cookies or OTPs are logged. Backup schema accepts the fixed resource fields and hyphenated action names.
