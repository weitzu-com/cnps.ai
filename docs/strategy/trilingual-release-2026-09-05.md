# CNPS.AI 三语言重设计发布

## 交付范围

68 个内容页面全部提供中文、英文和阿拉伯语，另有各语言的 404 页面，共 207 个语言页面。使用 /en、/zh、/ar 路由；旧网页网址保持可用并重定向到相应版本。

三语言覆盖导航、首页、6款产品详情、对比、解决方案、案例、采购指南、25个旧页面的产品/政策/支持内容、FastGPT专区、32章主方案、28章FastGPT报告、询盘与交互状态。原32章报告的22轮修订与FastGPT报告的23轮修订作为历史证据保留，不把翻译冒充新的研究迭代。原PDF、Markdown和中英对照附件保留。

## UI 与体验

深空蓝、银白、电光青；自主绘制的AI轨道球面；真实商店产品图片；自托管开源字体。中文使用系统中文字体，英文使用Space Grotesk与Manrope，阿拉伯语使用Noto Sans Arabic。阿语为完整RTL布局，邮箱、电话与必要型号隔离为LTR。

语言切换保留当前页面、有效活动参数与章节锚点。资料/案例搜索和分类过滤、产品图片切换、移动导航键盘操作、报告章节导航、打印/保存PDF、减少动态偏好均可用。

## 询盘与隐私

兼容已有HubSpot公开表单配置，并将通用询盘、联系页和FastGPT询盘统一为三语言界面。成功提示仅在真实2xx响应后出现；错误或网络超时不宣称已发送，保留输入并提供邮件草稿。处理同意默认不选，不订阅营销。客户信息不写入浏览器存储；仅保存有时效的活动标识。访问页面不会创建CRM联系人。

自动验证拦截全部表单POST，没有发送真实测试询盘、邮件或客户外联。原19项集成单元测试继续通过；新增浏览器验证覆盖三种语言的成功、失败、草稿、筛选、语言切换、移动菜单、减少动态与无脚本处理。120组页面/屏宽检查没有横向溢出或脚本错误。

## 维护

- 页面构建：scripts/build-trilingual.mjs。
- 公共文案、界面与动效：web/ui.mjs、web/assets/site.css、web/site.mjs。
- 内容：content/i18n/catalog.json、legacy-pages.json、fastgpt-pages.json、resources、reports。
- npm run build 为完整构建；缺少正文语言会直接失败，不在生产使用英文回退。
- 旧网页HTML已迁移，不再经旧部署转发。为已有缓存和历史外链保留 /brand 与 /_next 静态资源兼容转发；新页面使用 /assets/ 本地资源。
- 原始来源内容保留在 content/legacy-source，产品图片映射与来源在 content/i18n/product-assets.json。
- 字体许可证在 web/assets/fonts/*-OFL.txt。

## 发布验证

本地布局、交互与链接验证见同目录的 trilingual-layout-qa.json、trilingual-interaction-qa.json、trilingual-link-audit.json；翻译一致性见 content/i18n/reports/*validation.json 与 trilingual-legacy-validation.json。

发布前正式版本（回滚参考）：dpl_BwS73nyiEyXFmC2EV7a7HeNJG3Dc / https://cnps-2vkucu613-aipy.vercel.app 。

新版正式部署ID与生产网址验证将在发布完成后补入此记录。
