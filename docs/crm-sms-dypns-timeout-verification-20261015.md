# CRM 短信错误码与请求预算修复验证

日期：2026-10-15。基线：`aef68f2e716c4ee5fdbadb33a014607b6a6e1ede`（核对及提交前 fetch 的最新 main）。仅草稿 PR；本次没有调用正式短信服务，没有合并或主动执行部署。

## 已核对的依据

- [Dypnsapi SendSmsVerifyCode 官方接口](https://help.aliyun.com/zh/pnvs/developer-reference/api-dypnsapi-2017-05-25-sendsmsverifycode)：列出下表五个不带前缀的业务错误码。保留原有旧代码兼容，禁止对任意输入删除前缀或输出原始消息。
- [阿里云 V2 Node.js SDK 超时配置](https://help.aliyun.com/zh/sdk/developer-reference/configure-a-timeout-period-1)：连接与读取分别配置，RuntimeOptions 优先于 Config。仓库固定依赖为 `@alicloud/dypnsapi20170525@2.0.0`；现有连接/读取配置均为 10000ms。
- 本地已安装的 `httpx` 从 socket 连接后开始读取计时，读取响应体使用剩余时间；不能将“等响应头 9 秒再读响应体 7 秒”当作该 SDK 必然允许的请求。浏览器预算需要覆盖整个 API 的授权、配额、连接、读取和保存挑战过程，而非只看某个 SDK 阶段。
- `vercel.json` 的 `api/crm.js.maxDuration` 为 30 秒；这里核对的是仓库配置，并未证明正式部署版本或控制台配置与之相同。

| 官方错误码 | 服务端安全分类 |
| --- | --- |
| BUSINESS_LIMIT_CONTROL | rate-limit |
| FREQUENCY_FAIL | rate-limit |
| MOBILE_NUMBER_ILLEGAL | configuration |
| INVALID_PARAMETERS | configuration |
| FUNCTION_NOT_OPENED | configuration |

## 最小运行代码变更

1. `crm-sms-failure.mjs` 的固定白名单与 `crm-auth-sms.mjs` 的分类表同时补齐五个错误码。精确匹配；未知值仍只保留通用原因；不透出供应商 message、payload、RequestId、手机号、验证码或密钥。
2. 登录页 send/verify 的浏览器总时限由 15 秒改为 35 秒：允许服务端配置的 30 秒执行窗口，加 5 秒响应余量。会话查询、退出仍为 15 秒。一个 AbortController 同时覆盖响应头与响应体，完成后清理计时器。
3. 响应体 AbortError/网络失败继续进入安全错误与冷却处理。平台超时可能返回 HTML；无法解析的发送响应也保留 60 秒冷却，不能据此认定短信未发送。

未改变服务端配额预占、60 秒冷却、按号码/网络/日/月限制、验证码有效期与尝试上限、挑战 Cookie 绑定、一次消费、授权、会话策略。保留 `autoRetry: 0`、`duplicatePolicy: 1`、`returnVerifyCode: false`。未增加自动重试或退款/释放发送额度路径。超时后无法保证供应商未处理请求，仍保留保守的费用保护。

## 本地验证

环境：Node v24.19.0。离线 npm 缓存不完整；复用现有工作区中与当前 `package-lock.json` 完全相同的依赖副本，并以 `npm ls --depth=0` 核对。未修改依赖或锁文件。

- 修改运行代码前，新回归准确暴露三项失败：真实错误码被归为通用值、慢响应在 15 秒被中止、短信请求无法等到新的期限。
- 专项命令：`node --test tests/crm-auth.test.mjs tests/crm-auth-sms-transport.test.mjs tests/crm-login.test.mjs tests/crm-login-industrial.test.mjs tests/crm-runtime-auth.test.mjs`：**84 通过，0 失败**。
- 真实 SDK 回环测试：实际延迟 5.3 秒响应成功；真正的 Node socket timeout 被安全归类且不重发；五个官方码分别通过 HTTP 200 业务拒绝与 HTTP 400 SDK 异常路径验证。http/https 传输被测试限定到本机，凭据为固定假数据，未联系阿里云。
- 浏览器脚本虚拟时钟测试：发送与核验在第 16 秒仍等待、第 29 秒成功；第 35 秒对响应头和响应体均中止；忙碌时重复点击无第二次请求；超时/网络断流/非 JSON 网关响应保留冷却、清理计时器、无自动重发。验证码清空、无新会话、日志及浏览器存储保护均有覆盖。这是脚本模拟，不能当作正式浏览器/运营商链路验收。
- 服务端测试：真实码通过响应及异常两条路径进入固定诊断，响应保持通用；慢发送期间第二次请求受冷却拦截；成功/超时不重复预占或重发；失败无挑战/会话，额度不返还。
- `npm run build`、`git diff --check`：通过。已有 Industrial 登录 JS/HTML 精确快照已随有意的功能修改更新，行为测试保留。
- `npm test`：**764 通过、1 失败、1 既有跳过**。失败为未修改的 `tests/crm-download-route.test.mjs`，当前 Node 进程触发 `node::InternalCallbackScope::Close()` 原生断言 `(env_->execution_async_id()) == (0)`。修改前基线为 758 通过、同一失败、1 跳过，单独运行该文件也复现。未改动该无关模块，不能宣称全套测试通过或远端 CI 已通过。

## 正式环境仍待授权验收

本次只证明代码与本地模拟行为，**不证明真实短信发送已经恢复**。后续经批准后，应先核对正式别名对应提交及实际超时配置，再用获授权测试号码执行一次受控发送，核对供应商提交/运营商回执、实际到达、验证码核验与授权会话。核对脱敏诊断能区分频控、配置和传输错误；检查慢响应和冷却提示。超时应先核对请求状态与回执，不立即再发。验收记录不包含完整手机号、验证码、Cookie 或密钥。
