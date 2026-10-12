# CRM 公司权限目录与 PMP 客户工作台业务层

## 当前交付边界

本目录提供服务端权限目录、PMP 服务、HTTP handler 及 mock/Redis 调用协议测试。已通过统一 `crm-runtime.mjs` 连接 Twenty v2.46.0 的真实 REST API、短信认证和 HTTPS 私有资料网关。公司的联系人保存于香港 PostgreSQL，PMP 与权限目录保存于现有 Upstash；文件保存于香港加密卷。发布状态以生产部署验收为准。

Twenty 继续作为公司和联系人的数据源；此模块不重写 CRM 核心，也不启用 Twenty 付费的原生记录级权限功能。管理员/销售经理的门户 API 包装原生 Twenty CRUD，客户不直接访问 Twenty API。Native API URL、密钥只能从服务器环境变量 `TWENTY_API_URL`、`TWENTY_API_KEY` 加载，不能写入 UI、公开源码、日志或响应。

## 服务组合

```js
const store = createBusinessStore(process.env);
const service = createBusinessService({
  env: process.env, store,
  twenty: createTwentyAdapter(process.env), // 已对齐固定版本真实 REST schema
  documents: createDocumentsAdapter(process.env) // HTTPS 服务间凭据和强制公司/项目上下文
});
const auth = createCrmAuthHandler({
  env: process.env,
  storeFactory: createCrmStore,
  smsFactory: createCrmSms,
  loadMemberships: phone => service.loadMemberships(phone)
});
export default createBusinessHandler({ env: process.env, authHandler: auth, service });
```

短信 `/api/crm` 与业务 `/api/crm-workspace` 应使用同一认证配置/成员 loader。既有短信入口不能另建互不相干的成员名单。超管仅来自服务器 `CNPS_CRM_ADMIN_PHONE`；业务 handler 只信任 `auth.loadSession(req)`，不接受请求体中的身份或角色。

## 私有权限目录

- Redis namespace：`cnps:crm:business:v1:`。目录与公司 PMP 数据不设置 TTL；显式撤权及客户归属历史必须持久保存。Upstash 使用现有服务器凭据。Redis 不存手机号或邮箱，身份标识使用同一 `CNPS_PROPOSAL_SECRET` 的 `phone` HMAC。
- `directory.companies`：只登记实际存在的 Twenty 公司。公司 ID 和原生 ID 相同且不可更改。管理员新建原生公司时可以明确登记为门户公司；公开询盘只应创建原生未授权 lead，不能调用租户登记/成员授权。
- `managerAssignments`：仅超管能将原生已确认员工身份分配给指定公司。更新会增加版本；停用或移除公司后立即失去该公司权限。经理不能在门户授权另一个经理或管理员。
- `memberGrants`：原生联系人必须属于该公司、拥有可登录的有效中国手机号身份。客户 HMAC 身份第一次绑定后，所属公司不可修改；撤权也保留该归属。禁止同一身份同时作为客户和跨公司经理。
- 客户 scope：`projectScope` / `documentScope` 为 `all` 或 `selected`，另有 ID 列表和 `allowApprovals`。客户只看所在公司、允许的项目、已发布项目快照、公开事项和当前发布资料版本。
- 每次认证查询均重新读目录，并向 Twenty 复核联系人当前公司与手机号身份。直接在 Twenty 改公司/手机号后，旧授权不能继续用。门户修改已授权手机前先撤销旧身份；失败可重试，但不会保留旧手机号权限。
- PMP 写入使用 Lua CAS 同时比较目录 revision 与公司 revision。与撤权并发的旧权限写入返回 409，不提交部分数据。授权目录写入同样 CAS；客户端需要刷新后重试。

## Native adapter 合同

所有 adapter 都仅在服务器运行。调用失败不得打印 Token、邮箱、手机号或原始供应商诊断。

| 方法 | 合同 |
|---|---|
| `getCompany(id)` | 返回 `{id,name}`；不存在返回空。必须为真实原生公司 ID。 |
| `listCompanies()` | 返回原生公司数组。管理员看到原生名称/ID与 `registered` 标记；经理和客户仅看到自己的公司。 |
| `createCompany(fields)` | 支持 `name,domain`，返回真实已创建 `{id,name}`。只有超管包装接口可调用。 |
| `getContact(id)` | 返回 `{id,companyId,active,identityId?,name,firstName,lastName,email,phone,phoneCountryCode,jobTitle}`。 |
| `listContacts(companyId)` | 返回该公司全部联系人。业务层再次过滤 companyId；客户无权访问。邮箱-only 联系人可管理，`canLogin=false` 不可开通手机号权限。 |
| `createContact(companyId,fields)` | 创建原生联系人；强制所属公司为授权 companyId，不创建门户授权。 |
| `updateContact(companyId,id,fields)` | 原生更新必须校验现有联系人属于 companyId，不能修改其 companyId。 |
| `getManager(staffId)` | 返回明确受控的原生员工 `{id,identityId,active}`。不能从任意客户 email 后缀推断员工身份。 |

