# CRM.cnps.ai · Cursor 开发入口

配置核验日期：2026-10-14（Asia/Shanghai）。

打开 `/Users/weitzu/Developer/cnps-crm/cnps-crm.code-workspace`。源码位于同目录下的 `cnps.ai`。这份源码重新克隆自 GitHub，避免原桌面迁移目录的缺失 Git 对象和 iCloud 占位文件；原目录仍保留。

## 开始开发

```sh
cd /Users/weitzu/Developer/cnps-crm/cnps.ai
npm run dev:crm
```

访问 `http://localhost:4174/crm`。验证码固定为 `123456`；这是开发服务生成的合成数据，不调用短信供应商。

| 测试角色 | 合成手机号 |
| --- | --- |
| 管理员 | 18700001111 |
| 销售经理 | 18800002222 |
| Alpha 客户 | 18900003333 |
| Beta 客户 | 18600004444 |

开发服务复用真实认证、权限、业务服务及工作台界面，注入内存存储、Twenty 和文件适配器。它仅监听本机；数据在重启时清空，云数据库、AI 和通知通道未连接。需要保留一组测试数据时，应将合成 fixture 更新到 `scripts/dev-crm-fixtures.mjs`。只有本地开发服务会做 Origin 映射，并使用独立的 HttpOnly 开发 Cookie 兼容 Safari；生产认证规则和 Secure Cookie 保持不变。

Cursor 的 Terminal → Run Task 可启动本地开发、测试、构建、服务器终端、只读服务器状态及数据库结构检查。Run and Debug 中的 `CRM: 调试本地服务` 可打断点。静态官网仍用 `npm run build` 和 `npm run serve`；`serve` 不运行 CRM 接口。

```sh
npm test
npm run build
```

当前分支是 `codex/cursor-crm-development`。新功能可以继续创建 `cursor/*` 或 `codex/*` 分支。请遵循根目录 `AGENTS.md`：批量推送、PR 预览、合并 main 自动生产发布。不要手动发布生产。

## 已核验的基础设施

| 服务 | 入口 / 配置 |
| --- | --- |
| GitHub | https://github.com/weitzu-com/cnps.ai；main 基线 `16f35cf26335125a2a15e05ad70df37c1040b2ee` |
| Vercel | 团队 aipy，项目 cnps-ai；`prj_QxCNPtwoD0d7XCFGQiOqceP0Qoso`，已关联 `.vercel/project.json` |
| CRM | https://crm.cnps.ai/crm；Vercel 静态页面和 Node API |
| 香港 ECS | `ssh cnps-crm-hk`，101.47.77.53，`/opt/cnps-crm` |
| Twenty | v2.46.0，server + worker；内网 127.0.0.1:3000 |
| PostgreSQL | 16.15，数据库 cnps；仅 Docker 网络，不开放公网端口 |
| Redis | 服务器 Redis 8 供 Twenty；Vercel Upstash 供 CRM 会话、权限与业务状态 |
| 文件网关 / OCR | 文件网关 127.0.0.1:3200，OCR 独立容器；生产数据加密 |
| API 域名 | https://crm-api.cnps.ai；Nginx 仅允许公司/联系人 REST、对象和 healthz 路由 |
| 备份 | `cnps-crm-backup.timer`；今日已成功并有加密备份验证凭证 |

SSH 复用现有已授权私钥和固定主机指纹。私钥保存在 `~/.ssh/cnps_crm_hk`，主机指纹在 `~/.ssh/cnps_crm_hk_known_hosts`；没有安装新的服务器授权密钥。服务器终端拥有现有 root 权限，操作前核实当前目录和环境。

`dev-infrastructure/` 保存无密钥配置示例、生产架构清单、文件服务源代码快照和固定只读运维命令。原生数据库目前没有专用开发只读账号，因此 Cursor 的默认数据库工具只提供固定结构查询，不提供任意生产 SQL。Twenty 扩展和数据库迁移需要独立集成环境。

## Cursor MCP

`.cursor/mcp.json` 包含：

- `cnps-infrastructure`：固定只读服务器、数据库结构和备份状态，通过已配置 SSH 访问。
- `cnps-development`：代码分支、GitHub 仓库、Vercel 项目和环境变量名称。Vercel 使用本机现有 CLI 登录，永不返回密钥值。
- `cloudflare-docs`：Cloudflare 官方文档 MCP。
- `cloudflare-api`：Cloudflare 官方 API MCP。首次需要在 Cursor MCP 设置中 Connect，并由账户所有者完成 OAuth 授权；配置文件不含令牌。

Cloudflare 浏览器会话可到达已登录账户，但本轮管理台页面停留加载状态，尚未核验账户内 DNS 记录与代理状态。公网 DNS 核验：crm.cnps.ai 解析到 76.76.21.21（Vercel），crm-api.cnps.ai 指向香港源站；不要因此推断 Cloudflare 控制台记录已核验。

## 连接状态与凭据

独立 Node 24.21.0（匹配 Vercel 24.x）、Cursor 3.24.18 ARM64、GitHub CLI 2.102.0、Vercel CLI 64.0.2 已安装。Remote SSH 和 YAML 扩展已安装。工作区终端、调试器和本地 MCP 均指向独立 Node 24，不修改其他项目的 Node 22。

Vercel 本机账户可读取 cnps-ai，Git 集成生产分支为 main，项目关联已验证。GitHub 的旧 CLI 凭据和迁移 SSH GitHub 登录均不可用；读公开仓库和本地开发不受影响，推送/PR 前需重新登录：

```sh
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
gh auth status
```

Cursor 已安装的 GitHub 插件连接成功；本机仓库已配置 GitHub CLI credential helper，但普通 Git 推送仍需 CLI 重新认证。不要在终端、聊天或源码中填写明文 token。

生产配置仍在 Vercel 项目环境变量与服务器 `/opt/cnps-crm/.env` 等既有凭据文件中。本地没有下载生产密钥。`.env.example` 仅为独立集成环境字段清单；本地开发无需 `.env`。

注意当前 Vercel preview 的 SMS、Redis、proposal secret 与 production 共用，部分 CRM 变量仅限定旧预览分支 `codex/customer-project-workspace`；新分支预览不能作为已配置的独立 CRM 集成环境。要测试真实短信、AI、PostgreSQL、OCR 和完整后端，应先配置独立集成资源与密钥，并核验计费及数据边界。

## 官方配置依据

- [Cursor MCP 配置](https://cursor.com/docs/mcp)
- [Cloudflare 官方 API MCP](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/)
- [Cursor 官方下载](https://cursor.com/download)
