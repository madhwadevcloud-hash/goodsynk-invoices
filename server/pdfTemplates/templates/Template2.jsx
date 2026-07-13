import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf' });
Font.register({ family: 'Inter-SemiBold', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf' });
Font.register({ family: 'Inter-Bold', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf' });

const B = 'Inter-Bold';
const M = 'Inter-SemiBold';


const hexToRgba = (hex, alpha) => {
  if (!hex) return 'rgba(0, 0, 0, ' + alpha + ')';
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
};

export default function Template2({ invoice }) {
  const { client, user: biz } = invoice;
  const colors = invoice.templateColors || { primary: '#000000' };
  const PRIMARY = colors.primary;

  const s = StyleSheet.create({
    page: { paddingTop: 50, paddingBottom: 100, paddingHorizontal: 40, fontFamily: 'Inter', color: '#000' },

    topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    bizBox: { maxWidth: '60%' },
    logoImg: { height: 45, maxWidth: 140, objectFit: 'contain', marginBottom: 6 },
    bizName: { fontFamily: B, fontSize: 13, color: '#000', textTransform: 'uppercase', marginBottom: 2 },
    bizSubText: { fontSize: 8.5, color: '#444', marginTop: 1, lineHeight: 1.3 },

    titleBox: { alignItems: 'flex-end' },
    headerText: { fontFamily: M, fontSize: 26, letterSpacing: 4, textTransform: 'uppercase', color: '#000' },

    headerLine: { width: '100%', height: 1, backgroundColor: PRIMARY, marginVertical: 10 },

    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, marginBottom: 25 },
    detailsItem: { flex: 1 },
    detailsLabel: { fontSize: 7.5, fontFamily: B, textTransform: 'uppercase', color: '#666', marginBottom: 2 },
    detailsValue: { fontSize: 9.5, color: '#000' },

    metaGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    metaColumn: { width: '45%' },
    metaTitle: { fontFamily: B, fontSize: 8.5, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, color: '#333' },
    metaText: { fontSize: 8.5, color: '#444', marginBottom: 3, lineHeight: 1.4 },
    clientName: { fontSize: 11, fontFamily: B, color: '#000', marginBottom: 2 },

    table: { width: '100%', marginBottom: 20 },
    tHeadRow: { flexDirection: 'row', borderBottom: `1pt solid ${PRIMARY}`, paddingBottom: 8, marginBottom: 12 },
    tRow: { flexDirection: 'row', marginBottom: 10 },
    th: { fontSize: 9, fontFamily: B, letterSpacing: 1, textTransform: 'uppercase' },
    td: { fontSize: 9, color: '#000' },

    colNo: { flex: 0.4 },
    colDesc: { flex: 2 },
    colHsn: { flex: 0.7, textAlign: 'center' },
    colPrice: { flex: 1, textAlign: 'right' },
    colQty: { flex: 0.8, textAlign: 'center' },
    colDisc: { flex: 0.6, textAlign: 'center' },
    colTax: { flex: 0.7, textAlign: 'center' },
    colTotal: { flex: 1, textAlign: 'right' },

    totalsArea: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTop: `1pt solid ${PRIMARY}`, paddingTop: 12 },
    notesArea: { width: '50%' },
    calcArea: { width: '40%' },

    calcRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 6 },
    calcLabel: { fontFamily: B, fontSize: 9, textTransform: 'uppercase', marginRight: 20 },
    calcVal: { fontSize: 9.5, fontFamily: B, width: 60, textAlign: 'right' },

    signatureArea: { marginTop: 40, alignItems: 'flex-end', paddingRight: 40 },
    signatureLine: { width: 120, borderTopWidth: 0.5, borderTopColor: '#000', borderTopStyle: 'solid', paddingTop: 6, alignItems: 'center' },
    footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'column', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#999', borderTopStyle: 'solid', paddingTop: 8 },
    watermarkContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: -100,
    },
    watermarkText: {
      fontSize: 60,
      fontFamily: B,
      color: hexToRgba(PRIMARY, 0.08),
      transform: 'rotate(-45deg)',
      letterSpacing: 5,
    },
    footerText: { fontSize: 8, color: '#333' },
  });
  const currency = invoice._currency || invoice.currency || 'INR';
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'code' }).format(n || 0).replace(currency, '').trim();

  const bizName = biz?.businessName || biz?.name || '';
  const isQuotation = invoice.invoiceType === 'quotation';
  const docTitle = isQuotation ? 'QUOTATION' : 'INVOICE';

  const showCGST = invoice.cgstTotal > 0;
  const showSGST = invoice.sgstTotal > 0;
  const showIGST = invoice.igstTotal > 0;
  const showVAT = invoice.vatTotal > 0;
  const hasTax = showCGST || showSGST || showIGST || showVAT;
  const hasHsn = invoice.items?.some(i => i.hsn);
  const hasDiscount = invoice.items?.some(i => i.discount > 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Watermark */}
        {biz?.plan !== 'premium' && (
          <View style={s.watermarkContainer} pointerEvents="none">
            <Text style={s.watermarkText}>GoodSynk</Text>
          </View>
        )}

        {/* Top Header */}
        <View style={s.topHeader}>
          <View style={s.bizBox}>
            {biz?.businessLogo && <Image src={biz.businessLogo} style={s.logoImg} />}
            <Text style={s.bizName}>{bizName}</Text>
            {biz?.address?.street && <Text style={s.bizSubText}>{biz.address.street}</Text>}
            {biz?.address?.city && (
              <Text style={s.bizSubText}>
                {biz.address.city}, {biz.address.state} {biz.address.pincode}
              </Text>
            )}
            {biz?.gstin && <Text style={[s.bizSubText, { fontFamily: B }]}>GSTIN: {biz.gstin}</Text>}
          </View>
          <View style={s.titleBox}>
            <Text style={s.headerText}>{docTitle}</Text>
          </View>
        </View>

        {/* Separator Line */}
        <View style={s.headerLine} />

        {/* Invoice Details Row */}
        <View style={s.detailsRow}>
          <View style={s.detailsItem}>
            <Text style={s.detailsLabel}>{isQuotation ? 'Quotation No' : 'Invoice No'}</Text>
            <Text style={s.detailsValue} wrap={false}>{invoice.invoiceNumber || invoice.quotationNumber}</Text>
          </View>
          <View style={s.detailsItem}>
            <Text style={s.detailsLabel}>Date of Issue</Text>
            <Text style={s.detailsValue} wrap={false}>{new Date(invoice.issueDate).toLocaleDateString()}</Text>
          </View>
          <View style={s.detailsItem}>
            <Text style={s.detailsLabel}>Due Date</Text>
            <Text style={s.detailsValue} wrap={false}>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon Receipt'}</Text>
          </View>
        </View>

        {/* Meta Grid: Client & Payment */}
        <View style={s.metaGrid}>
          <View style={s.metaColumn}>
            <Text style={s.metaTitle}>Bill To:</Text>
            <Text style={s.clientName}>{client?.name}</Text>
            {client?.address?.street && <Text style={s.metaText}>{client.address.street}</Text>}
            {client?.address?.city && (
              <Text style={s.metaText}>
                {client.address.city}, {client.address.state} {client.address.pincode || ''}
              </Text>
            )}
            {client?.phone && <Text style={s.metaText}>Phone: {client.phone}</Text>}
          </View>

          <View style={s.metaColumn}>
            <Text style={s.metaTitle}>Payment Details:</Text>
            {(!isQuotation && biz?.bankDetails?.accountNumber) ? (
              <>
                {biz.bankDetails.bankName && <Text style={s.metaText}>Bank: {biz.bankDetails.bankName}</Text>}
                <Text style={s.metaText}>A/C Name: {biz.bankDetails.accountName}</Text>
                <Text style={s.metaText}>A/C No: {biz.bankDetails.accountNumber}</Text>
                {biz.bankDetails.ifscCode && <Text style={s.metaText}>IFSC: {biz.bankDetails.ifscCode}</Text>}
              </>
            ) : (
              <Text style={s.metaText}>{invoice.paymentInfo || '—'}</Text>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={s.table}>
          <View style={s.tHeadRow}>
            <Text style={[s.th, s.colNo]}>#</Text>
            <Text style={[s.th, s.colDesc]}>Item Description</Text>
            {hasHsn && <Text style={[s.th, s.colHsn]}>HSN</Text>}
            <Text style={[s.th, s.colQty]}>Qty</Text>
            <Text style={[s.th, s.colPrice]}>Price</Text>
            {hasDiscount && <Text style={[s.th, s.colDisc]}>Disc%</Text>}
            {showCGST && <Text style={[s.th, s.colTax]}>CGST</Text>}
            {showSGST && <Text style={[s.th, s.colTax]}>SGST</Text>}
            {showIGST && <Text style={[s.th, s.colTax]}>IGST</Text>}
            {showVAT && <Text style={[s.th, s.colTax]}>VAT</Text>}
            <Text style={[s.th, s.colTotal]}>Total</Text>
          </View>

          {invoice.items?.map((item, i) => (
            <View key={i} style={s.tRow}>
              <Text style={[s.td, s.colNo]}>{i + 1}</Text>
              <View style={s.colDesc}>
                <Text style={[s.td, { fontFamily: B }]}>{item.name}</Text>
                {item.description && <Text style={{ fontSize: 7.5, color: '#333', marginTop: 1 }}>{item.description}</Text>}
              </View>
              {hasHsn && <Text style={[s.td, s.colHsn]}>{item.hsn || '—'}</Text>}
              <Text style={[s.td, s.colQty]}>{item.itemType === 'Service' ? '-' : `${item.quantity}${item.unit ? ` ${item.unit}` : ''}`}</Text>
              <Text style={[s.td, s.colPrice]}>{fmt(item.price)}</Text>
              {hasDiscount && <Text style={[s.td, s.colDisc]}>{item.discount || 0}%</Text>}
              {showCGST && <Text style={[s.td, s.colTax]}>{item.cgstRate || 0}%</Text>}
              {showSGST && <Text style={[s.td, s.colTax]}>{item.sgstRate || 0}%</Text>}
              {showIGST && <Text style={[s.td, s.colTax]}>{item.igstRate || 0}%</Text>}
              {showVAT && <Text style={[s.td, s.colTax]}>{item.vatRate || 0}%</Text>}
              <Text style={[s.td, s.colTotal, { fontFamily: B }]}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totalsArea}>
          <View style={s.notesArea}>
            {invoice.notes && (
              <>
                <Text style={[s.metaTitle, { marginBottom: 4 }]}>Notes</Text>
                <Text style={[s.metaText, { fontSize: 8 }]}>{invoice.notes}</Text>
              </>
            )}
            {invoice.termsAndConditions && (
              <>
                <Text style={[s.metaTitle, { marginTop: 10, marginBottom: 4 }]}>Terms</Text>
                <Text style={[s.metaText, { fontSize: 8 }]}>{invoice.termsAndConditions}</Text>
              </>
            )}
          </View>
          <View style={s.calcArea}>
            <View style={s.calcRow}><Text style={s.calcLabel}>Subtotal</Text><Text style={s.calcVal}>{fmt(invoice.subtotal)}</Text></View>
            {invoice.discountAmount > 0 && <View style={s.calcRow}><Text style={s.calcLabel}>Discount</Text><Text style={s.calcVal}>-{fmt(invoice.discountAmount)}</Text></View>}
            {invoice.taxTotal > 0 && <View style={s.calcRow}><Text style={s.calcLabel}>Tax</Text><Text style={s.calcVal}>{fmt(invoice.taxTotal)}</Text></View>}
            <View style={[s.calcRow, { marginTop: 4 }]}><Text style={[s.calcLabel, { fontSize: 10 }]}>Total</Text><Text style={[s.calcVal, { fontSize: 10 }]}>{currency} {fmt(invoice.total)}</Text></View>
          </View>
        </View>

        {/* Signature */}
        <View style={s.signatureArea}>
          {biz?.businessSignature && (
            <Image src={biz.businessSignature} style={{ width: 160, height: 55, objectFit: 'contain', marginBottom: 4 }} />
          )}
          <View style={s.signatureLine}>
            <Text style={{ fontSize: 9, fontFamily: M }}>Authorised Signature</Text>
          </View>
        </View>



        {/* Footer: contact details & branding */}
        <View style={s.footer} fixed>
          {(biz?.phone || biz?.email) && (
            <View style={{ flexDirection: 'row', gap: 20, marginBottom: 2 }}>
              {biz?.phone && <Text style={s.footerText}>Phone: {biz.phone}</Text>}
              {biz?.email && <Text style={s.footerText}>Email: {biz.email}</Text>}
            </View>
          )}
          <Text style={{ fontSize: 6.5, color: '#666', opacity: 0.8 }}>
            Powered by GoodSynk — Invoice Banega, Payment Badega.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
