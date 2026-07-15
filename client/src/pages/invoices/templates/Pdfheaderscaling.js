// pdfHeaderScaling.js
// Shared helper for all 6 invoice/quotation templates.
// Computes a "density score" from the business header content (name + address + GSTIN)
// and returns scaled style values so a long address doesn't visually dominate
// or push the layout further than necessary. Import this once per template.

/**
 * Builds a single string representing everything shown in the business header
 * block, so we can score its total length regardless of which fields are present.
 */
function getHeaderContentLength(biz) {
    const parts = [
        biz?.businessName || biz?.name,
        biz?.address?.street,
        biz?.address?.city,
        biz?.address?.state,
        biz?.address?.pincode,
        biz?.gstin,
    ].filter(Boolean);

    return parts.join(' ').length;
}

/**
 * Returns scaled style values for the business header block.
 * Tunable via the `thresholds` param if a template needs different breakpoints
 * (e.g. templates with a wider bizInfoTop column can afford higher thresholds).
 */
export function buildScaledStyles(biz, thresholds = DEFAULT_THRESHOLDS) {
    const len = getHeaderContentLength(biz);
    const tier = thresholds.find((t) => len > t.min) || thresholds[thresholds.length - 1];

    return {
        bizNameFontSize: tier.bizNameFontSize,
        bizSubTextFontSize: tier.bizSubTextFontSize,
        bizSubTextLineHeight: tier.lineHeight,
        logoHeight: tier.logoHeight,
        bizInfoMaxWidth: tier.maxWidth, // widen the column slightly for long content
    };
}

// Ordered from longest content to shortest. First matching tier (len > min) wins.
// maxWidth NARROWS as content grows longer — this is intentional: a narrower
// column forces the address to wrap onto more (shorter) lines instead of
// stretching into a few long, dense lines that crowd the logo/GSTIN block.
const DEFAULT_THRESHOLDS = [
    { min: 140, bizNameFontSize: 11, bizSubTextFontSize: 7.5, lineHeight: 1.35, logoHeight: 40, maxWidth: '52%' },
    { min: 100, bizNameFontSize: 12, bizSubTextFontSize: 7.8, lineHeight: 1.32, logoHeight: 42, maxWidth: '56%' },
    { min: 70, bizNameFontSize: 12.5, bizSubTextFontSize: 8.2, lineHeight: 1.3, logoHeight: 43, maxWidth: '60%' },
    { min: 0, bizNameFontSize: 13, bizSubTextFontSize: 8.5, lineHeight: 1.3, logoHeight: 45, maxWidth: '65%' }, // default/original values
];