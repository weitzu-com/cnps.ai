# CRM 本机下载路由恢复

该工具只调整本机 Mihomo 已有 `CNPS CRM下载` Fallback 组的 fixed 选择，目标为其已有且 alive 的 `🇺🇸LA-CF优选IP` 成员。Vercel 无法改变用户本机路由；这是本机 CRM 专用路由恢复工具，不是服务端性能补丁。已有浏览器限制、TLS、鉴权、撤权、审计和失败自动 fallback 保持原样。

坏窗口内交错三轮：已有 DIRECT / Singapore 路径总耗时 34.941、31.329、38.321 秒；已有 TUN / LA-CF / San Francisco 路径为 5.030、5.300、4.779 秒。公共静态 PDF 同时变慢。该证据支持选择既有更快路由；路由与边缘一起变化，不能归因某个 ISP 段，也不保证未来每次下载都低于 45 秒。

发布只走 PR → main → Git 自动部署。先合并并更新 `origin/main`，再由获授权的本机 agent 运行已合并源码；不需要用户手动操作。`--apply` 和 `--restore` 都验证运行文件 Git blob 与 `origin/main:scripts/crm-download-route.mjs` 一致。不得从未合并版本执行。

参数或环境提供本机绝对 Unix socket、现有配置文件、恢复状态文件。环境变量名为 `CNPS_CRM_CONTROLLER_SOCKET`、`CNPS_CRM_CONTROLLER_CONFIG`、`CNPS_CRM_ROUTE_STATE`。工具只在进程内读取配置顶层 `secret`，不会显示配置、授权值或节点服务器凭据；不接受命令行 secret。状态文件应位于该 agent 的私有本地工作目录，权限 0600，包含安全哈希及目标选择，不能提交仓库。

```sh
node scripts/crm-download-route.mjs --socket /absolute/controller.sock --config /absolute/existing.yaml --state /absolute/private-route-state.json
node scripts/crm-download-route.mjs --socket /absolute/controller.sock --config /absolute/existing.yaml --state /absolute/private-route-state.json --apply
node scripts/crm-download-route.mjs --socket /absolute/controller.sock --config /absolute/existing.yaml --state /absolute/private-route-state.json --restore
```

默认只读。操作前验证 rule 模式、唯一 `Domain crm.cnps.ai` 规则指向该组、无其他规则或业务组引用该组、Fallback 类型、成员已存在且 alive。仅允许内置 `GLOBAL` Selector 的成员清单包含该组，且必须保持 rule 模式、GLOBAL 当前未选择 CRM 组、没有任何规则指向 GLOBAL；GLOBAL 成员及选择仍参与前后哈希保护。保存原 fixed 选择后仅 PUT 精确组的 `name`；恢复仅用已保存原 fixed，原为空时 DELETE 精确组。重复运行幂等，不替换原恢复基线。不修改 rules、模式、DNS、组成员、安全设置或已有连接，也不关闭进程。

操作前后比较规则、完整 `/configs`、节点能力与组成员、非目标组选择及目标组策略的安全投影哈希。任何变化或 readback 不符均失败；仅尝试撤销本工具的目标选择，绝不修改其他变化。保留恢复状态并检查失败原因，不以部分 API 成功声称恢复成功。控制器 API 无事务锁；执行期间应避免其他软件同时改动策略。已有连接不会迁移，验收使用正常新下载请求。

`--restore` 允许 LA 成员已经失活，以便清除或恢复已保存原 fixed；它仍要求成员存在、规则范围、main 来源、受保护哈希及所有其他安全前置条件有效。默认检查和 `--apply` 仍强制 LA 成员 alive。失败补偿记录于私有状态文件的 rollback 字段；即使同时出现模式或规则变化，也只在目标仍保留本次选择、Fallback 类型及成员不变时尝试恢复原 fixed，不回写其他配置。

HTTP 限定 Unix socket 和白名单路径，限时、限响应体大小，响应完整 Buffer 后统一 UTF-8 解码，任何 HTTP 错误或不完整 JSON 均失败关闭。运行 `node --test tests/crm-download-route.test.mjs` 可验证 fake-controller 的 Unicode、错误、超时、安全前置条件、精确变更、幂等与恢复；测试不连接真实控制器。

官方实现依据：[Mihomo Fallback](https://github.com/MetaCubeX/mihomo/blob/Meta/adapter/outboundgroup/fallback.go) 的 fixed 选择与存活检查；fixed 成员失活时自动清空并回归 fallback。[官方代理 API](https://github.com/MetaCubeX/mihomo/blob/Meta/hub/route/proxies.go) 的 PUT 更新及持久化选择、DELETE unfixed。工具不调用 delay 测试、不创建节点或更改 fallback 类型，因此保留其原有存活失败自动 fallback 行为。

## 仅回收本任务自建的旧诊断连接

切换 fixed 不迁移已有 TCP 连接。本任务浏览器复测中，一条 agent 自建的旧 DIRECT 连接在切换后继续下载，出现 45 秒工具等待超时，最终约 74.3 秒完整保存。该失败证据必须保留，不能用新连接的性能覆盖。

只有 root agent 提供所有权安全证明后，才可运行已合并 main 版本的 `--retire-owned /absolute/proof.json`。该操作仍要求相同 controller 身份、已 applied 的 LA fixed/now、所有受保护哈希一致。它只 GET connections，在完整精确校验后 DELETE 一个明确 ID，随后 GET 确认消失。未持有证明不得推断所有权；用户连接不能使用此命令，不允许删除全部连接或其他 host、Match/native 连接。apply/restore 本身仍不触碰连接。

证明包含 `ownerTask`、`context`、`controllerId`、`reason: task-created-pre-switch-connection`、`ownerWindow: {start,end}` 与 `connection: {id,sourcePort,start,host,chains,rule,rulePayload,actualDestination,destinationPort}`。context 与当前 `CODEX_THREAD_ID`（或明确的 `CNPS_CRM_ROUTE_OWNER_CONTEXT`）一致，ownerTask 与 `CNPS_CRM_ROUTE_OWNER_TASK`（默认 `/root`）一致。精确 start 字符串必须处于 agent 自有时间窗口，整个窗口早于保存的 apply 时间。限定本次 CRM Domain / DIRECT → CRM 组、远端 76.76.21.21:443、HTTPS TCP loopback 来源。proof 中不包含凭据或无关连接。状态仅追加 retired ID 和时间；已消失时两次确认后幂等成功，readback 失败不能声称成功。

规则哈希采用 `static-rules-v2`：只从每条 rule 的 extra 排除 `hitCount/hitAt/missCount/missAt` 四个流量计数/时间字段，保留 `disabled` 及所有其他未知静态字段。新状态明确记录 `hashSchema: static-rules-v2`。缺少该标记的旧状态失败关闭，不忽略原 hash，不静默迁移，不覆盖原文件。

本次没有旧完整规则快照，无法从含动态计数的旧哈希反推静态基线。保留 v1 状态原件，在新版本合并后指定一个新的 v2 状态路径，正常 `--apply` 记录当前受全部前置校验保护的静态基线。当前 fixed 已为 LA 时该操作零路由 mutation。这个新状态的 originalFixed 是 LA，`--restore` 也只恢复 LA；它**不能**声称恢复最初空 fixed 的自动模式。最初空 fixed 只留在未覆盖的 v1 证据中，本工具不绕过旧 hash 去恢复它。定点 retire 使用新的 v2 applied 状态，继续核验全部静态哈希。
