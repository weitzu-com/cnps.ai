// Facts checked against official page text and news-list publication labels on 2026-10-14.
// Asset path dates are never used as article publication dates.
export const NEWS_METADATA = {
  'president-daniel-francisco-chapo-republic-mozambique-visited-wasion': { date: '2026-04-20', region: 'Mozambique', topic: 'International cooperation', type: 'Company news' },
  'hungarian-ambassador-visit-wasion': { date: '2026-03-20', region: 'Hungary', topic: 'International cooperation', type: 'Company news' },
  'wasion-international-2025-annual-summary-commendation-conference': { date: '2026-02-11', region: 'China', topic: 'Company', type: 'Company news' },
  'dtech-2026': { date: '2026-02-08', region: 'United States', topic: 'Metering & distribution', type: 'Event report' }
};
export const DTECH = {
  slug: 'dtech-2026', title: 'Wasion at DTECH 2026', category: 'Newsroom', pageType: 'detail',
  url: 'https://en.wasion.com/news/120.html',
  images: ['https://en.wasion.com/public/uploads/images/20260208/26美展照片423x275.png'],
  summary: 'Explore Wasion’s metering and distribution showcase for utilities in the Americas.',
  paragraphs: ['At DTECH 2026 in San Diego, Wasion presented metering and distribution solutions for utilities in the Americas. The company introduced its Aventa™ smart meter series for North American AMI 2.0 applications, alongside distribution transformers and automatic reclosers. The report also covers Latin American AMI, battery storage and centralized metering discussions.'],
  sourceDate: '2026-02-08', sourceDateUrl: 'https://en.wasion.com/news.html'
};
export const PAST_EVENTS = [{ title: 'DTECH 2026', date: '2–5 February 2026', location: 'San Diego Convention Center, United States', url: DTECH.url, image: DTECH.images[0] }];
export const FACTORIES = [
  { country: 'Mexico', x: 184, y: 178, region: 'Americas', description: 'Local manufacturing is described in Wasion’s company profile and its CFE project story.', caseSlug: 'metering-solutions-for-cfe-in-mexico' },
  { country: 'Brazil', x: 287, y: 254, region: 'Americas', description: 'Listed as a local factory location in Wasion’s official company profile.' },
  { country: 'Tanzania', x: 494, y: 235, region: 'Africa', description: 'Listed as a local factory location in Wasion’s official company profile.', caseSlug: 'metering-solutions-for-tanesco' },
  { country: 'Hungary', x: 448, y: 122, region: 'Europe', description: 'Listed as a local factory location in Wasion’s official company profile. Hungary-specific certificates are available in the resource library.' }
];
export const VERIFIED_SOURCE_FACTS = { checkedAt: '2026-10-14', newsDates: 'https://en.wasion.com/news.html', factories: 'https://en.wasion.com/about.html', event: DTECH.url, scope: 'Official publisher statements; certificate validity and model applicability are not inferred.' };
