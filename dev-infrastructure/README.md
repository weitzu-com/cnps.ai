# CNPS CRM 开发连接与生产只读诊断

此目录提供 Cursor 可用的生产诊断工具、经过脱敏的部署配置参考和文件网关源码核对记录。服务器 SSH 连接使用本机已经配置的 `cnps-crm-hk` 别名；工具不保存 SSH 私钥、数据库密码或服务密钥。

## 已核验的部署

- 香港服务器：`101.47.77.53`，Ubuntu 22.04，部署目录 `/opt/cnps-crm`。
- Compose 项目：`cnps-crm`；Twenty CRM server/worker 为 `v2.46.0`，PostgreSQL 16、Redis 8、文档网关 `kb-v2` 和 OCR worker `v2`。
- Twenty 和文件网关分别绑定服务器 `127.0.0.1:3000`、`127.0.0.1:3200`。PostgreSQL 和 Redis 未发布主机端口。
- `crm-api.cnps.ai` 的 Nginx 公开公司/联系人 REST、文档对象和健康检查路由。客户界面域名为 `crm.cnps.ai`。
- 数据库名称为 `cnps`，当前登录角色 `cnps`。开发 SQL 使用独立本地数据库；这里的生产 schema 工具只读取表与列定义。
- 每日加密备份由 `cnps-crm-backup.timer` 执行。备份工具仅返回 timer/service 状态以及已验证备份的文件名和时间戳。

实时容器状态、源码哈希及核验时间记录在 [production-architecture.json](./production-architecture.json)。该文件只包含公开架构信息和环境变量名称。

## Cursor 与命令行

仓库的 `.cursor/mcp.json` 启动 `dev-infrastructure/mcp.mjs`。MCP 只提供三个无需参数的工具：

| 工具 | 输出 |
| --- | --- |
| `server_status` | 六个固定容器的状态、镜像及端口绑定 |
| `database_schema` | 数据库版本、只读状态、表名、列名及数据类型 |
| `backup_status` | 备份 timer/service 状态、已验证副本数量和最近核验时间 |

相同的诊断可直接从仓库根目录运行：

```sh
node dev-infrastructure/ops.mjs server_status
node dev-infrastructure/ops.mjs database_schema
node dev-infrastructure/ops.mjs backup_status
```

工具通过现有 SSH 别名运行固定命令，拒绝额外参数和未知工具。`database_schema` 设置 PostgreSQL `default_transaction_read_only=on` 和五秒语句超时；不读取客户记录。MCP 标准输出只含逐行 JSON-RPC 消息，无需安装额外 npm 依赖。协议实现依据官方 [stdio transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports) 和 [lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle)。

## 脱敏配置与源码核对

`compose.production.example.yml`、`file-gateway.production.example.yml` 和 `nginx.production.example.conf` 是当前部署的参考快照。密码、密钥、数据库/Redis URL 及 AI provider 配置全部替换为 `${VARIABLE}` 占位符。文件保留生产目录关系和镜像版本，供审查配置；日常开发应使用仓库的本地开发启动配置。

`live-file-gateway/` 保存明确允许获取的生产源码。`production-architecture.json` 的 `sources` 为各文件记录生产 SHA-256、快照 SHA-256、对应 Git 文件及一致性结果。快照不会覆盖 `ops/crm-file-gateway/`。首次核验中，已有 Git 源文件均与服务器一致，生产网关的 `package.json` 在 `ops/crm-file-gateway/` 中尚不存在。

需要重新核对部署源码时运行：

```sh
python3 dev-infrastructure/snapshot-production.py
```

脚本只允许获取列出的 Compose/Nginx 配置和网关源码；不获取 `.env`、认证状态、私钥、数据库内容、客户文件或 Docker 数据卷。敏感配置在落盘前替换为占位符。再次运行会更新本目录的参考快照和架构核验记录，不修改服务器。
