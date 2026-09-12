// Shared by every invoice/quotation PDF template.
// Caps out inline data-URL images (logo/signature/seal/watermark). Without this,
// an oversized base64 image (e.g. an uncompressed photo used as a watermark)
// can make @react-pdf/renderer fail to produce a PDF at all instead of just
// looking bad -- so we treat anything absurdly large as "no image" rather than
// letting it take down the whole document. SVGs are excluded because the
// built-in default watermark placeholder (DEFAULT_WATERMARK_SVG in
// utils/documentSettings.js) is an SVG data URL -- treating it as "no custom
// watermark" is what makes "user hasn't uploaded anything" render as no
// watermark at all, instead of showing the placeholder branding graphic.
export const MAX_INLINE_IMAGE_LENGTH = 2_000_000;

export const isRasterImage = (url) =>
  typeof url === 'string' &&
  url.trim().length > 0 &&
  url.trim().length <= MAX_INLINE_IMAGE_LENGTH &&
  !url.trim().toLowerCase().startsWith('data:image/svg');
