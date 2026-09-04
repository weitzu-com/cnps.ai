# CNPS.AI 资料中心合并发布记录

发布完成：2026-09-03（America/New_York）。

- 正式域名：https://www.cnps.ai
- 发布 ID：dpl_CQnCva64KPBnv6jdEB2H4qGFHSxK
- 不变部署地址：https://cnps-mo5up27wp-aipy.vercel.app
- 网站代码版本：ddbec1f（初次内容提交为 74c46b9）
- 合并站点：43 个 HTML 页面。
- FastGPT 方案：28 章，30 页 A4 PDF，初稿后的 23 轮实质修订。
- 中国 AI 应用与硬件方案：32 个逻辑章节，34 页 A4 PDF，22 轮实质修订。

## 核验结果

正式域名的 23 个重点页面、下载和静态资源均返回 HTTP 200。FastGPT Markdown、PDF、英文采购指南和迭代材料与本地发布文件逐字节一致。完整结果见 `research/fastgpt-production-verification.json`。本地桌面、手机、筛选和询盘草稿验证见两套验证记录；发布后的浏览器预览工具导航超时，正式访问结论依据直接 HTTP 检查。

## 发布时解决的问题

1. `.vercelignore` 原先排除了构建需要的 content 和 output，已修复。
2. 通用询盘页加入 JavaScript 就绪前的禁用保护，避免无脚本时表单默认 GET 提交。
3. Vercel cleanUrls 会将目录 index.html 映射到 /index；增加 16 条目录首页内部映射，避免首页和 FastGPT 目录页 404。新增同类目录页面时应同时更新 vercel.json。
4. 原产品与 use-cases 的精确路由移到通配路由之前，避免末尾斜杠的循环跳转。
5. 云端构建起初受并发队列延迟，使用官方 CLI 本地生产构建、预构建上传，再 promote 已验证版本。旧排队构建随后已完成，但未切换 www 正式域名。

## 维护边界

原产品、政策与支持路径由 `vercel.json` 转发到旧部署 https://cnps-2ieeg1m07-aipy.vercel.app 。完整迁移前不能删除该部署或启用阻断访问的保护。此次没有更改 DNS。

询盘入口准备发往 sales@cnps.ai 的邮件草稿，访客需在邮件应用中发送；没有宣称已接入 CRM 或服务器自动收件。未发送测试邮件、X 帖子或客户外联。

研究原始第三方缓存 research/raw 未提交、未部署。公开案例为带来源的简要转述，CNPS 建议试点与厂商案例成果分别标明。

## 再次发布

```sh
npm ci --ignore-scripts
vercel build --prod --yes --scope aipy
vercel deploy --prebuilt --prod --skip-domain --yes --scope aipy
# 核验返回的部署地址后，使用该部署 ID 执行：
vercel promote DEPLOYMENT_ID --scope aipy --yes
```
