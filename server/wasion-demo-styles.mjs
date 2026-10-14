// Published styles only. New variants share the same content and access checks.
export const WASION_DEFAULT_STYLE = 'orderful';
export const WASION_STYLES = Object.freeze({
 classic: Object.freeze({label: 'Classic', description: 'The original utility-focused website, with a structured product portfolio.'}),
 atmospheric: Object.freeze({label: 'Atmospheric', description: 'Full-width industrial photography, monumental typography and a restrained engineering aesthetic.'}),
 planhat: Object.freeze({label: 'Planhat', description: 'Monochrome editorial layouts, quiet typography and precise hairline grids.'}),
 orderful: Object.freeze({label: 'Orderful', description: 'Recommended for overseas customers: a brand-led product portfolio, clear project enquiries and supporting technical search.'}),
 industrial: Object.freeze({label: 'Industrial', description: 'A brand-led industrial experience: immersive Wasion imagery, sculptural product displays and editorial project stories.'})
});
export function wasionStyleBase(style = WASION_DEFAULT_STYLE) {
 return style === WASION_DEFAULT_STYLE ? '/demo/wasion' : '/demo/wasion/styles/' + style;
}
