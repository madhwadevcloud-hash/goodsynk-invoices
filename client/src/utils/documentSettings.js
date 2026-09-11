const SETTINGS_KEY = 'documentSettings';

export const DEFAULT_WATERMARK_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#276EF1" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#1D4ED8" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  <g transform="rotate(-30 256 256)">
    <circle cx="256" cy="256" r="215" fill="none" stroke="#276EF1" stroke-width="10" stroke-dasharray="18,12" opacity="0.75"/>
    <circle cx="256" cy="256" r="192" fill="none" stroke="#276EF1" stroke-width="5" opacity="0.85"/>
    <circle cx="256" cy="256" r="135" fill="none" stroke="#276EF1" stroke-width="3" opacity="0.6"/>
    <rect x="56" y="216" width="400" height="80" rx="16" fill="url(#grad)"/>
    <text x="256" y="269" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">GOODSYNK</text>
    <text x="256" y="148" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="20" fill="#276EF1" text-anchor="middle" letter-spacing="5" opacity="0.9">★ OFFICIAL WATERMARK ★</text>
    <text x="256" y="380" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="18" fill="#276EF1" text-anchor="middle" letter-spacing="4" opacity="0.85">VERIFIED DOCUMENT</text>
  </g>
</svg>
`)}`;

export const DEFAULT_DOCUMENT_SETTINGS = {
  hideDiscount: false,
  showDiscountColumn: true,
  pdfAccentColor: '#276EF1',
  watermarkImage: DEFAULT_WATERMARK_SVG,
};

export function getDocumentSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return { ...DEFAULT_DOCUMENT_SETTINGS };
    return { ...DEFAULT_DOCUMENT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULT_DOCUMENT_SETTINGS };
  }
}

export function saveDocumentSettings(newSettings) {
  try {
    const updated = { ...getDocumentSettings(), ...newSettings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('documentSettingsChanged', { detail: updated }));
    return updated;
  } catch (err) {
    console.error('Failed to save document settings', err);
    return getDocumentSettings();
  }
}
