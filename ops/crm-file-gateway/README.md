# CNPS 项目文档网关

离线实现及测试完成，尚未部署或导入真实客户文件。Node.js ≥22，仅使用 Node 内置模块，无 npm 第三方依赖。网关负责保存不可替换的文件对象；客户身份、公司隔离、项目授权、文档发布/撤回和版本关系由 BFF / PMP 数据模型负责。

## 访问边界

- 默认仅监听 `127.0.0.1:3200`。容器内监听 `0.0.0.0` 时，Compose 仍仅发布主机 `127.0.0.1:3200`。
- 所有接口，包括健康检查，必须携带独立 `Authorization: Bearer <CRM_FILE_GATEWAY_KEY>`。哈希后用 `timingSafeEqual` 比较，匿名/错误凭证返回 401。
- BFF 先以服务端会话确定公司、联系人和项目，再检查该文档是否已发布及该联系人的授权，最后调用网关。公司/项目 ID 必须取自 BFF 的权威记录，不得信任浏览器请求值。
- 网关的两个读取接口都要求 `companyId` 和 `projectId` 查询参数，必须与加密元数据一致，否则返回 403。
- 密钥仅用于服务器间调用。浏览器不获得网关密钥、原始对象地址或存储路径；客户下载始终经过 BFF 的 ACL。
- 不提供 CORS 权限。所有响应 `no-store`、`noindex`、`nosniff`，内容默认 `attachment` 下载。

## 配置

`CRM_FILE_GATEWAY_KEY` 与 `CRM_FILE_ENCRYPTION_KEY` 必须是**两个不同的 32 字节随机数，分别编码为 64 位十六进制字符串**。AES-256 需要 32 字节，32 个 hex 字符仅有 16 字节，不能使用。日志不打印密钥、请求体、文件内容或客户资料。

其他配置：

| 环境变量 | 默认值 | 用途 |
| --- | --- | --- |
| `CRM_FILE_DATA_DIR` | `/data` | 专用持久存储目录 |
| `CRM_FILE_HOST` | `127.0.0.1` | 本地监听地址 |
| `CRM_FILE_PORT` | `3200` | 监听端口 |

密钥通过主部署流程创建并写入受限服务器配置，不在聊天、源码或命令输出中展示。备份必须同时保留加密文件和受控的加密密钥备份；丢失加密密钥后无法恢复文件。不要直接覆盖生产加密密钥，轮换须先完成文件重新加密及恢复验证。

## API

以下接口均要求 Bearer。`companyId`、`projectId` 与对象 ID 使用标准小写 UUID 字符串。

`POST /objects` 接收 JSON，字段严格为：

```json
{
  "companyId": "11111111-1111-4111-8111-111111111111",
  "projectId": "22222222-2222-4222-8222-222222222222",
  "filename": "项目方案.pdf",
  "mimeType": "application/pdf",
  "base64": "<canonical base64 bytes>"
}
```

成功返回 HTTP 201：`{id, companyId, projectId, mimeType, size, filename}`。每次上传生成新的 `randomUUID()`；没有替换、更新或删除对象的接口。发布/撤回只影响 PMP 可见性，不修改已有对象。

`GET /objects/:id?companyId=:companyId&projectId=:projectId` 返回上述六个元数据字段。

`GET /objects/:id/content?companyId=:companyId&projectId=:projectId` 返回原始文件字节与对应 MIME，使用经清理的 UTF-8 附件文件名。

`GET /health` 返回 `{status:"ok"}`。该接口也需要 Bearer。

JSON 请求上限 **50 MiB**，原始文件上限 **37 MiB**，为 Base64 和元数据预留空间。BFF / UI 的上传上限另设为 **3 MiB**，适配 Vercel 请求限制；批量种子资料可由受控服务器 CLI 上传至同一接口。超限返回 413。

## 文件校验与落盘

允许 MIME：PDF、DOCX、PPTX、XLSX、PNG、JPEG、TXT、CSV。PDF/PNG/JPEG 检查格式签名；DOCX/PPTX/XLSX 检查 ZIP 目录、对应主 XML 与 `[Content_Types].xml`，拒绝不匹配类型、路径穿透条目、软链接条目、加密 ZIP、宏工程及不支持的 ZIP64/多磁盘归档；TXT/CSV 必须是非空、无 NUL 的合法 UTF-8。此处是格式校验，不是完整文档解析或病毒扫描。

文件名经 NFKC 规范化、移除路径分隔符/控制字符、限制长度并补齐类型扩展名，只用作下载元数据，从不作为存储路径。非法对象 ID、编码路径穿透、存储目录/文件软链接均拒绝。

存储目录权限 `0700`，文件 `0600`。每个对象为 `UUID.enc`；正文与元数据共同使用 AES-256-GCM 加密，独立随机 12 字节 IV 和 16 字节认证标签。明文 envelope 仅包含版本、随机对象 ID、IV，并作为 AAD 验证。先写受限临时文件并 fsync，最后以不能覆盖既有对象的原子 hard-link 发布。读取对 envelope/密文验证后才返回内容，存储篡改返回 500。

## 测试与部署交接

运行：

```sh
node --test crm-deployment/file-gateway/test/*.test.mjs
```

14 个测试覆盖真实临时文件的加密落盘和权限、匿名/错误凭证、公司和项目匹配、遍历/软链接、请求及文件大小、格式白名单、OOXML、文件 ID 不可替换、密文和 envelope 篡改、读取字节一致性、CORS 与响应安全头。测试均使用临时数据和随机测试密钥，不接触真实资料。

部署覆盖文件 `file-gateway/compose.override.yml` 复用已固定 digest 的 Twenty 镜像内 Node，覆盖 entrypoint，以只读代码挂载、独立 `document-data` volume、仅 loopback 的 3200 端口运行；不挂载 Docker socket，不申请额外云服务。

在 `crm-deployment/` 目录合并配置：

```sh
docker compose -f compose.yml -f file-gateway/compose.override.yml config --quiet
docker compose -f compose.yml -f file-gateway/compose.override.yml up -d file-gateway
```

正式部署前由主部署流程核对镜像内 Node 版本、`.env` 两个独立密钥、健康检查、备份恢复及 BFF 的公司/项目/文件 ACL。若 BFF 位于其他主机，其受控 HTTPS 反向代理由主部署统一配置；不要将主机 3200 端口直接开放公网。


## OCR与旧版Office

同时部署 `ocr-worker`，需额外设置独立64位hex `CRM_OCR_WORKER_KEY`（不要复用网关/加密密钥）。网关连接 `extractor` 内部网络，工作容器仅连接此网络，不接入backend/egress，不映射公开端口。OCR采用Tesseract chi_sim+eng，旧DOC/PPT由LibreOffice转换；工作镜像含Pillow12.3.0/olefile0.47以校验图片和OLE流。新缓存名`.kb2.enc`，从旧解析器缓存重新生成。

Nginx `/objects`读取超时设置125s，服务器extractObject请求110s，工作任务85s；CRM问答函数最长300s，单次可选最多20个文件。并非每份文件都会用完超时预算。图片及扫描页OCR保留区域和置信度，DOC注明转换页，PPT按幻灯片引用。复杂/超大/加密/带宏/无法识别文件不当作已读取。