有效中国手机号的 `identityId` 使用 `service.subjectForPhone(normalizedPhone)`，与登录 HMAC 相同。邮箱-only、无有效中国手机号或已删除/停用联系人无可登录身份。公司、联系人和员工真实数据由 adapter 提供，本模块不包含种子客户。

原生 Twenty HTTP 操作与 Redis 权限修改无法构成单一跨系统事务：联系人电话变更采用先撤权再外部更新的安全顺序；原生 CRUD 在发送前及响应前校验经理权限。需要在 Native adapter 端记录/追踪实际创建请求，处理供应商超时后重复创建的情况。公司注册失败应使用已存在原生 ID 重新登记，不应盲目重建公司。

## 私有资料 adapter 合同

`getObject(objectId)` 返回 `{id,companyId,projectId,mimeType,size,filename}`；公司/项目归属由服务器存储元数据提供，不信任浏览器提供。`readObject(objectId,{companyId,projectId,documentId,versionId})` 返回 `Buffer`，并再次校验归属。`createObject({companyId,projectId,filename,mimeType,base64})` 上传私有文件并返回相同 canonical metadata；Bearer 密钥只由服务器 adapter 加载。

资料元数据保存多个不可改的版本。发布设置当前 active version；撤回后立即不可下载，旧版本 URL 不能绕过 active version。客户只得到文件名称、类型、大小、公开版本信息，不得到 objectId、私有对象 URL 或凭证。下载在文件 IO 后再次校验授权、项目发布与 active version。HTML 文件不支持，响应为附件并设置 no-store/nosniff。

上传接口 `uploadDocument` 已连接真实 HTTPS 私有资料 adapter。仅管理员和获分配公司的经理能上传 PDF/DOCX/PPTX/XLSX/PNG/JPEG/TXT/CSV，原文件上限 3 MiB；严格校验 canonical base64、文件名、类型和解码大小，再执行外部 IO。完成 IO 后复核原始权限及公司数据版本；并发撤权/修改返回 404/409，私有孤儿文件不会变成公开链接或已授权资料。新文件/新版本始终为草稿，显式 `publishDocument` 后客户才可看到。

经理资料列表返回最新版本、`status`、`activeVersionId` 和 `versions`，刷新后仍能查看草稿并执行发布/撤回；经理可下载其公司的未撤回草稿或归档版本用于审阅。客户只返回当前发布版本，不得到其他版本列表。UI 不得露出 objectId 输入框或供应商私有地址。文件 MIME 枚举通过 `PMP_DOCUMENT_MIME_TYPES` 导出，上传上限通过 `PMP_MAX_UPLOAD_BYTES` 导出。内部注册既有资料的元数据上限仍为 50 MiB，实际下载还必须遵守网关响应大小限制；继续经 Vercel Function 返回文件时，必须配置适合其限制的文件大小或服务器下载代理。

## PMP 对象与发布/审批

- 项目：目标、范围、交付物、计划开始/结束、预算/币种、状态与五个过程组 `initiating/planning/executing/monitoring_controlling/closing`。这些过程组可以交叉进行，不强制错误的单向线性切换。
- 事项类型：`task/milestone/risk/issue/change/acceptance`。通用字段 `title,description,status,clientVisible,owner,ownerId,dueDate`；任务有 `wbsCode,startDate,parentTaskId,dependencyIds`；风险有 0–5 `probability/impact,response`；问题有 `severity`；变更有 `reason,impact(文本),requestedScope,costImpact,scheduleImpactDays`；验收有 `criteria,deliverableDocumentIds`。
- 默认草稿不对客户展示。项目发布形成事项快照，只包括 `clientVisible=true`；后续修改草稿不覆盖客户正在看的已发布版本。取消发布会隐藏其全部客户内容，重新发布的版本号继续增长。
- WBS 引用必须属于同一项目；依赖/父子关系不能成环。批量修改先验证全部 ID，任何跨公司项都导致整体不提交。
- 变更和验收先为 `requested`，通过专用 `decide` 审批为 `approved/rejected`；不能用普通创建/修改字段跳过审批。变更获批后才可 `implemented`。
- 已决内容只可显式修订为 `draft/requested`，归档原内容、版本和决定，清空当前决定并重新审批。历史快照仅供后台，所有客户响应和发布快照均剔除。获批变更仅可单独标记实施；已实施内容不可再改。
- 客户审批需要成员 `approvals:submit` 权限、已发布可见的待审批事项、匹配的 `expectedVersion`，以及附属交付资料的访问权限。经理只能决定其获分配公司的事项。重复/过期决策不能成功。
- 项目 `completed` 需要至少一项通过的验收、全部验收通过、全部任务完成。仍须由项目负责人评估结项、成本和风险，本模块不会虚构合同或验收事实。
- 已结项项目不能创建、修改或审批事项；需要显式重新开启为 `active/planning`。项目说明及文件版本管理保持可用，不能借变更为售前或暂停状态绕开重开。
- 每次操作保存不含联系方式的 actor HMAC、动作、时间、资源与版本事件。当前公司状态与历史事件为一个 CAS JSON 聚合，适合初期规模；没有独立审计导出、全量历史数据库/分片或容灾演练，后续需明确归档与数据库扩展策略。

