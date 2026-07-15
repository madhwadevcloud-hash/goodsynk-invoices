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
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
};

export default function Template4({ invoice }) {
  const { client, user: biz } = invoice;
  const colors = invoice.templateColors || { primary: '#1A2A3A', secondary: '#D4AF37' };
  const NAVY = colors.primary;
  const GOLD = colors.secondary;
  const BEIGE = '#F9F7F1';
  const scaled = buildScaledStyles(biz);

  const s = StyleSheet.create({
    page: { paddingTop: 40, paddingBottom: 60, paddingHorizontal: 40, fontFamily: 'Inter', color: NAVY },

    headerArea: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1.5, borderBottomColor: NAVY, borderBottomStyle: 'solid', paddingBottom: 15, marginBottom: 10 },
    bizInfoBox: { maxWidth: scaled.bizInfoMaxWidth },
    logoBox: { height: scaled.logoHeight, maxWidth: 140, objectFit: 'contain', marginBottom: 6 },
    bizNameText: { fontFamily: B, fontSize: scaled.bizNameFontSize, color: NAVY, textTransform: 'uppercase', marginBottom: 2 },
    bizSubText: { fontSize: scaled.bizSubTextFontSize, color: '#444', marginTop: 1, lineHeight: scaled.bizSubTextLineHeight },
    titleBox: { alignItems: 'flex-end', paddingTop: 8 },
    invoiceTitle: { fontFamily: 'Inter', fontWeight: 300, fontSize: 26, letterSpacing: 4, color: NAVY },

    infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
    infoCol: { width: '30%' },
    infoLabel: { fontSize: 8, fontFamily: B, color: GOLD, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
    infoText: { fontSize: 9.5, lineHeight: 1.4, color: NAVY },
    infoTextBold: { fontSize: 10, fontFamily: B, color: NAVY, marginBottom: 2 },

    table: { width: '100%', marginBottom: 30 },
    tHeadRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: NAVY, borderTopStyle: 'solid', borderBottomWidth: 1, borderBottomColor: NAVY, borderBottomStyle: 'solid', paddingVertical: 8, marginBottom: 10 },
    th: { fontSize: 9, fontFamily: B, color: NAVY, textTransform: 'uppercase', letterSpacing: 1 },
    tRow: { flexDirection: 'row', paddingVertical: 8 },
    td: { fontSize: 9.5, color: NAVY },

    colNo: { flex: 0.4 },
    colDesc: { flex: 2.2 },
    colHsn: { flex: 0.8, textAlign: 'center' },
    colPrice: { flex: 1.1, textAlign: 'right' },
    colQty: { flex: 0.9, textAlign: 'center' },
    colDisc: { flex: 0.7, textAlign: 'center' },
    colTax: { flex: 0.8, textAlign: 'center' },
    colTotal: { flex: 1.2, textAlign: 'right' },

    bottomSection: { flexDirection: 'row', justifyContent: 'space-between' },
    paymentBox: { width: '55%' },

    totalsBox: { width: '40%', backgroundColor: BEIGE, padding: 20, borderLeftWidth: 3, borderLeftColor: GOLD, borderLeftStyle: 'solid' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    totalLabel: { fontSize: 9.5, color: NAVY },
    totalVal: { fontSize: 9.5, fontFamily: M, color: NAVY },
    grandRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: GOLD, borderTopStyle: 'solid' },
    grandLabel: { fontSize: 11, fontFamily: B, color: NAVY },
    grandVal: { fontSize: 11, fontFamily: B, color: NAVY },

    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: GOLD, borderTopStyle: 'solid', paddingTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 30 },
    footerText: { fontSize: 8, color: NAVY, textTransform: 'uppercase', letterSpacing: 1 },

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
      color: hexToRgba(NAVY, 0.08),
      transform: 'rotate(-45deg)',
      letterSpacing: 5,
    },
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
  const hasHsn = invoice.items?.some(i => i.hsn);
  const hasDiscount = invoice.items?.some(i => i.discount > 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Watermark */}
        {biz?.plan !== 'premium' && (
          <View style={s.watermarkContainer} fixed pointerEvents="none">
            <Text style={s.watermarkText}>GoodSynk</Text>
          </View>
        )}

        {/* Header Area */}
        <View style={s.headerArea}>
          <View style={s.bizInfoBox}>
            {biz?.businessLogo && <Image style={s.logoBox} src={biz.businessLogo} />}
            <Text style={s.bizNameText}>{bizName}</Text>
            {biz?.address?.street && <Text style={s.bizSubText}>{biz.address.street}</Text>}
            {biz?.address?.city && (
              <Text style={s.bizSubText}>
                {biz.address.city}, {biz.address.state} {biz.address.pincode || ''}
              </Text>
            )}
            {biz?.gstin && <Text style={[s.bizSubText, { color: GOLD, fontFamily: B }]}>GSTIN: {biz.gstin}</Text>}
          </View>
          <View style={s.titleBox}>
            <Text style={s.invoiceTitle}>{isQuotation ? 'QUOTATION' : 'INVOICE'}</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={s.infoGrid}>
          <View style={s.infoCol}>
            <Text style={s.infoLabel}>From</Text>
            {biz?.address?.street && <Text style={s.infoText}>{biz.address.street}</Text>}
            {biz?.address?.city && (
              <Text style={s.infoText}>
                {biz.address.city}, {biz.address.state} {biz.address.pincode || ''}
              </Text>
            )}
            {biz?.email && <Text style={s.infoText}>{biz.email}</Text>}
            {biz?.phone && <Text style={s.infoText}>{biz.phone}</Text>}
          </View>

          <View style={s.infoCol}>
            <Text style={s.infoLabel}>To</Text>
            <Text style={s.infoTextBold}>{client?.name}</Text>
            {client?.address?.street && <Text style={s.infoText}>{client.address.street}</Text>}
            {client?.address?.city && <Text style={s.infoText}>{client.address.city}, {client.address.state}</Text>}
            {client?.email && <Text style={s.infoText}>{client.email}</Text>}
            {client?.phone && <Text style={s.infoText}>{client.phone}</Text>}
          </View>

          <View style={s.infoCol}>
            <Text style={s.infoLabel}>Details</Text>
            <Text style={s.infoText}>No: {invoice.invoiceNumber || invoice.quotationNumber}</Text>
            <Text style={s.infoText}>Date: {new Date(invoice.issueDate).toLocaleDateString()}</Text>
            {invoice.dueDate && <Text style={s.infoText}>Due: {new Date(invoice.dueDate).toLocaleDateString()}</Text>}
            <Text style={[s.infoText, { marginTop: 10, fontFamily: B }]}>Amount Due: {currency} {fmt(invoice.total)}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={s.table}>
          <View style={s.tHeadRow}>
            <Text style={[s.th, s.colNo]}>#</Text>
            <Text style={[s.th, s.colDesc, { paddingLeft: 10 }]}>Description</Text>
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
              <View style={[s.colDesc, { paddingLeft: 10 }]}>
                <Text style={[s.td, { fontFamily: M }]}>{item.name}</Text>
                {item.description && <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>{item.description}</Text>}
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

        {/* Bottom */}
        <View style={s.bottomSection}>
          <View style={s.paymentBox}>
            {(!isQuotation && biz?.bankDetails?.accountNumber) && (
              <View style={{ marginBottom: 20 }}>
                <Text style={s.infoLabel}>Payment Info</Text>
                <Text style={s.infoTextBold}>{biz.bankDetails.bankName}</Text>
                <Text style={s.infoText}>Account Name: {biz.bankDetails.accountName}</Text>
                <Text style={s.infoText}>Account No.: {biz.bankDetails.accountNumber}</Text>
                {biz.bankDetails.ifscCode && <Text style={s.infoText}>IFSC: {biz.bankDetails.ifscCode}</Text>}
              </View>
            )}

            {invoice.notes && (
              <View style={{ marginBottom: 15 }}>
                <Text style={s.infoLabel}>Notes</Text>
                <Text style={s.infoText}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.termsAndConditions && (
              <View>
                <Text style={s.infoLabel}>Terms</Text>
                <Text style={s.infoText}>{invoice.termsAndConditions}</Text>
              </View>
            )}
          </View>

          <View style={s.totalsBox}>
            <View style={s.totalRow}><Text style={s.totalLabel}>Subtotal</Text><Text style={s.totalVal}>{fmt(invoice.subtotal)}</Text></View>
            {invoice.discountAmount > 0 && <View style={s.totalRow}><Text style={s.totalLabel}>Discount</Text><Text style={s.totalVal}>-{fmt(invoice.discountAmount)}</Text></View>}
            {invoice.taxTotal > 0 && <View style={s.totalRow}><Text style={s.totalLabel}>Tax</Text><Text style={s.totalVal}>{fmt(invoice.taxTotal)}</Text></View>}
            <View style={s.grandRow}>
              <Text style={s.grandLabel}>Total</Text>
              <Text style={s.grandVal}>{currency} {fmt(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Signature */}
        <View style={{ marginTop: 20, alignItems: 'flex-end' }}>
          {biz?.businessSignature && (
            <Image src={biz.businessSignature} style={{ width: 160, height: 55, objectFit: 'contain', marginBottom: 4 }} />
          )}
          <View style={{ width: 120, borderTopWidth: 0.5, borderTopColor: '#1B365D', borderTopStyle: 'solid', paddingTop: 4 }}>
            <Text style={{ fontSize: 8, color: '#1B365D', textAlign: 'center' }}>Authorised Signature</Text>
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
