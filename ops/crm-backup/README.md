# CNPS CRM 私有加密备份与恢复验证

运行路径 `/opt/cnps-crm/ops/backup.py`。独立 AES-256-GCM 密钥由脚本仅在香港服务器生成，保存为 `/var/lib/cnps-crm-backup/encryption.key`，权限 `0600`；目录 `0700`。密文备份位于 `/var/backups/cnps-crm/`，权限 `0600`；不通过 stdout 或日志输出密钥、配置值或客户资料。

每次备份包括：PostgreSQL custom-format `pg_dump`、Twenty `cnps-crm_app-data` volume、文档 `cnps-crm_document-data` volume，以及存在的 `.env`、`files.env` / `.files.env`、`.bootstrap-auth.json`、`.upstash-backup-env.json` 和部署配置。备份先流式打包再 AES-GCM 加密，全程不写明文备份磁盘文件。

Upstash 权威 PMP / ACL 与询盘状态以生产只读 SCAN 和原子 MGET / PTTL 导出，严格只允许 `cnps:crm:business:v1:*` 、`cnps:crm:inquiry:v1:*` 与 `cnps:crm:audit:v1:event:*`；认证会话、短信挑战和验证码不备份。URL / Token 存在服务器 `/opt/cnps-crm/.upstash-backup-env.json`，权限 `0600`。网络请求使用官方 HTTPS REST API，拒绝重定向，敏感凭据不写到 URL。快照先 schema 校验再直接写入加密流。

备份完成后，先验证 AES-GCM 标签及各归档成员的 SHA-256，再仅在 `/dev/shm` RAM 临时文件中解密。数据库恢复到独立 `cnps_restorecheck_*` 数据库，核对表数量、用户数量、工作区数量，验证结束后强制删除临时数据库。Upstash 自动验证仅检查 JSON / schema，不回写任何生产权限或询盘状态。

成功验证后保留最近 7 份副本，未验证文件不会被轮转清除。每天北京时间 03:30 加最多 15 分钟随机延迟自动运行；停机错过会由 `Persistent=true` 补跑。`systemd` 状态与 journal 仅记录操作结果和数量。磁盘剩余不足 5 GiB 或恢复验证 RAM 不足时失败，不静默删除有效备份。

```sh
# 立即备份并执行数据库恢复验证
sudo python3 /opt/cnps-crm/ops/backup.py backup

# 重新验证指定密文副本；不覆盖生产数据库
sudo python3 /opt/cnps-crm/ops/backup.py verify /var/backups/cnps-crm/<backup>.enc

# 查看每天的任务状态
systemctl status cnps-crm-backup.timer
systemctl status cnps-crm-backup.service
```

手动 Upstash 恢复仅支持隔离 namespace，所有恢复 key 使用 `NX` 写入并设置 7 天 TTL；名称必须以 `cnps:crm:restorecheck:` 开头。工具没有生产覆盖模式，生产恢复必须另行显式运维，重新核对现行 ACL、撤权记录及询盘发送状态，不能直接把旧权限/发送快照写回生产。

```sh
sudo python3 /opt/cnps-crm/ops/backup.py restore-upstash /var/backups/cnps-crm/<backup>.enc \
  --namespace cnps:crm:restorecheck:review_20261013:
```

此方案是可恢复验证的**同机加密备份**，未新增付费资源。它不覆盖主机整体丢失后的异地灾备；要达到该能力，后续需将密文副本与受控的密钥恢复机制纳入异地保存方案。

格式、AEAD、排除认证命名空间、拒绝生产恢复及轮转自测：

```sh
python3 /opt/cnps-crm/ops/selftest.py
```

参考：[Upstash 官方 REST API](https://upstash.com/docs/redis/features/restapi)；生产只读导出采用其 JSON 命令与 `multi-exec` 原子读事务。

## 已有 owner 的维护

`bootstrap-twenty.py` 已修正 v2.46 HIDDEN 工作区的登录恢复：官方 `signIn` 的 root-domain picker 不列出隐藏工作区，即便该用户已是成员，也不能把“未列出”误判为工作区不存在。已有工作区通过官方 `renewToken` 续期，然后验证 owner 邮箱和当前工作区 ID；不新建工作区、不改变 discoverability、不开放邀请。owner 的 access token 有有效期，不能把过期 token 继续用于 REST / GraphQL。

`repair-owner-and-clean-demo.py --run` 仅完成已有 owner 的可选 onboarding（跳过邮箱同步、补空白服务账户显示名、零收件人完成邀请步骤），然后对最初记录的 5 个 vendor demo UUID 进行名称、domain、关联 CEO 的完整校验，再做可恢复的 soft-delete。它不会改 BFF key / role 权限，不新建额外凭证，不发送邀请邮件，也不触碰 CNPS / Wasion 的实际客户记录。该工具未配置成定时任务。

```sh
python3 /opt/cnps-crm/ops/repair-owner-and-clean-demo.py --run
python3 /opt/cnps-crm/ops/test-owner-repair.py
```

3 个离线 fixture 测试验证：隐藏工作区只恢复现有 session、不创建工作区；仅删除固定 demo、保护其余记录并允许重复运行；任一目标字段变化则在删除任何记录之前停止。

2026-10-14：新增访问审计备份与严格事件 schema 校验；固定审计时间水位，避免在线新增事件导致扫描持续冲突；每 100 个键分批读取。隔离 Upstash 恢复后逐批读回核对原值，仍禁止生产 namespace 恢复。代码受版本控制于 cnps.ai 仓库 `ops/crm-backup/`，部署前保留原脚本。
