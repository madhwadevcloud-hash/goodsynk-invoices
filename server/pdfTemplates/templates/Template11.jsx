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

export default function Template11({ invoice }) {
  const { client, user: biz } = invoice;
  const colors = invoice.templateColors || { primary: '#000000' };
  const PRIMARY = colors.primary;
  const scaled = buildScaledStyles(biz);

  const s = StyleSheet.create({
    watermarkContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: -100 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba(PRIMARY, 0.08), transform: 'rotate(-45deg)', letterSpacing: 5 },
    page: { paddingTop: 60, paddingBottom: 80, paddingHorizontal: 60, fontFamily: 'Inter', color: '#111', backgroundColor: '#FFF' },
    
    // Minimalist Header
    headerWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 50 },
    bizBox: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'flex-start' },
    brandText: { width: 230, flexShrink: 1 },
    topLogo: { width: 36, height: 36, objectFit: 'contain', marginRight: 8, flexShrink: 0 },
    bizName: { fontFamily: B, fontSize: 14, color: '#111', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
    bizText: { fontSize: 8.5, color: '#555', lineHeight: 1.6 },
    
    docBox: { width: '45%', alignItems: 'flex-end' },
    docTitle: { fontFamily: B, fontSize: 12, color: PRIMARY, textTransform: 'uppercase', letterSpacing: 4, marginBottom: 15 },
    docMetaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
    docMetaLabel: { fontSize: 8.5, color: '#777', marginRight: 10, textTransform: 'uppercase', letterSpacing: 1 },
    docMetaVal: { fontSize: 8.5, fontFamily: B, color: '#111' },

    // Billed To Section
    billToWrap: { marginBottom: 40 },
    billToLabel: { fontSize: 8, color: '#999', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
    clientName: { fontFamily: B, fontSize: 18, color: '#111', marginBottom: 6 },
    clientText: { fontSize: 9, color: '#555', lineHeight: 1.6 },

    // Borderless Table
    table: { width: '100%', marginBottom: 40 },
    tHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 10, marginBottom: 15 },
    tRow: { flexDirection: 'row', paddingVertical: 8 },
    th: { fontSize: 7.5, color: '#777', textTransform: 'uppercase', letterSpacing: 1 },
    td: { fontSize: 9, color: '#111' },

    colNo: { flex: 0.4 },
    colDesc: { flex: 2.2, paddingRight: 15 },
    colHsn: { flex: 0.8, textAlign: 'center' },
    colQty: { flex: 0.9, textAlign: 'center' },
    colPrice: { flex: 1.2, textAlign: 'right', paddingRight: 10 },
    colDisc: { flex: 0.8, textAlign: 'center', paddingRight: 4 },
    colTax: { flex: 0.8, textAlign: 'center', paddingRight: 4 },
    colTotal: { flex: 1.3, textAlign: 'right' },

    // Airy Totals
    totalsWrapper: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 },
    totalsBox: { width: '50%' },
    totRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    totLabel: { fontSize: 9, color: '#555' },
    totVal: { fontSize: 9, color: '#111', textAlign: 'right' },
    grandTotRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#000', marginTop: 10 },
    grandTotLabel: { fontSize: 11, fontFamily: B, color: '#111', textTransform: 'uppercase', letterSpacing: 1 },
    grandTotVal: { fontSize: 11, fontFamily: B, color: PRIMARY, textAlign: 'right' },

    // Bottom Area
    bottomFlex: { marginTop: 50 },
    notesWrap: { marginBottom: 30 },
    sectionTitle: { fontSize: 8, color: '#999', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
    notesText: { fontSize: 8.5, color: '#444', lineHeight: 1.6, maxWidth: '80%' },
    
    sigWrap: { alignItems: 'flex-end', marginTop: 20 },
    sigImg: { width: 140, height: 50, objectFit: 'contain', marginBottom: 10 },
    sigLine: { width: 160, height: 1, backgroundColor: '#DDD', marginBottom: 6 },
    sigText: { fontSize: 8, color: '#777', textTransform: 'uppercase', letterSpacing: 1 },

    // Footer: Asymmetric Split Border
    footerBox: { position: 'absolute', bottom: 30, left: 60, right: 60 },
    footerBorderRow: { flexDirection: 'row', width: '100%', marginBottom: 15 },
    footerBorderLeft: { height: 2, width: '30%', backgroundColor: PRIMARY },
    footerBorderRight: { height: 1, width: '70%', backgroundColor: '#DDD' },
    footerContentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerText: { fontSize: 7, color: '#999', letterSpacing: 1, textTransform: 'uppercase' },
    footerLink: { color: PRIMARY, fontFamily: B, textDecoration: 'none' }
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
        
        <View style={s.headerWrap}>
          <View style={s.bizBox}>
            {biz?.businessLogo && <Image style={s.topLogo} src={biz.businessLogo} />}
            <View style={s.brandText}>
            <Text style={s.bizName}>{bizName}</Text>
            {biz?.address?.street && <Text style={s.bizText}>{String(biz.address.street).replace(/\s+,/g, ',').replace(/,(?=\S)/g, ', ').trim()}</Text>}
            {biz?.address?.city && <Text style={s.bizText}>{[[biz?.address?.city, biz?.address?.state].map((v) => String(v || '').trim().replace(/[-,\s]+$/, '')).filter(Boolean).join(', '), String(biz?.address?.pincode || '').trim()].filter(Boolean).join(' ')}</Text>}
            {biz?.phone && <Text style={s.bizText}>{biz.phone}</Text>}
            {biz?.email && <Text style={s.bizText}>{biz.email}</Text>}
            {biz?.gstin && <Text style={[s.bizText, { marginTop: 10, fontFamily: B }]}>GSTIN: {biz.gstin}</Text>}
            </View>
          </View>
          
          <View style={s.docBox}>
            <Text style={s.docTitle}>{docTitle}</Text>
            <View style={s.docMetaRow}>
              <Text style={s.docMetaLabel}>{isQuotation ? 'QUOTE NO' : 'INVOICE NO'}</Text>
              <Text style={s.docMetaVal}>{docNo}</Text>
            </View>
            <View style={s.docMetaRow}>
              <Text style={s.docMetaLabel}>DATE</Text>
              <Text style={s.docMetaVal}>{new Date(invoice.issueDate).toLocaleDateString('en-US')}</Text>
            </View>
            {invoice.dueDate && (
              <View style={s.docMetaRow}>
                <Text style={s.docMetaLabel}>DUE</Text>
                <Text style={s.docMetaVal}>{new Date(invoice.dueDate).toLocaleDateString('en-US')}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.billToWrap}>
          <Text style={s.billToLabel}>BILLED TO</Text>
          <Text style={s.clientName}>{client?.name}</Text>
          {client?.address?.street && <Text style={s.clientText}>{client.address.street}</Text>}
          {client?.address?.city && <Text style={s.clientText}>{client.address.city}, {client.address.state} {client.address.pincode}</Text>}
          {client?.phone && <Text style={s.clientText}>{client.phone}</Text>}
          {client?.email && <Text style={s.clientText}>{client.email}</Text>}
        </View>

        <View style={s.table}>
          <View style={s.tHead}>
            <Text style={[s.th, s.colNo]}>NO.</Text>
            <Text style={[s.th, s.colDesc]}>DESCRIPTION</Text>
            {hasHsn && <Text style={[s.th, s.colHsn]}>HSN</Text>}
            <Text style={[s.th, s.colQty]}>QTY</Text>
            <Text style={[s.th, s.colPrice]}>PRICE</Text>
            {hasDiscount && <Text style={[s.th, s.colDisc]}>DISC</Text>}
            {showCGST && <Text style={[s.th, s.colTax]}>CGST</Text>}
            {showSGST && <Text style={[s.th, s.colTax]}>SGST</Text>}
            {showIGST && <Text style={[s.th, s.colTax]}>IGST</Text>}
            {showVAT && <Text style={[s.th, s.colTax]}>VAT</Text>}
            <Text style={[s.th, s.colTotal]}>TOTAL</Text>
          </View>

          {invoice.items?.map((item, i) => (
            <View key={i} style={s.tRow}>
              <Text style={[s.td, s.colNo, { color: '#999' }]}>{(i + 1).toString().padStart(2, '0')}</Text>
              <View style={[s.td, s.colDesc, { paddingRight: 15 }]}>
                <Text style={{ fontFamily: M }}>{item.name}</Text>
                {item.description && <Text style={{ fontSize: 8, color: '#888', marginTop: 4, lineHeight: 1.4 }}>{item.description}</Text>}
              </View>
              {hasHsn && <Text style={[s.td, s.colHsn]}>{item.hsn || '—'}</Text>}
              <Text style={[s.td, s.colQty]}>{item.itemType === 'Service' ? '-' : `${item.quantity}${item.unit ? ` ${item.unit}` : ''}`}</Text>
              <Text style={[s.td, s.colPrice]}>{fmt(item.price)}</Text>
              {hasDiscount && <Text style={[s.td, s.colDisc]}>{item.discount || 0}%</Text>}
              {showCGST && <Text style={[s.td, s.colTax]}>{item.cgstRate || 0}%</Text>}
              {showSGST && <Text style={[s.td, s.colTax]}>{item.sgstRate || 0}%</Text>}
              {showIGST && <Text style={[s.td, s.colTax]}>{item.igstRate || 0}%</Text>}
              {showVAT && <Text style={[s.td, s.colTax]}>{item.vatRate || 0}%</Text>}
              <Text style={[s.td, s.colTotal]}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totalsWrapper}>
          <View style={s.totalsBox}>
            <View style={s.totRow}><Text style={s.totLabel}>Subtotal</Text><Text style={s.totVal}>{fmt(invoice.subtotal)}</Text></View>
            {invoice.discountAmount > 0 && <View style={s.totRow}><Text style={s.totLabel}>Discount</Text><Text style={s.totVal}>-{fmt(invoice.discountAmount)}</Text></View>}
            {showCGST && <View style={s.totRow}><Text style={s.totLabel}>CGST</Text><Text style={s.totVal}>{fmt(invoice.cgstTotal)}</Text></View>}
            {showSGST && <View style={s.totRow}><Text style={s.totLabel}>SGST</Text><Text style={s.totVal}>{fmt(invoice.sgstTotal)}</Text></View>}
            {showIGST && <View style={s.totRow}><Text style={s.totLabel}>IGST</Text><Text style={s.totVal}>{fmt(invoice.igstTotal)}</Text></View>}
            {showVAT && <View style={s.totRow}><Text style={s.totLabel}>VAT</Text><Text style={s.totVal}>{fmt(invoice.vatTotal)}</Text></View>}
            {invoice.roundOff && Math.abs(roundOffDiff) > 0.001 && <View style={s.totRow}><Text style={s.totLabel}>Round Off</Text><Text style={s.totVal}>{roundOffDiff >= 0 ? '+' : '-'}{fmt(Math.abs(roundOffDiff))}</Text></View>}
            <View style={s.grandTotRow}>
              <Text style={s.grandTotLabel}>Total {currency}</Text>
              <Text style={s.grandTotVal}>{fmt(invoice.total)}</Text>
            </View>
          </View>
        </View>

        <View style={s.bottomFlex}>
          {isQuotation && biz?.bankDetails?.accountNumber && (
            <View style={s.notesWrap}>
              <Text style={s.sectionTitle}>Payment Details</Text>
              {biz.bankDetails.bankName && <Text style={s.notesText}>{biz.bankDetails.bankName}</Text>}
              {biz.bankDetails.accountName && <Text style={s.notesText}>A/C Name: {biz.bankDetails.accountName}</Text>}
              <Text style={s.notesText}>A/C: {biz.bankDetails.accountNumber}</Text>
              {biz.bankDetails.ifscCode && <Text style={s.notesText}>IFSC: {biz.bankDetails.ifscCode}</Text>}
              {biz.bankDetails.swiftCode && <Text style={s.notesText}>SWIFT: {biz.bankDetails.swiftCode}</Text>}
              {biz.bankDetails.branch && <Text style={s.notesText}>Branch: {biz.bankDetails.branch}</Text>}
            </View>
          )}
          {!biz?.bankDetails?.accountNumber && invoice.paymentInfo && (
             <View style={s.notesWrap}>
                <Text style={s.sectionTitle}>Payment Info</Text>
                <Text style={s.notesText}>{invoice.paymentInfo}</Text>
             </View>
          )}
          
          {invoice.notes && (
            <View style={s.notesWrap}>
              <Text style={s.sectionTitle}>Notes</Text>
              <Text style={s.notesText}>{notesText}</Text>
            </View>
          )}
          {invoice.termsAndConditions && (
            <View style={s.notesWrap}>
              <Text style={s.sectionTitle}>Terms & Conditions</Text>
              <Text style={s.notesText}>{termsText}</Text>
            </View>
          )}
          
          <View style={s.sigWrap} wrap={false}>
            {biz?.businessSignature && <Image src={biz.businessSignature} style={s.sigImg} />}
            <View style={s.sigLine} />
            <Text style={s.sigText}>Authorised Signatory</Text>
          </View>
        </View>

        <View style={s.footerBox} fixed>
          <View style={s.footerBorderRow}>
            <View style={s.footerBorderLeft} />
            <View style={s.footerBorderRight} />
          </View>
          <View style={s.footerContentRow}>
            <Text style={s.footerText}>
              {biz?.phone && `P: ${biz.phone}  |  `}
              {biz?.email && `E: ${biz.email}`}
            </Text>
            <Text style={s.footerText}>
              Generated securely • Powered by <Text style={{ fontSize: 8, fontFamily: 'Helvetica' }}>™</Text><Link style={s.footerLink} src="https://invoice.goodsynk.com">GoodSynk</Link>
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}