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

// Template17 — "Modern Retail": a clean, borderless e-commerce-style invoice
// (inspired by modern retail tax invoices) — logo top-left, big doc title +
// number top-right, underline-only rows, a bold rounded total chip, and a
// slim two-tone footer with page numbers.
export default function Template17({ invoice }) {
  const { client, user: biz } = invoice;
  const colors = invoice.templateColors || { primary: '#111820' };
  const PRIMARY = colors.primary;
  const scaled = buildScaledStyles(biz);

  const s = StyleSheet.create({
    page: { paddingTop: 36, paddingBottom: 60, paddingHorizontal: 42, fontFamily: 'Inter', color: '#111', fontSize: 8.5 },
    watermarkContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: -100 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba(PRIMARY, 0.07), transform: 'rotate(-45deg)', letterSpacing: 5 },

    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    brandRow: { flexDirection: 'row', alignItems: 'center' },
    logo: { width: 40, height: 40, objectFit: 'contain', marginRight: 10 },
    bizName: { fontFamily: B, fontSize: scaled.bizNameFontSize, color: '#000', textTransform: 'uppercase' },
    bizText: { fontSize: scaled.bizSubTextFontSize, color: '#666', lineHeight: scaled.bizSubTextLineHeight, marginTop: 1 },
    titleBlock: { alignItems: 'flex-end' },
    docTag: { fontSize: 7, fontFamily: B, color: PRIMARY, letterSpacing: 2, marginBottom: 3 },
    docTitle: { fontFamily: B, fontSize: 22, color: '#000' },
    docNumber: { fontSize: 8.5, color: '#555', marginTop: 4 },

    divider: { height: 2, backgroundColor: PRIMARY, marginTop: 16, marginBottom: 16 },

    metaGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
    metaCol: { width: '31%' },
    metaLabel: { fontSize: 6.8, fontFamily: B, color: '#8A8F98', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
    metaName: { fontSize: 9, fontFamily: B, color: '#000', marginBottom: 2 },
    metaText: { fontSize: 7.8, color: '#333', lineHeight: 1.45, marginBottom: 1 },

    table: { marginTop: 4 },
    tHead: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: '#111', paddingBottom: 6, marginBottom: 4 },
    th: { fontSize: 7, fontFamily: B, color: '#000', textTransform: 'uppercase', letterSpacing: 0.4 },
    tRow: { flexDirection: 'row', paddingVertical: 9, borderBottomWidth: 0.6, borderBottomColor: '#EBEBEB' },
    td: { fontSize: 8, color: '#111' },
    colNo: { width: '5%' },
    colDesc: { width: '38%', paddingRight: 8 },
    colHsn: { width: '10%', textAlign: 'center' },
    colRate: { width: '13%', textAlign: 'right' },
    colQty: { width: '9%', textAlign: 'center' },
    colTax: { width: '11%', textAlign: 'right' },
    colTotal: { width: '14%', textAlign: 'right' },

    totalsWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
    totalsBox: { width: 220 },
    totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2.5 },
    totalLabel: { fontSize: 8, color: '#555' },
    totalVal: { fontSize: 8, fontFamily: M, color: '#111' },
    totalChip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: PRIMARY, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12, marginTop: 8 },
    totalChipLabel: { fontSize: 10, fontFamily: B, color: '#fff' },
    totalChipVal: { fontSize: 12, fontFamily: B, color: '#fff' },
    statusChip: { marginTop: 8, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 12 },
    statusDot: { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
    statusText: { fontSize: 7, fontFamily: B },

    wordsBlock: { marginTop: 16, paddingTop: 10, borderTopWidth: 0.6, borderTopColor: '#EBEBEB' },
    wordsLabel: { fontSize: 6.8, fontFamily: B, color: '#8A8F98', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
    wordsText: { fontSize: 7.8, color: '#333' },

    lowerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    noteCol: { width: '52%' },
    noteLabel: { fontSize: 6.8, fontFamily: B, color: '#8A8F98', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
    noteText: { fontSize: 7.6, color: '#333', lineHeight: 1.4, marginBottom: 8 },
    bankLine: { fontSize: 7.4, color: '#333', lineHeight: 1.4 },
    bankStrong: { fontFamily: B, color: '#000' },

    sigCol: { width: '30%', alignItems: 'flex-end' },
    sigLabel: { fontSize: 7.5, color: '#555', marginBottom: 22 },
    sigLine: { fontSize: 7.4, color: '#333', textAlign: 'center', paddingTop: 3, borderTopWidth: 0.6, borderTopColor: '#999', width: 110 },

    footerBar: { position: 'absolute', bottom: 22, left: 42, right: 42, borderTopWidth: 0.6, borderTopColor: '#DDD', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerBrand: { fontSize: 7, fontFamily: B, color: PRIMARY, letterSpacing: 0.3 },
    footerTagline: { fontSize: 6.3, color: '#888', marginTop: 1 },
    footerTrust: { fontSize: 6.5, color: '#333333' },
  });

  const currency = invoice._currency || invoice.currency || 'INR';
  const fmt = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  const bizName = biz?.businessName || biz?.name || 'Your Business';
  const isQuotation = invoice.invoiceType === 'quotation';
  const docTitle = isQuotation ? 'Quotation' : 'Tax Invoice';
  const hasHsn = invoice.items?.some(i => i.hsn);
  const totalInWords = numberToWords(Math.floor(invoice.total || 0));

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

        <View style={s.topRow}>
          <View style={s.brandRow}>
            {biz?.businessLogo && <Image src={biz.businessLogo} style={s.logo} />}
            <View>
              <Text style={s.bizName}>{bizName}</Text>
              {biz?.address?.street && <Text style={s.bizText}>{biz.address.street}</Text>}
              {biz?.address?.city && <Text style={s.bizText}>{biz.address.city}, {biz.address.state} {biz.address.pincode}</Text>}
              {(biz?.phone || biz?.email) && <Text style={s.bizText}>{biz?.phone}{biz?.phone && biz?.email ? '  •  ' : ''}{biz?.email}</Text>}
              {biz?.gstin && <Text style={s.bizText}>GSTIN {biz.gstin}</Text>}
            </View>
          </View>
          <View style={s.titleBlock}>
            <Text style={s.docTag}>ORIGINAL FOR RECIPIENT</Text>
            <Text style={s.docTitle}>{docTitle}</Text>
            <Text style={s.docNumber}>#{invoice.invoiceNumber || invoice.quotationNumber}</Text>
            <Text style={s.docNumber}>Date: {new Date(invoice.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
            {invoice.dueDate && <Text style={s.docNumber}>{isQuotation ? 'Valid until' : 'Due date'}: {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>}
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.metaGrid}>
          <View style={s.metaCol}>
            <Text style={s.metaLabel}>Bill To</Text>
            <Text style={s.metaName}>{client?.name}</Text>
            {client?.phone && <Text style={s.metaText}>Ph: {client.phone}</Text>}
            {client?.address?.street && <Text style={s.metaText}>{client.address.street}</Text>}
            {client?.address?.city && <Text style={s.metaText}>{client.address.city}, {client.address.state} {client.address.pincode}</Text>}
          </View>
          <View style={s.metaCol}>
            <Text style={s.metaLabel}>Ship To</Text>
            <Text style={s.metaName}>{client?.name}</Text>
            {client?.address?.street && <Text style={s.metaText}>{client.address.street}</Text>}
            {client?.address?.city && <Text style={s.metaText}>{client.address.city}, {client.address.state} {client.address.pincode}</Text>}
          </View>
          <View style={s.metaCol}>
            <Text style={s.metaLabel}>Place of Supply</Text>
            <Text style={s.metaText}>{invoice.placeOfSupply || client?.address?.state || '—'}</Text>
          </View>
        </View>

        <View style={s.table}>
          <View style={s.tHead}>
            <Text style={[s.th, s.colNo]}>#</Text>
            <Text style={[s.th, s.colDesc]}>Item</Text>
            {hasHsn && <Text style={[s.th, s.colHsn]}>HSN/SAC</Text>}
            <Text style={[s.th, s.colRate]}>Rate/Item</Text>
            <Text style={[s.th, s.colQty]}>Qty</Text>
            <Text style={[s.th, s.colTax]}>Tax</Text>
            <Text style={[s.th, s.colTotal]}>Amount</Text>
          </View>
          {invoice.items?.map((item, i) => {
            const rate = (item.cgstRate || 0) + (item.sgstRate || 0) + (item.igstRate || 0) + (item.vatRate || 0);
            return (
              <View key={i} style={s.tRow}>
                <Text style={[s.td, s.colNo]}>{i + 1}</Text>
                <View style={s.colDesc}>
                  <Text style={[s.td, { fontFamily: B }]}>{item.name}</Text>
                  {item.description && <Text style={{ fontSize: 6.8, color: '#777', marginTop: 2 }}>{item.description}</Text>}
                </View>
                {hasHsn && <Text style={[s.td, s.colHsn]}>{item.hsn || '—'}</Text>}
                <Text style={[s.td, s.colRate]}>{fmt(item.price)}</Text>
                <Text style={[s.td, s.colQty]}>{item.itemType === 'Service' ? '-' : item.quantity}</Text>
                <Text style={[s.td, s.colTax]}>{rate}%</Text>
                <Text style={[s.td, s.colTotal, { fontFamily: B }]}>{fmt(item.total)}</Text>
              </View>
            );
          })}
        </View>

        <View style={s.totalsWrap}>
          <View style={s.totalsBox}>
            <View style={s.totalLine}><Text style={s.totalLabel}>Taxable Amount</Text><Text style={s.totalVal}>{fmt(invoice.subtotal - (invoice.discountAmount || 0))}</Text></View>
            {invoice.discountAmount > 0 && <View style={s.totalLine}><Text style={s.totalLabel}>Discount</Text><Text style={s.totalVal}>-{fmt(invoice.discountAmount)}</Text></View>}
            {invoice.cgstTotal > 0 && <View style={s.totalLine}><Text style={s.totalLabel}>CGST</Text><Text style={s.totalVal}>{fmt(invoice.cgstTotal)}</Text></View>}
            {invoice.sgstTotal > 0 && <View style={s.totalLine}><Text style={s.totalLabel}>SGST</Text><Text style={s.totalVal}>{fmt(invoice.sgstTotal)}</Text></View>}
            {invoice.igstTotal > 0 && <View style={s.totalLine}><Text style={s.totalLabel}>IGST</Text><Text style={s.totalVal}>{fmt(invoice.igstTotal)}</Text></View>}
            {invoice.vatTotal > 0 && <View style={s.totalLine}><Text style={s.totalLabel}>VAT</Text><Text style={s.totalVal}>{fmt(invoice.vatTotal)}</Text></View>}
            <View style={s.totalChip}>
              <Text style={s.totalChipLabel}>{isQuotation ? 'Estimated Total' : 'Total'}</Text>
              <Text style={s.totalChipVal}>{currency} {fmt(invoice.total)}</Text>
            </View>
            {!isQuotation && paidAmount > 0 && (
              isFullyPaid ? (
                <View style={[s.statusChip, { backgroundColor: '#E8F5EC' }]}><View style={[s.statusDot, { backgroundColor: '#2E7D46' }]} /><Text style={[s.statusText, { color: '#2E7D46' }]}>Amount Paid</Text></View>
              ) : (
                <View style={[s.statusChip, { backgroundColor: '#FDECEC' }]}><View style={[s.statusDot, { backgroundColor: '#C43D3D' }]} /><Text style={[s.statusText, { color: '#C43D3D' }]}>Balance Due {currency} {fmt(balanceDue)}</Text></View>
              )
            )}
          </View>
        </View>

        <View style={s.wordsBlock}>
          <Text style={s.wordsLabel}>Amount in Words</Text>
          <Text style={s.wordsText}>{currency} {totalInWords} Only</Text>
        </View>

        <View style={s.lowerRow}>
          <View style={s.noteCol}>
            {invoice.notes && (<><Text style={s.noteLabel}>Notes</Text><Text style={s.noteText}>{invoice.notes}</Text></>)}
            {invoice.termsAndConditions && (<><Text style={s.noteLabel}>Terms & Conditions</Text><Text style={s.noteText}>{invoice.termsAndConditions}</Text></>)}
            {biz?.bankDetails?.accountNumber ? (
              <>
                <Text style={s.noteLabel}>Bank Details</Text>
                <Text style={s.bankLine}>{biz.bankDetails.bankName ? <Text style={s.bankStrong}>{biz.bankDetails.bankName}</Text> : null}{biz.bankDetails.bankName ? '\n' : ''}A/C: {biz.bankDetails.accountNumber}{biz.bankDetails.ifscCode ? `  •  IFSC: ${biz.bankDetails.ifscCode}` : ''}{biz.bankDetails.branch ? `\nBranch: ${biz.bankDetails.branch}` : ''}</Text>
              </>
            ) : invoice.paymentInfo ? (
              <><Text style={s.noteLabel}>Payment Info</Text><Text style={s.bankLine}>{invoice.paymentInfo}</Text></>
            ) : null}
          </View>
          <View style={s.sigCol}>
            <Text style={s.sigLabel}>For {bizName}</Text>
            {biz?.businessSignature && <Image src={biz.businessSignature} style={{ width: 100, height: 34, objectFit: 'contain', marginBottom: 2 }} />}
            <Text style={s.sigLine}>Authorised Signatory</Text>
            {biz?.businessSeal && <Image src={biz.businessSeal} style={{ width: 60, height: 60, objectFit: 'contain', marginTop: 6 }} />}
          </View>
        </View>

        <View style={s.footerBar} fixed>
          <View>
            <Text style={s.footerBrand}>Powered by GoodSynk<Text style={{ fontSize: 7, fontFamily: 'Helvetica' }}>™</Text></Text>
            <Text style={s.footerTagline}>Simple Invoicing, Billing & Quotations</Text>
          </View>
          <Text
            style={s.footerTrust}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
