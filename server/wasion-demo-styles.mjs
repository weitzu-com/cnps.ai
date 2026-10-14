// Published styles only. New variants share the same content and access checks.
export const WASION_DEFAULT_STYLE = 'orderful';
export const WASION_STYLES = Object.freeze({
 classic: Object.freeze({label: 'Classic', description: 'The original utility-focused website, with a structured product portfolio.'}),
 atmospheric: Object.freeze({label: 'Atmospheric', description: 'Full-width industrial photography, monumental typography and a restrained engineering aesthetic.'}),
 planhat: Object.freeze({label: 'Planhat', description: 'Monochrome editorial layouts, quiet typography and precise hairline grids.'}),
 orderful: Object.freeze({label: 'Orderful', description: 'Recommended for overseas customers: visible product families, direct technical search and clear project enquiries.'})
});
export function wasionStyleBase(style = WASION_DEFAULT_STYLE) {
 return style === WASION_DEFAULT_STYLE ? '/demo/wasion' : '/demo/wasion/styles/' + style;
}
