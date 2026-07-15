import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { buildScaledStyles } from './Pdfheaderscaling';
// Register fonts (same as before)
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

export default function Template1({ invoice }) {
  const { client, user: biz } = invoice;
  const colors = invoice.templateColors || { primary: '#4A72D4' };
  const PRIMARY = colors.primary;
  const scaled = buildScaledStyles(biz);

  const s = StyleSheet.create({
    page: { paddingTop: 40, paddingBottom: 120, fontFamily: 'Inter', color: '#000' },
    container: { paddingHorizontal: 40 },
    topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 40, marginBottom: 20 },
    headerText: { fontFamily: B, fontSize: 32, letterSpacing: 2, textTransform: 'uppercase', color: PRIMARY, marginTop: 10 },

    bizInfoTop: { alignItems: 'flex-end', maxWidth: scaled.bizInfoMaxWidth },
    topLogo: { height: scaled.logoHeight, maxWidth: 140, objectFit: 'contain', marginBottom: 6 },
    bizNameTop: { fontFamily: B, fontSize: scaled.bizNameFontSize, color: '#000', textTransform: 'uppercase', marginBottom: 2 },
    bizSubText: { fontSize: scaled.bizSubTextFontSize, color: '#444', marginTop: 1, lineHeight: scaled.bizSubTextLineHeight, textAlign: 'right' },

    blueBar: { backgroundColor: PRIMARY, height: 12, width: '100%', marginBottom: 15 },
    detailsRow: { flexDirection: 'row', paddingHorizontal: 40, marginBottom: 25, gap: 40 },
    detailsCol: {},
    detailsLabel: { fontSize: 7.5, fontFamily: B, color: '#666', textTransform: 'uppercase', marginBottom: 3 },
    detailsValue: { fontSize: 9.5, fontFamily: M, color: '#000' },

    table: { width: '100%', marginTop: 10 },
    tHeadRow: { flexDirection: 'row', borderBottom: `1pt solid ${PRIMARY}`, paddingBottom: 8, marginBottom: 8 },
    tRow: { flexDirection: 'row', borderBottom: `0.5pt solid ${PRIMARY}`, paddingVertical: 10 },
    th: { fontSize: 9.5, fontFamily: B, color: '#000' },
    td: { fontSize: 9, color: '#000' },

    colNo: { flex: 0.4 },
    colDesc: { flex: 2.2, paddingRight: 10 },
    colHsn: { flex: 0.8, textAlign: 'center' },
    colQty: { flex: 0.9, textAlign: 'center' },
    colPrice: { flex: 1.1, textAlign: 'right' },
    colDisc: { flex: 0.7, textAlign: 'center' },
    colTax: { flex: 0.8, textAlign: 'center' },
    colTotal: { flex: 1.2, textAlign: 'right' },

    thTotal: { fontSize: 9.5, fontFamily: B, color: PRIMARY, textAlign: 'right' },
    tdTotal: { fontSize: 9, color: PRIMARY, textAlign: 'right', fontFamily: M },

    totalsBox: { marginTop: 12, alignItems: 'flex-end', paddingRight: 4 },
    totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
    totalLabel: { fontSize: 9, color: '#000', width: 80, textAlign: 'right', paddingRight: 8 },
    totalVal: { fontSize: 9, fontFamily: M, width: 80, textAlign: 'right', color: PRIMARY },
    grandTotalLabel: { fontSize: 11, fontFamily: B, width: 80, textAlign: 'right', paddingRight: 8, color: '#000', marginTop: 4 },
    grandTotalVal: { fontSize: 11, fontFamily: B, width: 80, textAlign: 'right', color: PRIMARY, marginTop: 4 },

    infoBlock: { flexDirection: 'row', marginTop: 30, justifyContent: 'space-between' },
    infoCol: { width: '45%' },
    infoTitle: { fontFamily: B, fontSize: 10, textTransform: 'uppercase', marginBottom: 6, paddingBottom: 4, borderBottom: `1pt solid ${PRIMARY}` },
    infoText: { fontSize: 9, color: '#333', marginBottom: 3, lineHeight: 1.4 },

    footerBox: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: PRIMARY, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
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
    footerText: { fontSize: 8.5, color: '#FFF' },
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
          <View style={s.watermarkContainer} pointerEvents="none" fixed>
            <Text style={s.watermarkText}>GoodSynk</Text>
          </View>
        )}

        <View style={s.topSection}>
          <View>
            <Text style={s.headerText}>{docTitle}</Text>
          </View>
          <View style={s.bizInfoTop}>
            {biz?.businessLogo && <Image style={s.topLogo} src={biz.businessLogo} />}
            <Text style={s.bizNameTop}>{bizName}</Text>
            {biz?.address?.street && <Text style={s.bizSubText}>{biz.address.street}</Text>}
            {biz?.address?.city && (
              <Text style={s.bizSubText}>
                {biz.address.city}, {biz.address.state} {biz.address.pincode}
              </Text>
            )}
            {biz?.gstin && <Text style={[s.bizSubText, { color: PRIMARY, fontFamily: B }]}>GSTIN: {biz.gstin}</Text>}
          </View>
        </View>

        <View style={s.blueBar} />

        <View style={s.detailsRow}>
          <View style={s.detailsCol}>
            <Text style={s.detailsLabel}>{isQuotation ? 'Quotation No' : 'Invoice No'}</Text>
            <Text style={s.detailsValue}>{invoice.invoiceNumber || invoice.quotationNumber}</Text>
          </View>
          <View style={s.detailsCol}>
            <Text style={s.detailsLabel}>Date of Issue</Text>
            <Text style={s.detailsValue}>{new Date(invoice.issueDate).toLocaleDateString()}</Text>
          </View>
          <View style={s.detailsCol}>
            <Text style={s.detailsLabel}>Due Date</Text>
            <Text style={s.detailsValue}>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon Receipt'}</Text>
          </View>
        </View>

        <View style={s.container}>

          {/* Info Blocks */}
          <View style={s.infoBlock}>
            <View style={s.infoCol}>
              <Text style={s.infoTitle}>Billed To</Text>
              <Text style={[s.infoText, { fontFamily: B }]}>{client?.name}</Text>
              {client?.address?.street && <Text style={s.infoText}>{client.address.street}</Text>}
              {client?.address?.city && <Text style={s.infoText}>{client.address.city}, {client.address.state} {client.address.pincode}</Text>}
              {client?.phone && <Text style={s.infoText}>{client.phone}</Text>}
            </View>
            <View style={s.infoCol}>
              {isQuotation && (
                <>
                  <Text style={s.infoTitle}>Payment Details</Text>
                  {biz?.bankDetails?.accountNumber ? (
                    <>
                      {biz.bankDetails.bankName && <Text style={s.infoText}>Bank: {biz.bankDetails.bankName}</Text>}
                      <Text style={s.infoText}>Account: {biz.bankDetails.accountNumber}</Text>
                      {biz.bankDetails.ifscCode && <Text style={s.infoText}>IFSC: {biz.bankDetails.ifscCode}</Text>}
                    </>
                  ) : (
                    <>
                      {invoice.paymentInfo && <Text style={s.infoText}>{invoice.paymentInfo}</Text>}
                    </>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Table */}
          <View style={s.table}>
            <View style={s.tHeadRow}>
              <Text style={[s.th, s.colNo]}>#</Text>
              <Text style={[s.th, s.colDesc]}>Description</Text>
              {hasHsn && <Text style={[s.th, s.colHsn]}>HSN</Text>}
              <Text style={[s.th, s.colQty]}>Qty</Text>
              <Text style={[s.th, s.colPrice]}>Price</Text>
              {hasDiscount && <Text style={[s.th, s.colDisc]}>Disc%</Text>}
              {showCGST && <Text style={[s.th, s.colTax]}>CGST</Text>}
              {showSGST && <Text style={[s.th, s.colTax]}>SGST</Text>}
              {showIGST && <Text style={[s.th, s.colTax]}>IGST</Text>}
              {showVAT && <Text style={[s.th, s.colTax]}>VAT</Text>}
              <Text style={[s.thTotal, s.colTotal]}>Total</Text>
            </View>

            {invoice.items?.map((item, i) => (
              <View key={i} style={s.tRow}>
                <Text style={[s.td, s.colNo]}>{i + 1}</Text>
                <View style={[s.td, s.colDesc, { paddingRight: 10 }]}>
                  <Text style={{ fontFamily: B }}>{item.name}</Text>
                  {item.description && <Text style={{ fontSize: 7.5, color: '#555', marginTop: 2 }}>{item.description}</Text>}
                </View>
                {hasHsn && <Text style={[s.td, s.colHsn]}>{item.hsn || '—'}</Text>}
                <Text style={[s.td, s.colQty]}>{item.itemType === 'Service' ? '-' : `${item.quantity}${item.unit ? ` ${item.unit}` : ''}`}</Text>
                <Text style={[s.td, s.colPrice]}>{fmt(item.price)}</Text>
                {hasDiscount && <Text style={[s.td, s.colDisc]}>{item.discount || 0}%</Text>}
                {showCGST && <Text style={[s.td, s.colTax]}>{item.cgstRate || 0}%</Text>}
                {showSGST && <Text style={[s.td, s.colTax]}>{item.sgstRate || 0}%</Text>}
                {showIGST && <Text style={[s.td, s.colTax]}>{item.igstRate || 0}%</Text>}
                {showVAT && <Text style={[s.td, s.colTax]}>{item.vatRate || 0}%</Text>}
                <Text style={[s.tdTotal, s.colTotal]}>{fmt(item.total)}</Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={s.totalsBox}>
            <View style={s.totalRow}><Text style={s.totalLabel}>Subtotal</Text><Text style={s.totalVal}>{fmt(invoice.subtotal)}</Text></View>
            {invoice.discountAmount > 0 && <View style={s.totalRow}><Text style={s.totalLabel}>Discount</Text><Text style={s.totalVal}>-{fmt(invoice.discountAmount)}</Text></View>}
            {showCGST && <View style={s.totalRow}><Text style={s.totalLabel}>CGST</Text><Text style={s.totalVal}>{fmt(invoice.cgstTotal)}</Text></View>}
            {showSGST && <View style={s.totalRow}><Text style={s.totalLabel}>SGST</Text><Text style={s.totalVal}>{fmt(invoice.sgstTotal)}</Text></View>}
            {showIGST && <View style={s.totalRow}><Text style={s.totalLabel}>IGST</Text><Text style={s.totalVal}>{fmt(invoice.igstTotal)}</Text></View>}
            {showVAT && <View style={s.totalRow}><Text style={s.totalLabel}>VAT</Text><Text style={s.totalVal}>{fmt(invoice.vatTotal)}</Text></View>}
            <View style={s.totalRow}>
              <Text style={s.grandTotalLabel}>Total {currency}</Text>
              <Text style={s.grandTotalVal}>{fmt(invoice.total)}</Text>
            </View>
          </View>


          {/* Notes */}
          {invoice.notes && (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontSize: 9, fontFamily: B }}>Notes</Text>
              <Text style={{ fontSize: 8.5, color: '#000', marginTop: 4 }}>{invoice.notes}</Text>
            </View>
          )}

          {/* Terms & Conditions */}
          {invoice.termsAndConditions && (
            <View style={{ marginTop: 15 }}>
              <Text style={{ fontSize: 9, fontFamily: B }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 8, color: '#444', marginTop: 4, lineHeight: 1.4 }}>{invoice.termsAndConditions}</Text>
            </View>
          )}

        </View>

        {/* Signature */}
        <View style={{ marginTop: 16, alignItems: 'flex-end', paddingHorizontal: 40 }}>
          {biz?.businessSignature && (
            <Image src={biz.businessSignature} style={{ width: 160, height: 55, objectFit: 'contain', marginBottom: 4 }} />
          )}
          <View style={{ width: 120, borderTopWidth: 0.5, borderTopColor: '#1a3a6b', borderTopStyle: 'solid', paddingTop: 4 }}>
            <Text style={{ fontSize: 8, color: '#1a3a6b', textAlign: 'center' }}>Authorised Signature</Text>
          </View>
        </View>



        {/* Footer: contact details & branding */}
        <View style={s.footerBox} fixed>
          {(biz?.phone || biz?.email) && (
            <View style={{ flexDirection: 'row', gap: 30, marginBottom: 2 }}>
              {biz?.phone && <Text style={s.footerText}>Phone: {biz.phone}</Text>}
              {biz?.email && <Text style={s.footerText}>Email: {biz.email}</Text>}
            </View>
          )}
          <Text style={{ fontSize: 6.5, color: '#FFF', opacity: 0.8 }}>
            Powered by GoodSynk — Invoice Banega, Payment Badega.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
