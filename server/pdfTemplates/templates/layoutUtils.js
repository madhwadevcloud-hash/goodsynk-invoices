// layoutUtils.js
// Shared layout helpers for the invoice / quotation PDF templates.
//
// @react-pdf/renderer does no automatic "shrink to fit" and (with the old
// `registerHyphenationCallback(word => [word])`) never breaks a long unbroken
// word such as an e-mail address, a long invoice number or a big amount. The
// result was text running into neighbouring blocks or off the page edge.
// These helpers let every template size its columns / fonts from the real
// data instead of using fixed flex ratios.

// A4 portrait width in points.
export const A4_WIDTH = 595.28;

// ---------------------------------------------------------------------------
// 1. Long-word breaking
// ---------------------------------------------------------------------------
// Words up to MAX_WORD characters are left untouched (so normal text still
// wraps only at spaces, never mid-word). Longer unbroken tokens (e-mails, URLs,
// long reference numbers) are split after natural separators first and then
// into fixed-size chunks, so they wrap INSIDE their box instead of overflowing.
const MAX_WORD = 16;
const CHUNK = 11;

export const safeHyphenation = (word) => {
  if (!word || word.length <= MAX_WORD) return [word];
  const pieces = word.match(/[^@./_\-,:\\]*[@./_\-,:\\]?/g).filter(Boolean);
  const out = [];
  pieces.forEach((p) => {
    for (let i = 0; i < p.length; i += CHUNK) out.push(p.slice(i, i + CHUNK));
  });
  return out;
};

// ---------------------------------------------------------------------------
// 2. Text measuring (approximation of Inter metrics, intentionally a touch wide)
// ---------------------------------------------------------------------------
export const textWidth = (str, size = 9, bold = false) => {
  let w = 0;
  for (const ch of String(str ?? '')) {
    if (ch === ' ') w += 0.28;
    else if ('.,:;\'|ilj!'.includes(ch)) w += 0.28;
    else if ('ftr()-/[]'.includes(ch)) w += 0.38;
    else if (ch >= '0' && ch <= '9') w += 0.62;
    else if ('mwMW@%'.includes(ch)) w += 0.86;
    else if (ch >= 'A' && ch <= 'Z') w += 0.68;
    else w += 0.57;
  }
  return w * size * (bold ? 1.07 : 1);
};

// Largest font size (<= size, >= min) at which `str` fits on ONE line of `maxW`.
export const fitFont = (str, size, maxW, min = 5.5, bold = false) => {
  let s = size;
  while (s > min && textWidth(str, s, bold) > maxW) s -= 0.25;
  return Math.max(min, Math.round(s * 100) / 100);
};

// Width (pt) needed to show the widest of `strings`, never below `min`.
export const neededWidth = (strings, size, { bold = false, pad = 0, min = 0 } = {}) =>
  Math.max(min, Math.ceil(Math.max(0, ...strings.map((t) => textWidth(t, size, bold))) + pad));

// ---------------------------------------------------------------------------
// 3. Table column layout
// ---------------------------------------------------------------------------
// specs: [{ key, min, strings:[...], bold, pad, flex }]
//  - fixed columns get max(min, widest content + pad)
//  - the single `flex` column (description) takes whatever is left
// If the fixed columns would starve the description column, the font size is
// reduced step by step (down to `minSize`) so everything still fits the table.
export function layoutColumns(specs, totalWidth, size = 9, opts = {}) {
  const { pad = 8, minSize = 6.5, minFlex = 120 } = opts;
  let s = size;
  for (;;) {
    const widths = {};
    let fixed = 0;
    specs.forEach((c) => {
      if (c.flex) return;
      const need = neededWidth(c.strings || [], s, { bold: c.bold, pad: c.pad ?? pad });
      widths[c.key] = Math.max(c.min || 0, need);
      fixed += widths[c.key];
    });
    if (totalWidth - fixed >= minFlex || s <= minSize) {
      const flexCols = specs.filter((c) => c.flex);
      flexCols.forEach((c) => {
        widths[c.key] = Math.max(40, (totalWidth - fixed) / flexCols.length);
      });
      return { widths, size: s };
    }
    s -= 0.5;
  }
}

