import SignatoryDetails from './SignatoryDetails';
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Link } from '@react-pdf/renderer';
import { buildScaledStyles } from './Pdfheaderscaling';
import { isRasterImage } from './watermarkUtils';
import { safeHyphenation, fitFont, layoutColumns, neededWidth, qtyText, footerReserve, A4_WIDTH } from './layoutUtils';
// Register fonts (same as before)
Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf' });
Font.register({ family: 'Inter-SemiBold', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf' });
Font.register({ family: 'Inter-Bold', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf' });
Font.registerHyphenationCallback(safeHyphenation);

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

  const currency = invoice._currency || invoice.currency || 'INR';
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'code' }).format(n || 0).replace(currency, '').trim();

  const showCGST = invoice.cgstTotal > 0;
  const showSGST = invoice.sgstTotal > 0;
  const showIGST = invoice.igstTotal > 0;
  const showVAT = invoice.vatTotal > 0;
  const hasHsn = invoice.items?.some(i => i.hsn);
  const hasDiscount = invoice.items?.some(i => i.discount > 0);
  const items = invoice.items || [];

  // Dynamic table columns: numeric columns grow to fit their widest value,
  // the description column takes the rest (no overflow, no mid-word breaks).
  const TABLE_W = A4_WIDTH - 80;
  const taxCols = [showCGST && 'CGST', showSGST && 'SGST', showIGST && 'IGST', showVAT && 'VAT'].filter(Boolean);
  const colSpecs = [
    { key: 'no', min: 22, strings: ['#', String(items.length)] },
    { key: 'desc', flex: true },
    ...(hasHsn ? [{ key: 'hsn', min: 50, strings: ['HSN', ...items.map(i => i.hsn || '—')] }] : []),
    { key: 'qty', min: 46, strings: ['Qty', ...items.map(qtyText)] },
    { key: 'price', min: 66, strings: ['Price', ...items.map(i => fmt(i.price))] },
    ...(hasDiscount ? [{ key: 'disc', min: 38, strings: ['Disc%', ...items.map(i => `${i.discount || 0}%`)] }] : []),
    ...taxCols.map(k => ({ key: k, min: 40, strings: [k, '100%'] })),
    { key: 'total', min: 74, bold: true, strings: ['Total', ...items.map(i => fmt(i.total))] },
  ];
  const { widths: cw, size: cellSize } = layoutColumns(colSpecs, TABLE_W, 9);

  // Totals block: value column sized to the widest figure.
  const totalStrings = [invoice.subtotal, invoice.discountAmount, invoice.cgstTotal, invoice.sgstTotal, invoice.igstTotal, invoice.vatTotal].map(fmt);
  const grandStr = fmt(invoice.total);
  const totValW = Math.max(80, neededWidth([...totalStrings, '-' + totalStrings[1]], 9, { bold: true, pad: 4 }), neededWidth([grandStr], 11, { bold: true, pad: 4 }));
  const totLabW = Math.max(80, neededWidth([`Total ${currency}`], 11, { bold: true, pad: 12 }));

  // Footer columns: shrink long contact values so they stay inside their column.
  const FOOT_W = A4_WIDTH - 80;
  const footLeftW = FOOT_W * 0.38 - 8;
  const phoneTxt = `Phone: ${biz?.phone || ''}`;
  const emailTxt = `Email: ${biz?.email || ''}`;
  const footPhoneSize = fitFont(phoneTxt, 7.5, footLeftW, 6);
  const footEmailSize = fitFont(emailTxt, 7.5, footLeftW, 6);

  const s = StyleSheet.create({
    page: { paddingTop: 30, paddingBottom: footerReserve(biz, 80), fontFamily: 'Inter', color: '#000' },
    container: { paddingHorizontal: 40 },
    topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 40, marginBottom: 16 },
    headerText: { fontFamily: B, fontSize: 32, letterSpacing: 2, textTransform: 'uppercase', color: PRIMARY, marginTop: 10 },

    bizInfoTop: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, minWidth: 0, justifyContent: 'flex-end' },
    titleCol: { flexShrink: 0, marginRight: 24 },
    brandText: { maxWidth: 250, flexShrink: 1 },
    topLogo: { maxWidth: 140, maxHeight: 52, objectFit: 'contain', marginRight: 10, flexShrink: 0 },
    bizNameTop: { fontFamily: B, fontSize: scaled.bizNameFontSize, color: '#000', textTransform: 'uppercase', marginBottom: 4, textAlign: 'right' },
    bizSubText: { fontSize: scaled.bizSubTextFontSize, color: '#444', marginTop: 1, lineHeight: scaled.bizSubTextLineHeight, textAlign: 'right' },

    blueBar: { backgroundColor: PRIMARY, height: 12, width: '100%', marginBottom: 18 },
    detailsRow: { flexDirection: 'row', paddingHorizontal: 40, marginBottom: 18, gap: 40 },
    detailsCol: {},
    detailsLabel: { fontSize: 7.5, fontFamily: B, color: '#666', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
    detailsValue: { fontSize: 9.5, fontFamily: M, color: '#000' },

    table: { width: '100%', marginTop: 12 },
    tHeadRow: { flexDirection: 'row', borderBottom: `1pt solid ${PRIMARY}`, paddingBottom: 6, marginBottom: 6 },
    tRow: { flexDirection: 'row', borderBottom: `0.5pt solid ${PRIMARY}`, paddingVertical: 6 },
    th: { fontSize: Math.min(9.5, cellSize + 0.5), fontFamily: B, color: '#000' },
    td: { fontSize: cellSize, color: '#000' },

    colNo: { width: cw.no, flexShrink: 0 },
    colDesc: { width: cw.desc, flexShrink: 0, paddingRight: 10 },
    colHsn: { width: cw.hsn, flexShrink: 0, textAlign: 'center' },
    colQty: { width: cw.qty, flexShrink: 0, textAlign: 'center' },
    colPrice: { width: cw.price, flexShrink: 0, textAlign: 'right', paddingRight: 8 },
    colDisc: { width: cw.disc, flexShrink: 0, textAlign: 'center' },
    colTax: { flexShrink: 0, textAlign: 'center' },
    colTotal: { width: cw.total, flexShrink: 0, textAlign: 'right' },

    thTotal: { fontSize: Math.min(9.5, cellSize + 0.5), fontFamily: B, color: PRIMARY, textAlign: 'right' },
    tdTotal: { fontSize: cellSize, color: PRIMARY, textAlign: 'right', fontFamily: M },

    totalsBox: { marginTop: 12, alignItems: 'flex-end' },
    totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
    totalLabel: { fontSize: 9, color: '#000', width: totLabW, textAlign: 'right', paddingRight: 8 },
    totalVal: { fontSize: 9, fontFamily: M, width: totValW, textAlign: 'right', color: PRIMARY },
    grandTotalLabel: { fontSize: 11, fontFamily: B, width: totLabW, textAlign: 'right', paddingRight: 8, color: '#000', marginTop: 6 },
    grandTotalVal: { fontSize: 11, fontFamily: B, width: totValW, textAlign: 'right', color: PRIMARY, marginTop: 6 },

    infoBlock: { flexDirection: 'row', marginTop: 16, justifyContent: 'space-between' },
    infoCol: { width: '30%', minWidth: 0 },
    infoTitle: { fontFamily: B, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, paddingBottom: 4, borderBottom: `1pt solid ${PRIMARY}` },
    infoText: { fontSize: 8.5, color: '#333', marginBottom: 2, lineHeight: 1.4 },

    footerBox: { position: 'absolute', bottom: 15, left: 40, right: 40, borderTopWidth: 1, borderTopColor: PRIMARY, borderTopStyle: 'solid', flexDirection: 'row', alignItems: 'stretch', paddingVertical: 8 },
    footerLeft: { width: '38%', justifyContent: 'center', paddingRight: 8 },
    footerCenter: { width: '32%', justifyContent: 'center', alignItems: 'center', borderLeftWidth: 0.5, borderLeftColor: '#E0E0E0', borderLeftStyle: 'solid', borderRightWidth: 0.5, borderRightColor: '#E0E0E0', borderRightStyle: 'solid', paddingHorizontal: 8 },
    footerRight: { width: '30%', justifyContent: 'center', alignItems: 'flex-end', paddingLeft: 8 },
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
    watermarkImg: { width: 250, height: 250, objectFit: 'contain', opacity: 0.12 },
    watermarkText: {
      fontSize: 60,
      fontFamily: B,
      color: hexToRgba(PRIMARY, 0.08),
      transform: 'rotate(-45deg)',
      letterSpacing: 5,
    },
    footerText: { fontSize: 7.5, color: '#444', marginBottom: 2 },
    footerContactLabel: { fontSize: 6.5, fontFamily: B, color: PRIMARY, letterSpacing: 0.5, marginBottom: 2, textTransform: 'uppercase' },
    footerBrandLine: { fontSize: 7.5, fontFamily: B, color: PRIMARY, letterSpacing: 0.3, textAlign: 'center' },
    footerLink: { fontSize: 7.5, fontFamily: B, color: PRIMARY, letterSpacing: 0.3, textDecoration: 'underline' },
    footerTrustLine: { fontSize: 6, color: '#666', textAlign: 'right', lineHeight: 1.4 },
    footerTagline: { fontSize: 6.5, color: '#444', textAlign: 'center', marginTop: 1 },
    poweredByContainer: { alignItems: 'center', marginTop: 2 },
    poweredByLabel: { fontSize: 5.5, color: '#888', letterSpacing: 0.5 },
    poweredByValue: { fontSize: 8.5, fontFamily: B, color: '#000', letterSpacing: 0.5, marginTop: 1 },
  });

  const bizName = biz?.businessName || biz?.name || '';
  const isQuotation = invoice.invoiceType === 'quotation';
  const docTitle = isQuotation ? 'QUOTATION' : 'INVOICE';

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Watermark */}
        {(!biz?.plan || String(biz.plan).toLowerCase() === 'free') ? (
          <View style={s.watermarkContainer} pointerEvents="none" fixed>
            <Text style={s.watermarkText}>GoodSynk</Text>
          </View>
        ) : isRasterImage(invoice.watermarkImage || biz.watermarkImage) ? (
          <View style={s.watermarkContainer} pointerEvents="none" fixed>
            <Image src={invoice.watermarkImage || biz.watermarkImage} style={s.watermarkImg} />
          </View>
        ) : null}

        <View style={s.topSection}>
          <View style={s.titleCol}>
            <Text style={s.headerText}>{docTitle}</Text>
          </View>
          <View style={s.bizInfoTop}>
            {biz?.businessLogo && <Image style={s.topLogo} src={biz.businessLogo} />}
            <View style={s.brandText}>
              <Text style={s.bizNameTop} numberOfLines={1}>{bizName}</Text>
              {biz?.address?.street && <Text style={s.bizSubText}>{String(biz.address.street).replace(/\s+,/g, ',').replace(/,(?=\S)/g, ', ').trim()}</Text>}
              {(biz?.address?.city || biz?.address?.state || biz?.address?.pincode) && (
                <Text style={s.bizSubText}>
                  {[[biz?.address?.city, biz?.address?.state]
                      .map((v) => String(v || '').trim().replace(/[-,\s]+$/, ''))
                      .filter(Boolean).join(', '),
                    String(biz?.address?.pincode || '').trim()].filter(Boolean).join(' ')}
                </Text>
              )}
              {biz?.gstin && <Text style={[s.bizSubText, { color: PRIMARY, fontFamily: B, marginTop: 2 }]}>GSTIN: {biz.gstin}</Text>}
            </View>
          </View>
        </View>

        <View style={s.blueBar} />

        <View style={s.container}>
          {/* Info Blocks */}
          <View style={s.infoBlock}>
            <View style={s.infoCol}>
              <Text style={s.infoTitle}>Billed To</Text>
              <Text style={[s.infoText, { fontFamily: B }]} numberOfLines={1}>{client?.name}</Text>
              {client?.address?.street && <Text style={s.infoText}>{client.address.street}</Text>}
              {client?.address?.city && <Text style={s.infoText}>{client.address.city}, {client.address.state} {client.address.pincode}</Text>}
              {client?.phone && <Text style={s.infoText}>{client.phone}</Text>}
            </View>
            <View style={s.infoCol}>
              <Text style={s.infoTitle}>Details</Text>
              <Text style={s.infoText}>{isQuotation ? 'Quotation No' : 'Invoice No'}: <Text style={{ fontFamily: B }}>{invoice.invoiceNumber || invoice.quotationNumber}</Text></Text>
              <Text style={s.infoText}>Date of Issue: <Text style={{ fontFamily: B }}>{new Date(invoice.issueDate).toLocaleDateString('en-US')}</Text></Text>
              <Text style={s.infoText}>Due Date: <Text style={{ fontFamily: B }}>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US') : 'Upon Receipt'}</Text></Text>
            </View>
            <View style={s.infoCol}>
              <Text style={s.infoTitle}>Payment Details</Text>
              {biz?.bankDetails?.accountNumber ? (
                <>
                  {biz.bankDetails.bankName && <Text style={s.infoText}>Bank: {biz.bankDetails.bankName}</Text>}
                  <Text style={s.infoText}>Account: {biz.bankDetails.accountNumber}</Text>
                  {biz.bankDetails.ifscCode && <Text style={s.infoText}>IFSC: {biz.bankDetails.ifscCode}</Text>}
                  {biz.bankDetails.branch && <Text style={s.infoText}>Branch: {biz.bankDetails.branch}</Text>}
                </>
              ) : (
                <Text style={s.infoText}>{invoice.paymentInfo || '—'}</Text>
              )}
            </View>
          </View>

          {/* Table */}
          <View style={s.table}>
            <View style={s.tHeadRow} wrap={false}>
              <Text style={[s.th, s.colNo]}>#</Text>
              <Text style={[s.th, s.colDesc]}>Description</Text>
              {hasHsn && <Text style={[s.th, s.colHsn]}>HSN</Text>}
              <Text style={[s.th, s.colQty]}>Qty</Text>
              <Text style={[s.th, s.colPrice]}>Price</Text>
              {hasDiscount && <Text style={[s.th, s.colDisc]}>Disc%</Text>}
              {showCGST && <Text style={[s.th, s.colTax, { width: cw.CGST }]}>CGST</Text>}
              {showSGST && <Text style={[s.th, s.colTax, { width: cw.SGST }]}>SGST</Text>}
              {showIGST && <Text style={[s.th, s.colTax, { width: cw.IGST }]}>IGST</Text>}
              {showVAT && <Text style={[s.th, s.colTax, { width: cw.VAT }]}>VAT</Text>}
              <Text style={[s.thTotal, s.colTotal]}>Total</Text>
            </View>

            {invoice.items?.map((item, i) => (
              <View key={i} style={s.tRow} wrap={false}>
                <Text style={[s.td, s.colNo]}>{i + 1}</Text>
                <View style={[s.colDesc]}>
                  <Text style={{ fontFamily: B, fontSize: cellSize }}>{item.name}</Text>
                  {item.description && <Text style={{ fontSize: 7.5, color: '#555', marginTop: 1 }}>{item.description}</Text>}
                </View>
                {hasHsn && <Text style={[s.td, s.colHsn]}>{item.hsn || '—'}</Text>}
                <Text style={[s.td, s.colQty]}>{qtyText(item)}</Text>
                <Text style={[s.td, s.colPrice]}>{fmt(item.price)}</Text>
                {hasDiscount && <Text style={[s.td, s.colDisc]}>{item.discount || 0}%</Text>}
                {showCGST && <Text style={[s.td, s.colTax, { width: cw.CGST }]}>{item.cgstRate || 0}%</Text>}
                {showSGST && <Text style={[s.td, s.colTax, { width: cw.SGST }]}>{item.sgstRate || 0}%</Text>}
                {showIGST && <Text style={[s.td, s.colTax, { width: cw.IGST }]}>{item.igstRate || 0}%</Text>}
                {showVAT && <Text style={[s.td, s.colTax, { width: cw.VAT }]}>{item.vatRate || 0}%</Text>}
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
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 9, fontFamily: B }}>Notes</Text>
              <Text style={{ fontSize: 8.5, color: '#000', marginTop: 2 }}>{invoice.notes}</Text>
            </View>
          )}

          {/* Terms & Conditions */}
          {invoice.termsAndConditions && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 9, fontFamily: B }}>Terms & Conditions</Text>
              <Text style={{ fontSize: 8, color: '#444', marginTop: 2, lineHeight: 1.3 }}>{invoice.termsAndConditions}</Text>
            </View>
          )}
        </View>

        {/* Signature + stamp: right side, centered items */}
        <View style={{ marginTop: 10, paddingHorizontal: 40, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end' }} wrap={false}>
          {biz?.businessSeal && (
            <Image src={biz.businessSeal} style={{ width: 55, height: 55, objectFit: 'contain', marginRight: 16 }} />
          )}
          <SignatoryDetails biz={biz} color={PRIMARY} />
        </View>

        {/* Footer: 3-column layout */}
        <View style={s.footerBox} fixed>
          <View style={s.footerLeft}>
            <Text style={s.footerContactLabel}>CONTACT</Text>
            {biz?.phone && <Text style={[s.footerText, { fontSize: footPhoneSize }]} numberOfLines={1}>{phoneTxt}</Text>}
            {biz?.email && <Text style={[s.footerText, { fontSize: footEmailSize }]} numberOfLines={1}>{emailTxt}</Text>}
          </View>
          <View style={s.footerCenter}>
            <View style={s.poweredByContainer}>
              <Text style={s.poweredByLabel}>Powered By</Text>
              <Text style={s.poweredByValue}>GoodSynk<Text style={{ fontSize: 7, fontFamily: 'Helvetica' }}>™</Text></Text>
            </View>
            <Text style={s.footerTagline}>Simple Invoicing, Billing & Quotations</Text>
            <Text style={[s.footerTagline, { marginTop: 2 }]}>Invoice Banega, Payment Badega.</Text>
          </View>
          <View style={s.footerRight}>
            <Text style={s.footerTrustLine}>Generated securely by</Text>
            <Text style={s.footerTrustLine}>GoodSynk<Text style={{ fontSize: 6, fontFamily: 'Helvetica' }}>™</Text>.</Text>
            <Text style={[s.footerTrustLine, { marginTop: 2 }]}>
              <Link style={s.footerLink} src="https://invoice.goodsynk.com">invoice.goodsynk.com</Link>
            </Text>
          </View>
        </View>
        <Text
          style={{ position: 'absolute', bottom: 4, right: 40, fontSize: 7.5, color: '#333333' }}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}