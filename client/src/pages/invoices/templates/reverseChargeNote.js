// Builds the mandatory GST reverse-charge note that must appear on a
// generated invoice/quotation whenever "Is Reverse Charge Applicable?" is
// checked in Configure Tax. Kept as a single source of truth so every
// template (Template1..Template20, DocumentTemplate, etc.) shows identical
// wording — see TemplateResolver.jsx, which injects this into invoice.notes
// before handing the invoice off to the chosen template.

const fmtAmount = (n) => {
  const num = Number(n) || 0;
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Text mirrors the firm's standard reverse-charge disclosure, with the
// placeholder amounts filled in from the invoice's actual computed tax
// totals instead of the blank "LLLLL" / "ZZZZZ" markers.
export const buildReverseChargeNote = (invoice) => {
  const isInterstate = Boolean(invoice?.isInterstate);
  const sgst = invoice?.sgstTotal || 0;
  const cgst = invoice?.cgstTotal || 0;
  const igst = invoice?.igstTotal || 0;

  const base = 'Services Provided by the firm of advocates by way of legal services, ' +
    'directly or indirectly is to be paid by the recipient of the service 100%, ' +
    'on REVERSE CHARGE basis in India as per GST Law. The applicable GST is 18% ' +
    'which would amount to';

  if (isInterstate) {
    return `${base} IGST@18% (Rs. ${fmtAmount(igst)}).`;
  }
  return `${base} SGST@9% (Rs. ${fmtAmount(sgst)}) and CGST@9% (Rs. ${fmtAmount(cgst)}).`;
};

// Appends the reverse-charge note to the invoice's notes (idempotent — will
// not duplicate the note if it's already present, e.g. on a re-render).
export const withReverseChargeNote = (invoice) => {
  if (!invoice || !invoice.reverseCharge) return invoice;

  const note = buildReverseChargeNote(invoice);
  const existingNotes = invoice.notes || '';

  if (existingNotes.includes('REVERSE CHARGE basis in India as per GST Law')) {
    return invoice;
  }

  return {
    ...invoice,
    notes: existingNotes ? `${existingNotes}\n${note}` : note,
  };
};