// Quantity text exactly as the templates print it.
export const qtyText = (item) =>
  item?.itemType === 'Service' ? '-' : `${item?.quantity ?? ''}${item?.unit ? ` ${item.unit}` : ''}`;

// Page-bottom reserve for a fixed footer that may grow when the business
// e-mail / phone are long (they wrap onto extra lines).
export const footerReserve = (biz, base = 75) => {
  const email = String(biz?.email || '');
  const phone = String(biz?.phone || '');
  let extra = 0;
  if (email.length > 30) extra += 10;
  if (email.length > 55) extra += 8;
  if (phone.length > 22) extra += 9;
  return base + extra;
};

// ---------------------------------------------------------------------------
// 4. Ready-made column layout for the standard item table
//    (#, description, HSN, qty, price, disc%, CGST/SGST/IGST/VAT, total)
// ---------------------------------------------------------------------------
export function standardColumns({ invoice, fmt, width, size = 9, mins = {}, pad = 8, headerPad = 0, minFlex = 120 }) {
  const items = invoice?.items || [];
  const showCGST = invoice?.cgstTotal > 0;
  const showSGST = invoice?.sgstTotal > 0;
  const showIGST = invoice?.igstTotal > 0;
  const showVAT = invoice?.vatTotal > 0;
  const hasHsn = items.some((i) => i.hsn);
  const hasDiscount = items.some((i) => i.discount > 0);
  const m = { no: 22, hsn: 50, qty: 46, price: 66, disc: 38, tax: 40, total: 74, ...mins };
  const taxCols = [showCGST && 'CGST', showSGST && 'SGST', showIGST && 'IGST', showVAT && 'VAT'].filter(Boolean);
  const hp = (t) => [t, `${t}${' '.repeat(Math.ceil(headerPad))}`];
  const specs = [
    { key: 'no', min: m.no, strings: ['#', String(items.length)] },
    { key: 'desc', flex: true },
    ...(hasHsn ? [{ key: 'hsn', min: m.hsn, strings: ['HSN', ...items.map((i) => String(i.hsn || '—'))], pad: pad + headerPad }] : []),
    { key: 'qty', min: m.qty, strings: ['Qty', ...items.map(qtyText)], pad: pad + headerPad },
    { key: 'price', min: m.price, strings: ['Price', ...items.map((i) => fmt(i.price))], pad: pad + headerPad },
    ...(hasDiscount ? [{ key: 'disc', min: m.disc, strings: ['Disc%', ...items.map((i) => `${i.discount || 0}%`)], pad: pad + headerPad }] : []),
    ...taxCols.map((k) => ({ key: k, min: m.tax, strings: [k, '100%'], pad: pad + headerPad })),
    { key: 'total', min: m.total, bold: true, strings: ['Total', ...items.map((i) => fmt(i.total))], pad: pad + headerPad },
  ];
  const { widths, size: cellSize } = layoutColumns(specs, width, size, { pad, minFlex });
  return { cw: widths, cellSize, showCGST, showSGST, showIGST, showVAT, hasHsn, hasDiscount, taxCols };
}

// Width for a "label: value" totals block (label column, value column).
export function totalsWidths(values, labels, { size = 9, bigSize = 11, bigValue, bigLabel, minVal = 80, minLab = 70, pad = 6 } = {}) {
  const val = Math.max(
    minVal,
    neededWidth(values, size, { bold: true, pad }),
    bigValue ? neededWidth([bigValue], bigSize, { bold: true, pad }) : 0
  );
  const lab = Math.max(
    minLab,
    neededWidth(labels, size, { bold: true, pad: 10 }),
    bigLabel ? neededWidth([bigLabel], bigSize, { bold: true, pad: 10 }) : 0
  );
  return { val, lab };
}
