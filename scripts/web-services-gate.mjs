// Indexing gate for the website-building service page (/en/services/websites), JEV ruling D6 (2026-10-19).
// The page may be indexed and listed in sitemap.xml only while #work renders at least `minAuthorizedWorks` (>= 3)
// works that carry permission === true with source, checkedAt, deliveredBy and permissionSource. Below that the page is noindex and
// left out of the sitemap. The decision is derived from the actual work records, so nobody flips a flag by hand.
export const MIN_AUTHORIZED_WORKS = 3;
export const EXCLUDED_WORK_DOMAINS = ['zschemi.com', 'carblon.com'];

export const isAuthorizedWork = w => Boolean(w && w.permission === true && w.source && w.checkedAt && w.deliveredBy && w.permissionSource);

export function validateWorks(works = []) {
  for (const w of works) {
    if (!isAuthorizedWork(w)) throw Error('Website-building work needs permission, source, checkedAt, deliveredBy and permissionSource: ' + (w?.url || w?.name));
    const where = String(w.url || '') + ' ' + String(w.domain || '');
    if (EXCLUDED_WORK_DOMAINS.some(d => where.includes(d))) throw Error('Excluded site listed as website-building work: ' + (w.url || w.domain));
  }
  return works;
}

export function webServicesGate(works = [], minWorks = MIN_AUTHORIZED_WORKS) {
  if (!Number.isInteger(minWorks) || minWorks < MIN_AUTHORIZED_WORKS) throw Error('Website-building indexing gate needs minAuthorizedWorks >= ' + MIN_AUTHORIZED_WORKS);
  const rendered = works.filter(isAuthorizedWork);
  return {rendered, worksRendered: rendered.length > 0, indexable: rendered.length >= minWorks};
}
