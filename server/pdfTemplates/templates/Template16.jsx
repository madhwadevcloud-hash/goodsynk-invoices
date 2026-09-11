import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { buildScaledStyles } from './Pdfheaderscaling';

Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf' });
Font.register({ family: 'Inter-SemiBold', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf' });
Font.register({ family: 'Inter-Bold', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf' });
Font.registerHyphenationCallback(word => [word]);

const B = 'Inter-Bold';
const M = 'Inter-SemiBold';

const hexToRgba = (hex, alpha) => {
  if (!hex) return 'rgba(0, 0, 0, ' + alpha + ')';
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
};

function numberToWords(num) {
  if (!num) return 'Zero';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  let numStr = String(num).split('.')[0];
  if (numStr.length > 9) return String(num);
  if (numStr.length === 0) return 'Zero';
  const getGroup = (nStr) => {
    let w = '';
    const n = parseInt(nStr, 10);
    if (n > 99) w += a[Math.floor(n / 100)] + 'Hundred ';
    const rem = n % 100;
    if (rem > 0) {
      if (rem < 20) w += a[rem];
      else { w += b[Math.floor(rem / 10)] + ' '; if (rem % 10 > 0) w += a[rem % 10]; }
    }
    return w;
  };
  let crores = 0, lakhs = 0, thousands = 0, rest = 0;
  if (numStr.length > 7) { crores = parseInt(numStr.substring(0, numStr.length - 7), 10); numStr = numStr.substring(numStr.length - 7); }
  if (numStr.length > 5) { lakhs = parseInt(numStr.substring(0, numStr.length - 5), 10); numStr = numStr.substring(numStr.length - 5); }
  if (numStr.length > 3) { thousands = parseInt(numStr.substring(0, numStr.length - 3), 10); numStr = numStr.substring(numStr.length - 3); }
  rest = parseInt(numStr, 10);
  let words = '';
  if (crores) words += getGroup(String(crores)) + 'Crore ';
  if (lakhs) words += getGroup(String(lakhs)) + 'Lakh ';
  if (thousands) words += getGroup(String(thousands)) + 'Thousand ';
  if (rest) words += getGroup(String(rest));
  return words.trim();
}

// Template16 — "Formal Tax Invoice": a structured, fully-bordered GST tax
// invoice layout (inspired by classic corporate tax invoices) with a boxed
// item grid, separate Bill-to / Ship-to blocks, place of supply, an
// amount-in-words strip, an Amount Paid / Amount Due badge, bank + branch
// details, dynamic logo/signature/seal and page numbers.
export default function Template16({ invoice }) {
  const { client, user: biz } = invoice;
  const colors = invoice.templateColors || { primary: '#1F4B3F' };
  const PRIMARY = colors.primary;
  const scaled = buildScaledStyles(biz);

  const s = StyleSheet.create({
    page: { paddingTop: 28, paddingBottom: 60, paddingHorizontal: 34, fontFamily: 'Inter', color: '#1a1a1a', fontSize: 8.5 },
    watermarkContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: -100 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba(PRIMARY, 0.08), transform: 'rotate(-45deg)', letterSpacing: 5 },

    outerBox: { borderWidth: 1, borderColor: PRIMARY },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: PRIMARY },
    docTypeTag: { position: 'absolute', top: -10, right: 12, backgroundColor: PRIMARY, color: '#fff', fontFamily: B, fontSize: 9, letterSpacing: 1.5, paddingVertical: 3, paddingHorizontal: 10 },
    brandRow: { flexDirection: 'row', alignItems: 'flex-start' },
    logo: { width: 34, height: 34, objectFit: 'contain', marginRight: 8 },
    bizName: { fontFamily: B, fontSize: scaled.bizNameFontSize, color: PRIMARY, textTransform: 'uppercase', marginBottom: 2 },
    bizText: { fontSize: scaled.bizSubTextFontSize, color: '#444', lineHeight: scaled.bizSubTextLineHeight },
    metaBlock: { alignItems: 'flex-end' },
    metaRow: { flexDirection: 'row', marginBottom: 2 },
    metaLabel: { fontSize: 7.5, color: '#555', width: 78, textAlign: 'right', marginRight: 4 },
    metaVal: { fontSize: 7.5, fontFamily: B, color: '#000', textAlign: 'right' },

    partiesRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: PRIMARY },
    partyCol: { flex: 1, padding: 10, borderRightWidth: 1, borderRightColor: PRIMARY },
    partyColLast: { flex: 1, padding: 10 },
    partyLabel: { fontSize: 7, fontFamily: B, color: PRIMARY, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    partyName: { fontSize: 8.5, fontFamily: B, color: '#000', marginBottom: 2 },
    partyText: { fontSize: 7.5, color: '#333', lineHeight: 1.4, marginBottom: 1 },

    table: {},
    tHead: { flexDirection: 'row', backgroundColor: PRIMARY, paddingVertical: 5 },
    th: { fontSize: 6.8, fontFamily: B, color: '#fff', textTransform: 'uppercase', paddingHorizontal: 3 },
    tRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#D8DEDC', paddingVertical: 5, minHeight: 18 },
    td: { fontSize: 7.5, color: '#111', paddingHorizontal: 3 },
    colNo: { width: '5%', textAlign: 'center' },
    colDesc: { width: '31%' },
    colHsn: { width: '10%', textAlign: 'center' },
    colRate: { width: '11%', textAlign: 'right' },
    colQty: { width: '8%', textAlign: 'center' },
    colTaxable: { width: '12%', textAlign: 'right' },
    colTax: { width: '13%', textAlign: 'right' },
    colTotal: { width: '10%', textAlign: 'right', paddingRight: 6 },

    wordsStrip: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: PRIMARY, borderBottomWidth: 1, borderBottomColor: PRIMARY, padding: 8, backgroundColor: hexToRgba(PRIMARY, 0.05) },
    wordsText: { fontSize: 7, color: '#333', flex: 1, paddingRight: 10 },

    totalsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    notesCol: { flex: 1, padding: 10, borderRightWidth: 1, borderRightColor: PRIMARY },
    totalsCol: { width: 190, padding: 10 },
    totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    totalLabel: { fontSize: 7.5, color: '#333' },
    totalVal: { fontSize: 7.5, fontFamily: M, color: '#000' },
    grandLine: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: PRIMARY, padding: 6, marginTop: 6 },
    grandLabel: { fontSize: 9.5, fontFamily: B, color: '#fff' },
    grandVal: { fontSize: 9.5, fontFamily: B, color: '#fff' },
    paidBadge: { marginTop: 6, alignSelf: 'flex-end', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3, backgroundColor: '#E8F5EC', flexDirection: 'row', alignItems: 'center' },
    paidBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#2E7D46', marginRight: 4 },
    paidBadgeText: { fontSize: 7, fontFamily: B, color: '#2E7D46' },
    dueBadge: { marginTop: 6, alignSelf: 'flex-end', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3, backgroundColor: '#FDECEC', flexDirection: 'row', alignItems: 'center' },
    dueBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#C43D3D', marginRight: 4 },
    dueBadgeText: { fontSize: 7, fontFamily: B, color: '#C43D3D' },

    noteLabel: { fontSize: 7, fontFamily: B, color: PRIMARY, textTransform: 'uppercase', marginBottom: 3 },
    noteText: { fontSize: 7.2, color: '#333', lineHeight: 1.4, marginBottom: 6 },

    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: PRIMARY },
    bankCol: { flex: 1, padding: 10, borderRightWidth: 1, borderRightColor: PRIMARY },
    bankLabel: { fontSize: 7, fontFamily: B, color: PRIMARY, textTransform: 'uppercase', marginBottom: 4 },
    bankRow: { flexDirection: 'row', marginBottom: 1.5 },
    bankKey: { fontSize: 7, color: '#555', width: 55 },
    bankVal: { fontSize: 7, fontFamily: M, color: '#000' },
    sigCol: { width: 170, padding: 10, alignItems: 'center' },
    sigFor: { fontSize: 7, color: '#555', marginBottom: 20 },
    sigLine: { fontSize: 7, color: '#333', textAlign: 'center', paddingTop: 3, borderTopWidth: 0.5, borderTopColor: '#999', width: 130 },

    footerNote: { marginTop: 10, textAlign: 'center' },
    footerNoteText: { fontSize: 6.3, color: '#888' },
    footerBar: { position: 'absolute', bottom: 20, left: 34, right: 34, borderTopWidth: 0.5, borderTopColor: '#DDD', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
    footerBrand: { fontSize: 6.8, fontFamily: B, color: PRIMARY },
    footerTrust: { fontSize: 6.5, color: '#333333' },
  });

  const currency = invoice._currency || invoice.currency || 'INR';
  const fmt = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  const bizName = biz?.businessName || biz?.name || 'Your Business';
  const isQuotation = invoice.invoiceType === 'quotation';
  const docTitle = isQuotation ? 'QUOTATION' : 'TAX INVOICE';

  const hasHsn = invoice.items?.some(i => i.hsn);
  const totalInWords = numberToWords(Math.floor(invoice.total || 0));
  const totalQty = invoice.items?.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0) || 0;

  const paidAmount = invoice.paidAmount || 0;
  const balanceDue = Math.max((invoice.total || 0) - paidAmount, 0);
  const isFullyPaid = !isQuotation && paidAmount > 0 && balanceDue <= 0.01;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {(!biz?.plan || String(biz.plan).toLowerCase() === 'free') && (
          <View style={s.watermarkContainer} pointerEvents="none" fixed>
            <Text style={s.watermarkText}>GoodSynk</Text>
          </View>
        )}

        <View style={s.outerBox}>
          {/* Header */}
          <View style={s.headerRow}>
            <View style={s.brandRow}>
              {biz?.businessLogo && <Image src={biz.businessLogo} style={s.logo} />}
              <View>
                <Text style={s.bizName}>{bizName}</Text>
                {biz?.gstin && <Text style={s.bizText}>GSTIN: {biz.gstin}</Text>}
                {biz?.address?.street && <Text style={s.bizText}>{biz.address.street}</Text>}
                {biz?.address?.city && <Text style={s.bizText}>{biz.address.city}, {biz.address.state} {biz.address.pincode}</Text>}
                {biz?.phone && <Text style={s.bizText}>Mobile {biz.phone}</Text>}
              </View>
            </View>
            <View style={s.metaBlock}>
              <View style={s.docTypeTag}><Text>{docTitle}</Text></View>
              <View style={{ marginTop: 8 }}>
                <View style={s.metaRow}><Text style={s.metaLabel}>{isQuotation ? 'Quotation #' : 'Invoice #'}</Text><Text style={s.metaVal}>{invoice.invoiceNumber || invoice.quotationNumber}</Text></View>
                <View style={s.metaRow}><Text style={s.metaLabel}>Date</Text><Text style={s.metaVal}>{new Date(invoice.issueDate).toLocaleDateString('en-GB')}</Text></View>
                {invoice.dueDate && <View style={s.metaRow}><Text style={s.metaLabel}>{isQuotation ? 'Valid Until' : 'Due Date'}</Text><Text style={s.metaVal}>{new Date(invoice.dueDate).toLocaleDateString('en-GB')}</Text></View>}
                {invoice.placeOfSupply && <View style={s.metaRow}><Text style={s.metaLabel}>Place of Supply</Text><Text style={s.metaVal}>{invoice.placeOfSupply}</Text></View>}
              </View>
            </View>
          </View>

          {/* Bill to / Ship to */}
          <View style={s.partiesRow}>
            <View style={s.partyCol}>
              <Text style={s.partyLabel}>Bill To</Text>
              <Text style={s.partyName}>{client?.name}</Text>
              {client?.companyName && <Text style={s.partyText}>{client.companyName}</Text>}
              {client?.address?.street && <Text style={s.partyText}>{client.address.street}</Text>}
              {client?.address?.city && <Text style={s.partyText}>{client.address.city}, {client.address.state} {client.address.pincode}</Text>}
              {client?.phone && <Text style={s.partyText}>Ph: {client.phone}</Text>}
              {client?.gstin && <Text style={s.partyText}>GSTIN: {client.gstin}</Text>}
            </View>
            <View style={s.partyColLast}>
              <Text style={s.partyLabel}>Ship To</Text>
              <Text style={s.partyName}>{client?.name}</Text>
              {client?.address?.street && <Text style={s.partyText}>{client.address.street}</Text>}
              {client?.address?.city && <Text style={s.partyText}>{client.address.city}, {client.address.state} {client.address.pincode}</Text>}
              {!client?.address?.street && <Text style={s.partyText}>Same as billing address</Text>}
            </View>
          </View>

          {/* Table */}
          <View style={s.table}>
            <View style={s.tHead}>
              <Text style={[s.th, s.colNo]}>#</Text>
              <Text style={[s.th, s.colDesc]}>Item</Text>
              {hasHsn && <Text style={[s.th, s.colHsn]}>HSN/SAC</Text>}
              <Text style={[s.th, s.colRate]}>Rate/Item</Text>
              <Text style={[s.th, s.colQty]}>Qty</Text>
              <Text style={[s.th, s.colTaxable]}>Taxable Value</Text>
              <Text style={[s.th, s.colTax]}>Tax Amount</Text>
              <Text style={[s.th, s.colTotal]}>Amount</Text>
            </View>
            {invoice.items?.map((item, i) => {
              const taxAmt = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0) + (item.vatAmount || 0);
              const taxable = (item.price * item.quantity) - (item.discountAmount || 0);
              const rate = (item.cgstRate || 0) + (item.sgstRate || 0) + (item.igstRate || 0) + (item.vatRate || 0);
              return (
                <View key={i} style={s.tRow}>
                  <Text style={[s.td, s.colNo]}>{i + 1}</Text>
                  <View style={s.colDesc}>
                    <Text style={[s.td, { fontFamily: B }]}>{item.name}</Text>
                    {item.description && <Text style={{ fontSize: 6.5, color: '#666', marginTop: 1 }}>{item.description}</Text>}
                  </View>
                  {hasHsn && <Text style={[s.td, s.colHsn]}>{item.hsn || '—'}</Text>}
                  <Text style={[s.td, s.colRate]}>{fmt(item.price)}</Text>
                  <Text style={[s.td, s.colQty]}>{item.itemType === 'Service' ? '-' : item.quantity}</Text>
                  <Text style={[s.td, s.colTaxable]}>{fmt(taxable)}</Text>
                  <Text style={[s.td, s.colTax]}>{fmt(taxAmt)}{rate ? ` (${rate}%)` : ''}</Text>
                  <Text style={[s.td, s.colTotal, { fontFamily: B }]}>{fmt(item.total)}</Text>
                </View>
              );
            })}
          </View>

          {/* Words strip */}
          <View style={s.wordsStrip}>
            <Text style={s.wordsText}>Total Items / Qty : {invoice.items?.length || 0} / {totalQty}</Text>
            <Text style={s.wordsText}>Amount in Words: {currency} {totalInWords} Only</Text>
          </View>

          {/* Notes + totals */}
          <View style={s.totalsRow}>
            <View style={s.notesCol}>
              {invoice.notes && (<><Text style={s.noteLabel}>Notes</Text><Text style={s.noteText}>{invoice.notes}</Text></>)}
              {invoice.termsAndConditions && (<><Text style={s.noteLabel}>Terms & Conditions</Text><Text style={s.noteText}>{invoice.termsAndConditions}</Text></>)}
            </View>
            <View style={s.totalsCol}>
              <View style={s.totalLine}><Text style={s.totalLabel}>Taxable Amount</Text><Text style={s.totalVal}>{fmt(invoice.subtotal - (invoice.discountAmount || 0))}</Text></View>
              {invoice.discountAmount > 0 && <View style={s.totalLine}><Text style={s.totalLabel}>Discount</Text><Text style={s.totalVal}>-{fmt(invoice.discountAmount)}</Text></View>}
              {invoice.cgstTotal > 0 && <View style={s.totalLine}><Text style={s.totalLabel}>CGST</Text><Text style={s.totalVal}>{fmt(invoice.cgstTotal)}</Text></View>}
              {invoice.sgstTotal > 0 && <View style={s.totalLine}><Text style={s.totalLabel}>SGST</Text><Text style={s.totalVal}>{fmt(invoice.sgstTotal)}</Text></View>}
              {invoice.igstTotal > 0 && <View style={s.totalLine}><Text style={s.totalLabel}>IGST</Text><Text style={s.totalVal}>{fmt(invoice.igstTotal)}</Text></View>}
              {invoice.vatTotal > 0 && <View style={s.totalLine}><Text style={s.totalLabel}>VAT</Text><Text style={s.totalVal}>{fmt(invoice.vatTotal)}</Text></View>}
              <View style={s.grandLine}><Text style={s.grandLabel}>Total</Text><Text style={s.grandVal}>{currency} {fmt(invoice.total)}</Text></View>
              {!isQuotation && paidAmount > 0 && (
                isFullyPaid ? (
                  <View style={s.paidBadge}><View style={s.paidBadgeDot} /><Text style={s.paidBadgeText}>Amount Paid</Text></View>
                ) : (
                  <View style={s.dueBadge}><View style={s.dueBadgeDot} /><Text style={s.dueBadgeText}>Balance Due: {currency} {fmt(balanceDue)}</Text></View>
                )
              )}
            </View>
          </View>

          {/* Bank + signature */}
          <View style={s.bottomRow}>
            <View style={s.bankCol}>
              {biz?.bankDetails?.accountNumber ? (
                <>
                  <Text style={s.bankLabel}>Bank Details</Text>
                  {biz.bankDetails.bankName && <View style={s.bankRow}><Text style={s.bankKey}>Bank:</Text><Text style={s.bankVal}>{biz.bankDetails.bankName}</Text></View>}
                  <View style={s.bankRow}><Text style={s.bankKey}>Account #:</Text><Text style={s.bankVal}>{biz.bankDetails.accountNumber}</Text></View>
                  {biz.bankDetails.ifscCode && <View style={s.bankRow}><Text style={s.bankKey}>IFSC:</Text><Text style={s.bankVal}>{biz.bankDetails.ifscCode}</Text></View>}
                  {biz.bankDetails.branch && <View style={s.bankRow}><Text style={s.bankKey}>Branch:</Text><Text style={s.bankVal}>{biz.bankDetails.branch}</Text></View>}
                </>
              ) : invoice.paymentInfo ? (
                <><Text style={s.bankLabel}>Payment Info</Text><Text style={s.bankVal}>{invoice.paymentInfo}</Text></>
              ) : null}
            </View>
            <View style={s.sigCol}>
              <Text style={s.sigFor}>For {bizName}</Text>
              {biz?.businessSignature && <Image src={biz.businessSignature} style={{ width: 100, height: 36, objectFit: 'contain', marginBottom: 2 }} />}
              <Text style={s.sigLine}>Authorised Signatory</Text>
              {biz?.businessSeal && <Image src={biz.businessSeal} style={{ width: 62, height: 62, objectFit: 'contain', marginTop: 6 }} />}
            </View>
          </View>

          <View style={s.footerNote}>
            <Text style={s.footerNoteText}>This is a computer generated document and does not require a physical signature.</Text>
          </View>
        </View>

        <View style={s.footerBar} fixed>
          <Text style={s.footerBrand}>Powered by GoodSynk<Text style={{ fontSize: 7, fontFamily: 'Helvetica' }}>™</Text> — Simple Invoicing, Billing & Quotations</Text>
          <Text
            style={s.footerTrust}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
