// Server-owned project association. Add links only after project authorization.
export const wasionPreviewBinding = Object.freeze({
  companyId: 'aedeea37-a4d2-4eda-83de-a700046ccabf',
  projectId: '61d10b7a-87a5-469d-bad7-00e8e5039f25'
});
export const wasionWorkspaceHref = '/workspace?' + new URLSearchParams(wasionPreviewBinding);
export function projectPreviews(companyId, projectId) {
  if (companyId !== wasionPreviewBinding.companyId || projectId !== wasionPreviewBinding.projectId) return [];
  return [{ title: '英文官网与 AI 搜索演示', href: '/demo/wasion',
    description: '预览英文官网、产品与解决方案页面，以及带来源的 AI 搜索。当前为客户演示版本，供审阅与反馈。' }];
}
