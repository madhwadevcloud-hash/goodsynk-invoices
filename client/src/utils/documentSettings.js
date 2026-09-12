import api from '../api/axios';

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

// Returns { ok, settings, reason }. Callers that only need the settings object
// can keep doing `saveDocumentSettings(x)` and ignore `ok`/`reason`, but the
// caller MUST check `ok` before assuming a change (e.g. a watermark upload)
// actually persisted — localStorage has a hard quota (~5-10MB per origin) and
// a large uploaded image can silently fail to save otherwise, leaving the
// in-memory/preview state out of sync with what's actually stored and what
// PDF generation will later read.
export function saveDocumentSettings(newSettings) {
  const updated = { ...getDocumentSettings(), ...newSettings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('documentSettingsChanged', { detail: updated }));
    syncDocumentSettingsToServer(updated);
    return { ok: true, settings: updated, reason: null };
  } catch (err) {
    console.error('Failed to save document settings', err);
    const isQuotaError = err && (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014);
    return {
      ok: false,
      settings: getDocumentSettings(),
      reason: isQuotaError ? 'quota' : 'unknown',
    };
  }
}

// The local save above is what the UI reflects immediately and is what stays
// authoritative if this call fails. This is a best-effort push to the user's
// account so the same watermark/discount-column/accent choices are available
// wherever localStorage isn't — most importantly, the server-side PDF renderer
// used for public share links (see server/controllers/publicController.js),
// which has no access to this browser's localStorage at all, and any other
// device/browser this account logs into. Debounced so dragging a color picker
// or repeated toggles don't fire a request per tick.
let syncTimer = null;
function syncDocumentSettingsToServer(settings) {
  if (typeof window === 'undefined' || !localStorage.getItem('token')) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    api
      .put('/auth/me', { documentSettings: settings })
      .then(() => {
        window.dispatchEvent(new CustomEvent('documentSettingsSynced', { detail: settings }));
      })
      .catch((err) => {
        console.warn('Failed to sync document settings to account (local copy is still saved):', err);
        // Local save already succeeded and is what the UI reflects — this is
        // purely "the account/other devices/share-link PDFs didn't get this
        // yet", surfaced as its own event so callers can show a distinct,
        // non-blocking notice instead of confusing it with a local-save failure.
        window.dispatchEvent(new CustomEvent('documentSettingsSyncFailed', {
          detail: { settings, reason: err?.response?.data?.message || 'Could not reach the server.' },
        }));
      });
  }, 400);
}

// Call after login/register/getMe so a different browser or device — and the
// public share-link PDF renderer, which reads documentSettings from the
// account rather than localStorage — end up seeing the same settings this
// account saved anywhere else, instead of only ever seeing whatever this
// specific browser's localStorage happens to hold.
export function hydrateDocumentSettingsFromUser(user) {
  if (!user || !user.documentSettings) return;
  try {
    const incoming = { ...user.documentSettings };
    // The server stores '' for "no custom watermark uploaded" (it doesn't
    // duplicate this SVG into every account). Without this, hydrating a
    // brand-new account — or one that changed some other setting but never
    // touched the watermark — would stomp the visible default with a blank.
    if (!incoming.watermarkImage) {
      incoming.watermarkImage = DEFAULT_WATERMARK_SVG;
    }
    const merged = { ...DEFAULT_DOCUMENT_SETTINGS, ...incoming };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('documentSettingsChanged', { detail: merged }));
  } catch (err) {
    console.warn('Failed to hydrate document settings from account', err);
  }
}
