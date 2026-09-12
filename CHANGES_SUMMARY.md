# GoodSynk Invoices — Watermark / Document Settings Fix

## The original bug
Watermark uploads in `DocumentSettingsPanel.jsx` were saved raw (no resizing
or compression) into `localStorage`. A normal photo-sized upload could exceed
the browser's ~5–10MB storage quota. The panel's own preview showed the new
image fine (it's just React state), but the save to `localStorage` silently
failed — so anything that re-read the settings later (like PDF generation)
got the old value. Templates 18/19/20 are the only templates that embed that
image into the PDF, which is why only they broke.

A second, deeper issue surfaced while fixing this: `documentSettings`
(watermark, discount-column visibility, accent color) lived **only** in the
browser's `localStorage`. The server-side PDF renderer used for public
share links had no access to it at all — so a shared invoice link could
never reflect the owner's watermark or discount preferences, regardless of
what they set in the app.

---

## What is done

### 1. Root-cause fix — oversized watermark uploads (localStorage)
- `client/src/utils/documentSettings.js` — `saveDocumentSettings()` now
  returns `{ ok, settings, reason }` instead of silently swallowing
  `QuotaExceededError`, so callers know whether a save actually persisted.
- `client/src/components/DocumentSettingsPanel.jsx` — watermark images are
  now downscaled to 512px and compressed (PNG, falling back to JPEG if still
  too large) *before* being saved, and the panel shows a real error toast if
  a save still fails instead of pretending it worked.
- `server/pdfTemplates/templates/Template18.jsx`, `Template19.jsx`,
  `Template20.jsx` (client **and** server copies, 6 files total) — added a
  hard length cap (`MAX_INLINE_IMAGE_LENGTH`) so an oversized inline image
  can never crash PDF generation, even if one somehow got stored anyway.

### 2. Closing the public share-link gap
- `server/models/User.js` — added a `documentSettings` sub-object
  (`hideDiscount`, `showDiscountColumn`, `pdfAccentColor`, `watermarkImage`)
  to the account, mirroring the client's localStorage shape.
- `server/controllers/authController.js` — `PUT /api/auth/me` now accepts
  and merges `documentSettings` (with the same size cap the templates
  enforce), and it's included in the `login`, `register`, `googleLogin`,
  and `getMe` responses.
- `client/src/utils/documentSettings.js` — every local save now also pushes
  to the server in the background (debounced 400ms, non-blocking — the
  local save is still what the UI reflects immediately and still succeeds
  even if this fails). Emits `documentSettingsSyncFailed` /
  `documentSettingsSynced` events so UI can react.
- `client/src/context/AuthContext.jsx` — pulls the account's
  `documentSettings` into `localStorage` on login, register, Google login,
  and session restore (`hydrateDocumentSettingsFromUser`), so a different
  browser/device picks up the same settings.
- `server/controllers/publicController.js` — the share-link PDF query now
  populates `documentSettings`, and a new `applyDocumentSettings()` helper
  (mirroring the client's `TemplateResolver`) applies the watermark and
  discount-visibility choices before rendering. This benefits **12 other
  templates** beyond 18/19/20 that do render a discount column and were
  previously ignoring this setting entirely on public links.
- `client/src/components/DocumentSettingsPanel.jsx` — shows a distinct,
  non-alarming toast if the background account-sync fails, so the user
  knows a change is saved locally but may not show up on shared links yet.

### Verification performed
- All changed files pass an `esbuild`/`node --check` syntax pass.
- Confirmed `saveDocumentSettings()`'s changed return shape isn't consumed
  anywhere else in the codebase (only `DocumentSettingsPanel.jsx` calls it).
- Confirmed the Mongoose nested-object merge (`user.documentSettings.toObject()`)
  behaves as expected, tested against a live `mongoose` instance.
- Diffed the final project against the original upload — exactly these 12
  files changed, nothing else touched:
  - `client/src/components/DocumentSettingsPanel.jsx`
  - `client/src/context/AuthContext.jsx`
  - `client/src/pages/invoices/templates/Template18.jsx`
  - `client/src/pages/invoices/templates/Template19.jsx`
  - `client/src/pages/invoices/templates/Template20.jsx`
  - `client/src/utils/documentSettings.js`
  - `server/controllers/authController.js`
  - `server/controllers/publicController.js`
  - `server/models/User.js`
  - `server/pdfTemplates/templates/Template18.jsx`
  - `server/pdfTemplates/templates/Template19.jsx`
  - `server/pdfTemplates/templates/Template20.jsx`

---

## What is NOT done (known gaps / possible follow-ups)

- **`pdfAccentColor` is still a no-op.** It's persisted and synced like the
  other settings now, but it was never wired into any template's actual
  rendering — not even in the original private/local flow. That's a
  separate, pre-existing gap outside this fix's scope.
- **No automatic retry for a failed account sync.** If the background push
  to `/api/auth/me` fails (network blip, server down), the user gets a
  toast, but nothing retries on its own — it will only resend the next time
  *any* setting is changed and saved again. A real fix would need either a
  retry-on-app-load check or a manual "resync" action.
- **`MAX_INLINE_IMAGE_LENGTH` (2,000,000 chars) caps the raw data-URL
  string**, not decoded image bytes — base64 inflates size by ~4/3, so this
  is roughly a 1.5MB image ceiling. Consistent with the panel's own 700KB
  output cap for watermark uploads, but worth confirming that's also the
  intended ceiling for logo/signature/seal images, which aren't compressed
  by the panel.
- **The public share-*page* JSON summary** (`getPublicDocument` in
  `publicController.js`, used to render the non-PDF public web view) was
  left untouched — it only ever showed `businessName`/`businessLogo`, not
  the watermark or discount settings, so there was nothing there to sync.
- No automated test suite exists for any of this — verification was manual
  (syntax checks, targeted grep/diff, one live mongoose behavior check).
  If this project has a test runner, it's worth adding a regression test for
  the localStorage-quota failure path and the share-link discount/watermark
  behavior specifically, since both were silent failures before.

---

## Round 2 — preview watermark placeholder + Template18/19/20 PDF crash

### 1. Preview showed the default watermark for upgraded users with no upload
`client/src/components/TemplatePreview.jsx` decided whether to draw the
watermark overlay with `!activeWatermark.includes('OFFICIAL WATERMARK')`.
`DEFAULT_WATERMARK_SVG` is `encodeURIComponent`-encoded before being stored,
which turns the space in `"OFFICIAL WATERMARK"` into `%20` — so that literal
substring never actually appears in the string, `hasCustomWatermark` was
**always `true`**, and every upgraded-plan user saw the default placeholder
graphic in template preview thumbnails even when they'd never uploaded a
watermark (the actual generated PDF was unaffected — templates use the
robust `isRasterImage` SVG-prefix check, not this text search).

**Fix:** `TemplatePreview.jsx` now imports the same `isRasterImage` helper
the PDF templates already use (`pages/invoices/templates/watermarkUtils.js`)
instead of the broken text match. Verified all four cases (default SVG,
real upload, empty string, undefined) resolve correctly.

### 2. PDF generation crashed for Template18/19/20 (E-Commerce Tax Invoice,
Legal Services Boxed, Corporate Matrix)
These three templates rendered `biz.address` / `client.address` directly as
text (`{biz?.address || ''}`), but `address` is a structured object
(`{ street, city, state, pincode, country }` — see `User.js` / `Client.js`),
not a string. Every other template formats the sub-fields; these three
didn't, so `@react-pdf/renderer` threw `"Objects are not valid as a React
child"` and PDF generation failed outright — reproduced directly against
`@react-pdf/renderer` with sample data.

Same root cause also broke "Place of Supply" on Template18/20, which read
`client?.state` (always `undefined` — `state` only exists nested under
`client.address`) instead of `client?.address?.state`.

**Fix:** added a shared `addressUtils.js` (client and server copies) with
`getAddressStreet` / `getAddressCityLine` / `getFullAddress` helpers that
safely handle both the structured object and a legacy plain string, and
updated all address/place-of-supply references in Template18/19/20 (both
`client/src/pages/invoices/templates/` and `server/pdfTemplates/templates/`
copies, 6 template files total) to use them. Re-verified with realistic
nested `user.address` / `client.address` data — the object-rendering crash
is gone; only a sandbox-only font-fetch restriction remains in the test
environment, unrelated to this fix.

### Files changed this round
- `client/src/components/TemplatePreview.jsx`
- `client/src/pages/invoices/templates/addressUtils.js` (new)
- `client/src/pages/invoices/templates/Template18.jsx`
- `client/src/pages/invoices/templates/Template19.jsx`
- `client/src/pages/invoices/templates/Template20.jsx`
- `server/pdfTemplates/templates/addressUtils.js` (new)
- `server/pdfTemplates/templates/Template18.jsx`
- `server/pdfTemplates/templates/Template19.jsx`
- `server/pdfTemplates/templates/Template20.jsx`
