# 火山交付通知通道

当前代码默认关闭。只有资质、签名、通知模板、运营商报备及使用范围均确认可用后，才能配置生产环境并启用。

环境变量：`CRM_NOTIFY_PROVIDER=volcengine`、`CRM_VOLC_SMS_ENABLED=true`、`CRM_VOLC_SMS_ACCESS_KEY`、`CRM_VOLC_SMS_SECRET_KEY`、`CRM_VOLC_SMS_SUB_ACCOUNT`、`CRM_VOLC_SMS_SIGN`、`CRM_VOLC_SMS_TEMPLATE_ID`、`CRM_VOLC_SMS_APPROVED_TEXT`。最后一项必须与 `DELIVERY_SMS_TEXT` 完全一致。凭据使用只允许 `SendSmsForAgent` 和 `ListSmsSendLogForAgent` 的专用服务身份，不使用主账号临时凭据。审核未通过不配置启用开关。

- 固定 HTTPS 官方 endpoint、2026-01-01 API、cn-beijing / volcsms 签名范围，Node 内置 HMAC-SHA256，无新增生产依赖。
- 按签名及固定正文 UTF-16 长度预留短信段：70 字以内 1 段，以上按 67 字一段；Redis 原子限额 3,000 段/月、200 段/日、20 次/人/日、60 秒冷却，与 `sms-policy.mjs` 保持一致。按北京时间记账。未知调用不退款、不自动重试；禁用供应商侧自动重发并确保该专用通道无其他发送方。
- `SendSmsForAgent` 仅使用一个收件号码，响应 `Result.MessageId` 恰为一个 ID 才标记 submitted。超时、格式不明保留 unknown。
- 后台“查询短信回执”通过签名的 `ListSmsSendLogForAgent` 查询，不开放未认证的回调写入口。请求中精确限定消息ID、手机号和消息组，并匹配响应签名、模板和 CN_NTC；兼容平台脱敏手机号和省略消息组字段；有 ReceiptTime 且 ErrorCode 为 "0" 才确认送达。已知 SY/NE/CR/CE/UN 错误归为投递失败，其余保留待核实。查询显式传入时间范围，并兼容秒/毫秒回执时间。真实验收阶段必须核对控制台与 API 的成功/失败码语义，才扩展映射。
- 回执查询前后复核公司、人员、手机号及当前资料授权，使用 revision CAS；送达不修改 viewedAt。撤权及号码变更阻止查询归属；已送达也禁止重新发送。

API schema依据官方仓库：
https://github.com/volcengine/volcengine-go-sdk/blob/master/service/volcsms/api_send_sms_for_agent.go
https://github.com/volcengine/volcengine-go-sdk/blob/master/service/volcsms/api_list_sms_send_log_for_agent.go
https://www.volcengine.com/docs/6361/171584

真实验收：仅13695462223，建立或复用该人员有权限的非敏感验收交付包，调用CRM业务服务而非绕过ACL直接发送；持久保存deliveryId、attempt、providerId，随后同步回执并核对控制台。未知状态禁止重发。未完成真实验收，不宣称通道上线可用。
