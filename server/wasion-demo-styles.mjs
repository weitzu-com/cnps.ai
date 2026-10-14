// Published styles only. New variants share the same content and access checks.
export const WASION_STYLES = Object.freeze({
 classic: Object.freeze({label: 'Classic', description: 'The original utility-focused website, with a structured product portfolio.'}),
 atmospheric: Object.freeze({label: 'Atmospheric', description: 'Full-width industrial photography, monumental typography and a restrained engineering aesthetic.'}),
 planhat: Object.freeze({label: 'Planhat', description: 'Monochrome editorial layouts, quiet typography and precise hairline grids.'}),
 orderful: Object.freeze({label: 'Orderful', description: 'Product-led B2B layouts, a connected portfolio and focused vermillion actions.'})
});
export function wasionStyleBase(style = 'classic') {
 return style === 'classic' ? '/demo/wasion' : '/demo/wasion/styles/' + style;
}
