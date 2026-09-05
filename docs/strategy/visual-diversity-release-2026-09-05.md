# CNPS.AI 图片去重与内容视觉优化

日期：2026-09-05

## 问题与设计依据

读者需要通过视觉区分主题、理解应用并找到下一步。上一版把少数概念图片绑定到宽泛类别，导致同页多次重复、不同文章没有独立封面。子串匹配还让 `knowledge` 误命中 `edge`，知识助手页面出现错误的边缘计算配图。

本轮按内容用途分配视觉：商品区展示不同设备；每篇文章有专属封面；方案与案例使用解释业务结构的示意图；资料使用可辨认的文档封面。原文、翻译、来源和询盘流程保持完整。

## 改动

- 首页：7 张不同的产品或文章图片，另有 6 个内容对应的示意图。首屏展示 INMO GO3 与 TicNote，产品区介绍 TicNote Pods WiFi 与 TicNote Lite；应用标签使用流程图。
- 博客：6 篇文章对应 6 个独立图片身份；新增现场智能眼镜、原型工作台与采购样品桌面三个主题。头部改为可操作的主题导航，避免重复第一篇封面。
- 方案：5 个独立业务示意图。案例：9 个独立结构/流程示意图。资料：9 个不同文档封面。
- FastGPT 通用页移除自动复用的装饰性大图。未知主题不再回退到通用图片。
- 所有图文标签、主题导航和替代文本提供完整三语；说明文字至少 14px，阿语保留 RTL。
- 配图登记表 `content/i18n/editorial-assets.json` 同时驱动文章卡片、正文封面、OG 和 BlogPosting 图片；构建拒绝不同文章共用一个封面条目。
- 同一篇文章在列表、详情及不同语言间保持相同视觉身份；商品详情的缩略图导航也是有意复用。去重统计针对同页正文和不同内容主题的无效重复。

## 对比

| 页面（每语） | 改动前 | 改动后 |
|---|---|---|
| 首页 | 13 张图片，5 个身份 | 7 张图片，7 个身份；6 个示意图 |
| 博客列表 | 7 张图片，4 个身份 | 6 张图片，6 个身份；独立主题导航 |
| 方案列表 | 5 张图片，2 个身份 | 5 个独立业务示意图 |
| 案例列表 | 9 张图片，2 个身份 | 9 个独立案例结构图 |
| 资料列表 | 9 张图片，3 个身份 | 9 个不同文档封面 |

## 来源与维护

新增场景配图使用内置 image_gen，各自独立生成，保留原图及 640/1280 WebP。它们是概念配图，不证明实际 SKU 或已交付案例。完整提示词、原图位置和压缩信息见 `unique-editorial-image-provenance.md`。原图归档不进入发布构建。

`semantic-visuals.mjs` 保存明确的内容 slug 与原创 SVG/三语标签；未知内容返回空，不使用重复回退。新增文章同时提供三语正文和独立的封面登记。修改配图须更新登记、三语替代文本，并验证社交分享图片。

## 验证

- 独立去重核验 110/110 项通过，覆盖三语、实际文件哈希、不同 SVG 几何、18 篇文章图片/alt/OG/JSON-LD 一致性。
- 浏览器 90 组响应式布局、31 项交互通过，无溢出、低于 14px 的图内说明或 JS 错误。
- 严格构建生成 228 个语言页面；14,015 个本地引用和 1,368 个语言链接通过审查。
- 原有询盘/归因 19 项测试通过。验证没有发送真实询盘。
- 保存证据：`visual-repetition-baseline.json`、`visual-repetition-after.json`、`visual-diversity-browser-qa.json`、`visual-diversity-link-audit.json`。

## 发布

发布前回退点：`dpl_EEMb6cHHt44gsf8AgxQsoQvNDcoq`，`https://cnps-p6l6926eb-aipy.vercel.app`。

按候选部署核验、正式域名切换、线上浏览器确认的顺序发布。正式部署信息将在完成后追加。

### 正式发布完成

- 实现提交：`c9c26b8`，已推送 GitHub `main`。
- 正式部署：`dpl_7LMKS8iqexeHLKppgeqsym15vZAp`。
- 固定部署：`https://cnps-ngqk5dq23-aipy.vercel.app`。
- 候选与正式域名各 69 项 HTTP 检查通过，HTML 及资源字节与验收构建一致。一次临时 TLS EOF 仅对该文章重试后通过，记录保留于生产核验文件。
- 正式浏览器确认中文/阿语博客为 6 图 6 身份，英文首页为 7 图 7 身份，中文案例为 9 个独立语义图；零图片错误、横向溢出或 JS 错误。
- 发布证据：`visual-diversity-candidate-http.json`、`visual-diversity-production-http.json`、`visual-diversity-production-browser.json`。
- 访问：`https://www.cnps.ai/zh/blogs`、`https://www.cnps.ai/zh`、`https://www.cnps.ai/zh/case-studies`。
