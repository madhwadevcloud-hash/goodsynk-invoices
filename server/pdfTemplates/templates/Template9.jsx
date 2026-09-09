import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Link } from '@react-pdf/renderer';
import { buildScaledStyles } from './Pdfheaderscaling';

const B = 'Inter-Bold';

const hexToRgba = (hex, alpha) => {
  if (!hex) return 'rgba(0, 0, 0, ' + alpha + ')';
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
};

const M = 'Inter-SemiBold';

export default function Template9({ invoice }) {
  const { client, user: biz } = invoice;
  const colors = invoice.templateColors || { primary: '#DC2626' }; // Default to a striking red for that "Black & Red" modern feel
  const PRIMARY = colors.primary;
  const scaled = buildScaledStyles(biz);

  const s = StyleSheet.create({
    watermarkContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: -100 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba(PRIMARY, 0.08), transform: 'rotate(-45deg)', letterSpacing: 5 },
    page: { paddingBottom: 60, fontFamily: 'Inter', color: '#111', backgroundColor: '#FFF' },
    
    // Asymmetrical Split Top Section
    topSplit: { flexDirection: 'row', backgroundColor: '#111', minHeight: 220 },
    
    // Left Sidebar Header (Dark)
    topLeft: { width: '35%', backgroundColor: PRIMARY, padding: 30, color: '#FFF' },
    topLeftTitle: { fontSize: 9, fontFamily: B, color: '#FFF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, opacity: 0.9 },
    clientName: { fontFamily: B, fontSize: 13, color: '#FFF', marginBottom: 4 },
    clientText: { fontSize: 8.5, color: '#FFF', lineHeight: 1.5, opacity: 0.9 },
    
    paymentBox: { marginTop: 25 },
    
    // Right Header (Dark Gray/Black)
    topRight: { width: '65%', padding: 30, paddingLeft: 40, color: '#FFF', justifyContent: 'space-between' },
    brandRow: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, minWidth: 0 },
    brandText: { width: 230, flexShrink: 1 },
    topLogo: { width: 36, height: 36, objectFit: 'contain', marginRight: 8, flexShrink: 0, backgroundColor: '#FFF', padding: 2, borderRadius: 2 },
    bizName: { fontFamily: B, fontSize: scaled.bizNameFontSize, color: '#FFF', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 },
    bizText: { fontSize: scaled.bizSubTextFontSize, color: '#FFF', opacity: 0.7, lineHeight: scaled.bizSubTextLineHeight },
    
    docTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20 },
    docTitle: { fontFamily: B, fontSize: 32, color: PRIMARY, textTransform: 'uppercase', letterSpacing: 2 },
    docMetaText: { fontSize: 9, color: '#FFF', opacity: 0.8, textAlign: 'right', marginBottom: 3 },
    docMetaBold: { fontFamily: B, color: '#FFF' },

    // Main Content Area
    contentWrap: { paddingHorizontal: 30, paddingTop: 30 },

    // Dynamic Table
    table: { width: '100%', marginBottom: 14 },
    tHead: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#111', paddingBottom: 8, marginBottom: 8 },
    tRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
    th: { fontSize: 8.5, fontFamily: B, color: '#111', textTransform: 'uppercase', letterSpacing: 0.5 },
    td: { fontSize: 9, color: '#333' },

    colNo: { flex: 0.4 },
    colDesc: { flex: 2.2, paddingRight: 10 },
    colHsn: { flex: 0.8, textAlign: 'center' },
    colQty: { flex: 0.9, textAlign: 'center' },
    colPrice: { flex: 1.2, textAlign: 'right', paddingRight: 10 },
    colDisc: { flex: 0.8, textAlign: 'center', paddingRight: 4 },
    colTax: { flex: 0.8, textAlign: 'center', paddingRight: 4 },
    colTotal: { flex: 1.3, textAlign: 'right' },

    // Totals Section
    totalsWrapper: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 },
    totalsBox: { width: '45%' },
    totRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    totLabel: { fontSize: 9, color: '#555', fontFamily: M },
    totVal: { fontSize: 9, fontFamily: B, color: '#111', textAlign: 'right' },
    grandTotRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, backgroundColor: '#111', paddingHorizontal: 15, marginTop: 5 },
    grandTotLabel: { fontSize: 12, fontFamily: B, color: PRIMARY, textTransform: 'uppercase' },
    grandTotVal: { fontSize: 12, fontFamily: B, color: '#FFF', textAlign: 'right' },

    // Bottom Area
    bottomFlex: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
    notesBox: { width: '55%' },
    sectionTitle: { fontSize: 9, fontFamily: B, color: '#111', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
    notesText: { fontSize: 8.5, color: '#555', lineHeight: 1.5, marginBottom: 15 },
    
    sigBox: { width: '40%', alignItems: 'flex-end', justifyContent: 'flex-end' },
    sigImg: { width: 140, height: 45, objectFit: 'contain', marginBottom: 6 },
    sigLine: { width: '100%', height: 2, backgroundColor: PRIMARY, marginBottom: 6 },
    sigText: { fontSize: 8, fontFamily: B, color: '#111', textTransform: 'uppercase', letterSpacing: 1 },

    // Footer: Dark Block
    footerBox: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#111', paddingVertical: 15, paddingHorizontal: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerLeftText: { fontSize: 8, color: '#FFF', opacity: 0.8 },
    footerRightText: { fontSize: 8, color: '#FFF', opacity: 0.8, textAlign: 'right' },
    footerAccent: { fontFamily: B, color: PRIMARY, letterSpacing: 1, textTransform: 'uppercase' },
    footerLink: { fontFamily: B, color: PRIMARY, textDecoration: 'none' }
  });

  const currency = invoice._currency || invoice.currency || 'INR';
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'code' }).format(n || 0).replace(currency, '').trim();

  const bizName = biz?.businessName || biz?.name || '';
  const isQuotation = invoice.invoiceType === 'quotation';
  const docTitle = isQuotation ? 'QUOTATION' : 'INVOICE';
  const docNo = invoice.invoiceNumber || invoice.quotationNumber;

  const showCGST = invoice.cgstTotal > 0;
  const showSGST = invoice.sgstTotal > 0;
  const showIGST = invoice.igstTotal > 0;
  const showVAT = invoice.vatTotal > 0;
  const hasHsn = invoice.items?.some(i => i.hsn);
  const hasDiscount = invoice.items?.some(i => i.discount > 0);
  const roundOffDiff = invoice.roundOff ? (invoice.total || 0) - ((invoice.subtotal || 0) - (invoice.discountAmount || 0) + (invoice.taxTotal || 0)) : 0;
  const notesText = Array.isArray(invoice.notes) ? invoice.notes.join('\n') : invoice.notes;
  const termsText = Array.isArray(invoice.termsAndConditions) ? invoice.termsAndConditions.join('\n') : invoice.termsAndConditions;

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Watermark */}
        {(!biz?.plan || String(biz.plan).toLowerCase() === 'free') && (
          <View style={s.watermarkContainer} pointerEvents="none" fixed>
            <Text style={s.watermarkText}>GoodSynk</Text>
          </View>
        )}
        
        {/* Asymmetrical Header Split */}
        <View style={s.topSplit} fixed>
          <View style={s.topLeft}>
            <View>
              <Text style={s.topLeftTitle}>Billed To</Text>
              <Text style={s.clientName}>{client?.name}</Text>
              {client?.address?.street && <Text style={s.clientText}>{client.address.street}</Text>}
              {client?.address?.city && <Text style={s.clientText}>{client.address.city}, {client.address.state} {client.address.pincode}</Text>}
              {client?.phone && <Text style={s.clientText}>P: {client.phone}</Text>}
              {client?.email && <Text style={s.clientText}>E: {client.email}</Text>}
            </View>

            {isQuotation && biz?.bankDetails?.accountNumber && (
              <View style={s.paymentBox}>
                <Text style={s.topLeftTitle}>Payment Details</Text>
                {biz.bankDetails.bankName && <Text style={s.clientText}>Bank: {biz.bankDetails.bankName}</Text>}
                {biz.bankDetails.accountName && <Text style={s.clientText}>A/C Name: {biz.bankDetails.accountName}</Text>}
                <Text style={s.clientText}>Account: {biz.bankDetails.accountNumber}</Text>
                {biz.bankDetails.ifscCode && <Text style={s.clientText}>IFSC: {biz.bankDetails.ifscCode}</Text>}
                {biz.bankDetails.swiftCode && <Text style={s.clientText}>SWIFT: {biz.bankDetails.swiftCode}</Text>}
                {biz.bankDetails.branch && <Text style={s.clientText}>Branch: {biz.bankDetails.branch}</Text>}
              </View>
            )}
            {!biz?.bankDetails?.accountNumber && invoice.paymentInfo && (
               <View style={s.paymentBox}>
                  <Text style={s.topLeftTitle}>Payment Info</Text>
                  <Text style={s.clientText}>{invoice.paymentInfo}</Text>
               </View>
            )}
          </View>
          
          <View style={s.topRight}>
            <View style={s.brandRow}>
              {biz?.businessLogo && <Image style={s.topLogo} src={biz.businessLogo} />}
              <View style={s.brandText}>
              <Text style={s.bizName}>{bizName}</Text>
              {biz?.address?.street && <Text style={s.bizText}>{String(biz.address.street).replace(/\s+,/g, ',').replace(/,(?=\S)/g, ', ').trim()}</Text>}
              {biz?.address?.city && <Text style={s.bizText}>{[[biz?.address?.city, biz?.address?.state].map((v) => String(v || '').trim().replace(/[-,\s]+$/, '')).filter(Boolean).join(', '), String(biz?.address?.pincode || '').trim()].filter(Boolean).join(' ')}</Text>}
              {biz?.phone && <Text style={s.bizText}>P: {biz.phone}</Text>}
              {biz?.email && <Text style={s.bizText}>E: {biz.email}</Text>}
              {biz?.gstin && <Text style={[s.bizText, { marginTop: 6, fontFamily: B, color: PRIMARY }]}>GSTIN: {biz.gstin}</Text>}
              </View>
            </View>
            
            <View style={s.docTitleRow}>
              <Text style={s.docTitle}>{docTitle}</Text>
              <View>
                <Text style={s.docMetaText}>{isQuotation ? 'QUOTE NO' : 'INVOICE NO'}: <Text style={s.docMetaBold}>{docNo}</Text></Text>
                <Text style={s.docMetaText}>DATE: <Text style={s.docMetaBold}>{new Date(invoice.issueDate).toLocaleDateString('en-US')}</Text></Text>
                {invoice.dueDate && <Text style={s.docMetaText}>DUE: <Text style={s.docMetaBold}>{new Date(invoice.dueDate).toLocaleDateString('en-US')}</Text></Text>}
              </View>
            </View>
          </View>
        </View>

        <View style={s.contentWrap}>
          {/* Main Table */}
          <View style={s.table}>
            <View style={s.tHead}>
              <Text style={[s.th, s.colNo]}>#</Text>
              <Text style={[s.th, s.colDesc]}>Description</Text>
              {hasHsn && <Text style={[s.th, s.colHsn]}>HSN</Text>}
              <Text style={[s.th, s.colQty]}>QTY</Text>
              <Text style={[s.th, s.colPrice]}>PRICE</Text>
              {hasDiscount && <Text style={[s.th, s.colDisc]}>DISC</Text>}
              {showCGST && <Text style={[s.th, s.colTax]}>CGST</Text>}
              {showSGST && <Text style={[s.th, s.colTax]}>SGST</Text>}
              {showIGST && <Text style={[s.th, s.colTax]}>IGST</Text>}
              {showVAT && <Text style={[s.th, s.colTax]}>VAT</Text>}
              <Text style={[s.th, s.colTotal]}>AMOUNT</Text>
            </View>

            {invoice.items?.map((item, i) => (
              <View key={i} style={s.tRow}>
                <Text style={[s.td, s.colNo]}>{i + 1}</Text>
                <View style={[s.td, s.colDesc, { paddingRight: 10 }]}>
                  <Text style={{ fontFamily: B }}>{item.name}</Text>
                  {item.description && <Text style={{ fontSize: 7.5, color: '#666', marginTop: 3 }}>{item.description}</Text>}
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

          <View style={s.totalsWrapper}>
            <View style={s.totalsBox}>
              <View style={s.totRow}><Text style={s.totLabel}>SUBTOTAL</Text><Text style={s.totVal}>{fmt(invoice.subtotal)}</Text></View>
              {invoice.discountAmount > 0 && <View style={s.totRow}><Text style={s.totLabel}>DISCOUNT</Text><Text style={s.totVal}>-{fmt(invoice.discountAmount)}</Text></View>}
              {showCGST && <View style={s.totRow}><Text style={s.totLabel}>CGST</Text><Text style={s.totVal}>{fmt(invoice.cgstTotal)}</Text></View>}
              {showSGST && <View style={s.totRow}><Text style={s.totLabel}>SGST</Text><Text style={s.totVal}>{fmt(invoice.sgstTotal)}</Text></View>}
              {showIGST && <View style={s.totRow}><Text style={s.totLabel}>IGST</Text><Text style={s.totVal}>{fmt(invoice.igstTotal)}</Text></View>}
              {showVAT && <View style={s.totRow}><Text style={s.totLabel}>VAT</Text><Text style={s.totVal}>{fmt(invoice.vatTotal)}</Text></View>}
              {invoice.roundOff && Math.abs(roundOffDiff) > 0.001 && <View style={s.totRow}><Text style={s.totLabel}>ROUND OFF</Text><Text style={s.totVal}>{roundOffDiff >= 0 ? '+' : '-'}{fmt(Math.abs(roundOffDiff))}</Text></View>}
              <View style={s.grandTotRow}>
                <Text style={s.grandTotLabel}>TOTAL {currency}</Text>
                <Text style={s.grandTotVal}>{fmt(invoice.total)}</Text>
              </View>
            </View>
          </View>

          <View style={s.bottomFlex}>
            <View style={s.notesBox}>
              {invoice.notes && (
                <View style={{ marginBottom: 15 }}>
                  <Text style={s.sectionTitle}>Notes</Text>
                  <Text style={s.notesText}>{notesText}</Text>
                </View>
              )}
              {invoice.termsAndConditions && (
                <View>
                  <Text style={s.sectionTitle}>Terms & Conditions</Text>
                  <Text style={s.notesText}>{termsText}</Text>
                </View>
              )}
            </View>

            <View style={s.sigBox} wrap={false}>
              {biz?.businessSignature && <Image src={biz.businessSignature} style={s.sigImg} />}
              <View style={s.sigLine} />
              <Text style={s.sigText}>Authorised Signatory</Text>
            </View>
          </View>
        </View>

        <View style={s.footerBox} fixed>
          <View>
            <Text style={s.footerLeftText}>
              <Text style={s.footerAccent}>Contact: </Text>
              {biz?.phone && `${biz.phone}  `}
              {biz?.email && `${biz.email}`}
              {!biz?.phone && !biz?.email && 'Thank you for your business'}
            </Text>
          </View>
          <View>
            <Text style={s.footerRightText}>
              POWERED BY <Text style={s.footerAccent}><Text style={{ fontSize: 8, fontFamily: 'Helvetica' }}>™</Text>GOODSYNK</Text>
            </Text>
            <Link style={s.footerLink} src="https://invoice.goodsynk.com">invoice.goodsynk.com</Link>
          </View>
        </View>
      </Page>
    </Document>
  );
}