## HTTP 合同

路径 `/api/crm-workspace`。GET/HEAD 不缓存；POST 要求同源 Origin、`X-CNPS-CRM: 1`、JSON。认证在 body 读取之前；仅 `uploadDocument` body 上限为 4.3 MiB，其他 action 仍为 64 KiB。普通结果 `{ok:true,data:...}`，错误 `{error:'...'}`；猜测 ID 和无权限资源均为 404，未登录为 401，CAS 冲突为 409，未接通 adapter 为 503。

GET `view=companies` 无 companyId；其他读取包含 companyId：

| view | 额外参数 |
|---|---|
| `contacts/members/events/projects` | 无 |
| `project/records/documents` | `projectId`；records 可加 type |
| `record` | recordId |
| `document` | documentId |
| `download` | documentId、versionId；返回附件字节 |
| `search` | q；搜索过滤授权范围与发布状态后再匹配 |

POST 动作：

| action | 参数 |
|---|---|
| `createCompany` | fields：name、domain；超管 |
| `registerCompany` | companyId；超管，为已有原生公司开通门户 |
| `assignManager` | staffId、companyIds、active；超管 |
| `createContact/updateContact` | companyId、contactId(更新)、fields：firstName/lastName/email/phone/phoneCountryCode/jobTitle |
| `grantMember` | companyId、grant：contactId/projectScope/projectIds/documentScope/documentIds/allowApprovals |
| `revokeMember` | companyId、contactId |
| `createProject/updateProject` | companyId、projectId(更新)、fields |
| `publishProject/unpublishProject` | companyId、projectId |
| `createRecord` | companyId、projectId、type、fields |
| `updateRecords` | companyId、updates：`[{id,fields}]` |
| `decide` | companyId、recordId、fields：decision/comment/expectedVersion |
| `registerDocument` | companyId、projectId、fields：objectId/title/documentId(新版本可选)；仅内部文件工作流使用 |
| `uploadDocument` | companyId、projectId、fields：title/filename/mimeType/base64/documentId(新版本可选)；最多 3 MiB，返回 documentId/versionId/version 草稿信息 |
| `publishDocument/withdrawDocument` | companyId、documentId、versionId |

## 已验证与待验证

已完成 33 项 mock 测试：公司/经理隔离、不可改公司归属、客户管理员提权拦截、项目/文件范围、立即撤权、撤权并发 CAS、跨公司批量原子性、六种 PMP 对象、发布快照、版本撤回、下载过程撤权、私有对象归属、搜索隔离、审批与结项、WBS 循环、原生接口包装及不自动授权、手机变更、成员 HMAC 查询、HTTP/CSRF、缺失 adapter fail-closed、Redis Lua 调用协议；另包括私有上传草稿、旧发布版本保留、base64/类型/大小、越权无 IO、上传并发撤权/版本冲突、缺失或不一致文件 adapter、上传专属大 body 与其他 action 小 body 限制、先认证后读 body、流式读取时 UTF-8 中文文件名的分片保真。

真实部署初始化已执行原生公司/联系人创建和按公司过滤，Redis 权限/公司 CAS 持久提交，威胜售前项目、11 项 PMP 事项和正式 PDF/PPTX 发布；已验证客户跨公司 404、内部草稿拒绝访问、下载字节一致。电话变更、并发撤权、幂等超时与分页循环另有离线测试。短信通道已执行真实发送；没有绕过验证码模拟生产登录。生产 HTTP 和布局验收由统一发布流程继续执行。公开测试不包含真实手机号、邮箱或客户资料。
