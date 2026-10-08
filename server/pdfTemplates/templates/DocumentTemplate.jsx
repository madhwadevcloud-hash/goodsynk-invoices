import SignatoryDetails from './SignatoryDetails';
import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { isRasterImage } from './watermarkUtils';
import { getAddressStreet, getAddressCityLine } from './addressUtils';
import { fitFont, safeHyphenation } from './layoutUtils';

const themes = {
  invoice12: { ink: '#123B5D', accent: '#D9A441', soft: '#F2F5F7', mode: 'ledger', title: 'INVOICE' },
  invoice13: { ink: '#243B53', accent: '#E07A5F', soft: '#FFF4F0', mode: 'band', title: 'INVOICE' },
  invoice14: { ink: '#174A3A', accent: '#B7D7C5', soft: '#F1F8F4', mode: 'columns', title: 'INVOICE' },
  invoice15: { ink: '#202124', accent: '#F4B942', soft: '#FFF9E8', mode: 'receipt', title: 'INVOICE' },
  // Quotation themes mirror their invoice counterpart exactly (same ink/accent/soft/mode)
  // so the two documents are visually identical apart from the heading and doc-specific copy.
  quotation12: { ink: '#123B5D', accent: '#D9A441', soft: '#F2F5F7', mode: 'ledger', title: 'QUOTATION' },
  quotation13: { ink: '#243B53', accent: '#E07A5F', soft: '#FFF4F0', mode: 'band', title: 'QUOTATION' },
  quotation14: { ink: '#174A3A', accent: '#B7D7C5', soft: '#F1F8F4', mode: 'columns', title: 'QUOTATION' },
  quotation15: { ink: '#202124', accent: '#F4B942', soft: '#FFF9E8', mode: 'receipt', title: 'QUOTATION' },
};

const money = (value, currency) => `${currency === 'INR' ? 'Rs. ' : `${currency} `}${Number(value || 0).toFixed(2)}`;
const date = (value) => value ? new Date(value).toLocaleDateString('en-GB') : '-';

const hexToRgba = (hex, alpha) => {
  if (!hex) return 'rgba(0, 0, 0, ' + alpha + ')';
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
};


export default function DocumentTemplate({ invoice, variant }) {
  // Break long unbroken tokens (invoice numbers, e-mails) so they wrap inside their column.
  Font.registerHyphenationCallback(safeHyphenation);
  const theme = themes[variant] || themes.invoice12;
  const biz = invoice.user || {};
  const client = invoice.client || {};
  const currency = invoice.currency || 'INR';
  const number = invoice.invoiceNumber || invoice.quotationNumber || '-';
  const items = invoice.items || [];
  // client.address is an object ({ street, city, state, pincode }); interpolating it directly printed "[object Object]".
  const clientAddress = [getAddressStreet(client.address), getAddressCityLine(client.address)].filter(Boolean).join('\n');
  const isQuotation = theme.title === 'QUOTATION';
  const notesText = (variant === 'invoice12' || variant === 'quotation12')
    ? (Array.isArray(invoice.notes) ? invoice.notes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim() : String(invoice.notes || '').replace(/\s+/g, ' ').trim())
    : invoice.notes;
  // Template 12: notes, terms and bank details read as ONE tight paragraph.
  const isTight = variant === 'invoice12' || variant === 'quotation12';
  const flat = (v) => (Array.isArray(v) ? v.filter(Boolean).join(' ') : String(v || '')).replace(/\s+/g, ' ').trim();
  const bankLine = biz.bankDetails?.bankName ? `Bank: ${biz.bankDetails.bankName}${biz.bankDetails.accountNumber ? ` | A/C ${biz.bankDetails.accountNumber}` : ''}${biz.bankDetails.ifscCode ? ` | IFSC ${biz.bankDetails.ifscCode}` : ''}${biz.bankDetails.branch ? ` | Branch ${biz.bankDetails.branch}` : ''}` : '';
  const tightNotes = [flat(invoice.notes), flat(invoice.termsAndConditions), bankLine].filter(Boolean).join(' ');
  const styles = StyleSheet.create({
    page: { padding: 34, fontSize: 9, color: '#27313B', fontFamily: 'Helvetica', backgroundColor: '#FFFFFF' },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 18, borderBottomWidth: theme.mode === 'band' ? 0 : 1, borderBottomColor: theme.accent },
    // flex:1 + minWidth:0: a long business name wraps in its own column instead of running under the INVOICE title
    brand: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, paddingRight: 16 },
    titleBlock: { flexShrink: 0, maxWidth: 210, alignItems: 'flex-end' },
    logo: { width: variant === 'invoice12' || variant === 'invoice13' ? 84 : 36, height: variant === 'invoice12' || variant === 'invoice13' ? 48 : 36, objectFit: 'contain', flexShrink: 0 },
    logoFallback: { width: variant === 'invoice12' || variant === 'invoice13' ? 84 : 36, height: variant === 'invoice12' || variant === 'invoice13' ? 48 : 36, backgroundColor: theme.ink, color: '#FFFFFF', textAlign: 'center', paddingTop: 12, fontSize: 10, fontFamily: 'Helvetica-Bold' },
    bizName: { color: theme.ink, fontSize: 14, fontFamily: 'Helvetica-Bold' },
    muted: { color: '#66717D', marginTop: 3, lineHeight: 1.35 },
    title: { color: theme.ink, fontSize: 25, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
    meta: { textAlign: 'right', color: '#66717D', lineHeight: 1.45, maxWidth: 210 },
    metaStrong: { color: theme.ink, fontFamily: 'Helvetica-Bold' },
    intro: { backgroundColor: theme.soft, padding: 14, marginTop: 16, borderLeftWidth: 5, borderLeftColor: theme.accent, flexDirection: 'row', justifyContent: 'space-between' },
    sectionLabel: { color: theme.ink, fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
    address: { color: '#3F4B57', lineHeight: 1.35, maxWidth: 220 },
    table: { marginTop: 20 },
    head: { flexDirection: 'row', backgroundColor: theme.ink, color: '#FFFFFF', padding: 8, fontFamily: 'Helvetica-Bold' },
    row: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#E8EBEE', minHeight: 28 },
    alt: { backgroundColor: theme.soft },
    desc: { width: '40%' }, qty: { width: '10%', textAlign: 'right' }, price: { width: '17%', textAlign: 'right' }, tax: { width: '15%', textAlign: 'right' }, total: { width: '18%', textAlign: 'right' },
    itemName: { fontFamily: 'Helvetica-Bold', color: theme.ink },
    itemSub: { color: '#74808B', fontSize: 7, marginTop: 2 },
    lower: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 24 },
    notes: { width: '52%', color: '#53606C', lineHeight: variant === 'invoice12' ? 1.08 : 1.4 },
    totals: { width: '38%', borderTopWidth: 2, borderTopColor: theme.ink, paddingTop: 8 },
    totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
    grand: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.accent, color: theme.ink, padding: 9, marginTop: 6, fontFamily: 'Helvetica-Bold', fontSize: 11 },
    footer: { marginTop: 28, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E8EBEE', flexDirection: 'row', justifyContent: 'space-between' },
    signature: { textAlign: 'right', color: '#66717D' },
    signatureImage: { height: 28, width: 90, objectFit: 'contain', marginBottom: 3 },
    band: { backgroundColor: theme.ink, color: '#FFFFFF', marginHorizontal: -34, padding: '18px 34px', flexDirection: 'row', justifyContent: 'space-between' },
    callout: { marginTop: 18, padding: 14, borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.soft },
    watermarkContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: -100 },
    watermarkImg: { width: 250, height: 250, objectFit: 'contain', opacity: 0.12 },
    watermarkText: { fontSize: 60, fontFamily: 'Helvetica-Bold', color: hexToRgba(theme.ink, 0.08), transform: 'rotate(-45deg)', letterSpacing: 5 },
  });

  if (variant === 'invoice13') {
    const accent = theme.accent;
    const ink = theme.ink;
    const businessName = biz.businessName || biz.name || 'Your Business';
    const businessLocation = [biz.address?.city, biz.address?.state].filter(Boolean).join(', ');
    const businessAddress = [getAddressStreet(biz.address), getAddressCityLine(biz.address)].filter(Boolean).join(', ');
    const issuedDate = invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-US') : '-';
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US') : 'Upon Receipt';
    const amount = (value) => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const totalLabel = `${currency === 'INR' ? 'INR' : currency} ${amount(invoice.total)}`;
    const taxRows = [
      ['CGST', invoice.cgstTotal],
      ['SGST', invoice.sgstTotal],
      ['IGST', invoice.igstTotal],
      ['VAT', invoice.vatTotal],
    ].filter(([, value]) => Number(value) > 0);
    const rateOf = (k) => { const r = items[0] && items[0][`${k.toLowerCase()}Rate`]; return r ? ` ${r}%` : ''; };
    if (!taxRows.length && Number(invoice.taxTotal) > 0) taxRows.push(['TAX', invoice.taxTotal]);
    const paymentDetails = invoice.paymentInfo || [
      biz.bankDetails?.bankName,
      biz.bankDetails?.accountNumber && `A/C ${biz.bankDetails.accountNumber}`,
      biz.bankDetails?.ifscCode && `IFSC ${biz.bankDetails.ifscCode}`,
    ].filter(Boolean).join(' | ');
    const notes = Array.isArray(invoice.notes) ? invoice.notes.filter(Boolean).join(' ') : String(invoice.notes || '').replace(/\s*\n\s*/g, ' ');
    const signerName = String(biz.signatoryName || biz.name || biz.ownerName || biz.businessName || '').trim();
    const contactLine = [biz.phone, biz.email].filter(Boolean).join(' | ');
    const invoice13Styles = StyleSheet.create({
      page: { padding: 0, fontFamily: 'Helvetica', fontSize: 9, color: '#111111', backgroundColor: '#FFFFFF' },
      header: { height: 132, backgroundColor: accent, paddingTop: 28, paddingHorizontal: 42, position: 'relative' },
      title: { color: '#FFFFFF', fontSize: 30, fontFamily: 'Helvetica-Bold', letterSpacing: 2 },
      company: { color: '#FDECE6', fontSize: 10, marginTop: 6 },
      metadata: { color: '#FDECE6', fontSize: 9, position: 'absolute', left: 42, top: 103 },
      logo: { position: 'absolute', top: 22, right: 42, width: 96, height: 60, objectFit: 'contain', objectPositionX: '100%', backgroundColor: '#FFFFFF', padding: 4, borderRadius: 6 },
      billFrom: { marginTop: 24, marginHorizontal: 42, height: 70, paddingTop: 16, paddingBottom: 8, paddingHorizontal: 18, borderRadius: 8, backgroundColor: ink, flexDirection: 'row' },
      billColumn: { width: '55%', paddingRight: 10 },
      fromColumn: { width: '45%', paddingLeft: 8 },
      label: { color: accent, fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 1, marginBottom: 5 },
      clientName: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Helvetica-Bold' },
      lightText: { color: '#CBD5E1', fontSize: 8.5, marginTop: 3 },
      fromText: { color: '#FFFFFF', fontSize: 10 },
      table: { marginTop: 27, marginHorizontal: 42 },
      tableHead: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: accent, paddingBottom: 10 },
      description: { flex: 1, paddingRight: 10 },
      quantity: { width: 62 },
      rate: { width: 71 },
      rowAmount: { width: 90, textAlign: 'right' },
      headText: { color: ink, fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
      tableRow: { flexDirection: 'row', minHeight: 36, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1E2DD' },
      tableRowLast: { borderBottomColor: ink },
      rowText: { color: '#111111', fontSize: 9.5 },
      rowAmountText: { color: '#111111', fontSize: 9.5, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
      totals: { width: 253, marginTop: 25, marginRight: 42, marginLeft: 'auto' },
      totalRow: { flexDirection: 'row', justifyContent: 'space-between', height: 18, alignItems: 'center', marginLeft: 30 },
      totalLabel: { color: '#555555', fontSize: 10 },
      totalValue: { color: '#111111', fontSize: 10, textAlign: 'right' },
      grandTotal: { height: 38, marginTop: 10, paddingLeft: 14, paddingRight: 13, backgroundColor: accent, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
      grandLabel: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
      grandValue: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Helvetica-Bold' },
      payment: { width: 330, marginTop: 28, marginLeft: 42, paddingTop: 12, paddingBottom: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#FDF3F0', minHeight: 74 },
      paymentLabel: { color: ink, fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 1, marginBottom: 8 },
      paymentText: { color: '#666666', fontSize: 8.2, lineHeight: 1.7 },
      signatory: { position: 'absolute', top: 682, right: 29, width: 120, alignItems: 'center' },
      signature: { width: 110, height: 20, objectFit: 'contain' },
      signatureSlot: { height: 22, width: 120, alignItems: 'center', justifyContent: 'flex-end' },
      signatureLine: { width: 120, borderBottomWidth: 1, borderBottomColor: ink, marginBottom: 7 },
      signatoryLabel: { color: '#555555', fontSize: 8, textAlign: 'center' },
      signatoryName: { color: ink, fontSize: 8, fontFamily: 'Helvetica-Bold', marginTop: 2 },
      sealSlot: { position: 'absolute', top: 743.7, left: 485.75, width: 40, height: 40 },
      seal: { width: 40, height: 40, borderWidth: 1.2, borderColor: accent, borderStyle: 'dashed', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
      sealText: { color: accent, fontSize: 6.5, fontFamily: 'Helvetica-Bold' },
      footerLine: { position: 'absolute', top: 800, left: 0, right: 0, borderTopWidth: 1, borderTopColor: ink },
      footerContact: { position: 'absolute', top: 811, left: 42, width: 180, color: '#888888', fontSize: 8 },
      powered: { position: 'absolute', top: 811, left: 225, width: 145, color: '#888888', textAlign: 'center', fontSize: 8 },
      footerLink: { position: 'absolute', top: 811, right: 42, width: 150, color: accent, textAlign: 'right', fontSize: 8, fontFamily: 'Helvetica-Bold' },
    });

    return (
      <Document>
        <Page size="A4" style={invoice13Styles.page}>
          {(!biz.plan || String(biz.plan).toLowerCase() === 'free') && (
            <View style={styles.watermarkContainer} fixed pointerEvents="none"><Text style={styles.watermarkText}>GoodSynk</Text></View>
          )}
          <View style={invoice13Styles.header}>
            <Text style={invoice13Styles.title}>INVOICE</Text>
            <Text wrap={false} style={[invoice13Styles.company, { fontSize: fitFont(`${businessName}${businessLocation ? ` • ${businessLocation}` : ''}`, 10, biz.businessLogo ? 380 : 500, 6) }]}>
              {businessName}{businessLocation ? ` • ${businessLocation}` : ''}
            </Text>
            <Text wrap={false} style={invoice13Styles.metadata}>
              INVOICE {number}  |  ISSUED {issuedDate}  |  DUE {dueDate}
            </Text>
            {biz.businessLogo && <Image src={biz.businessLogo} style={invoice13Styles.logo} />}
          </View>

          <View style={invoice13Styles.billFrom}>
            <View style={invoice13Styles.billColumn}>
              <Text style={invoice13Styles.label}>BILL TO</Text>
              <Text numberOfLines={1} style={invoice13Styles.clientName}>{client.name || 'Client'}</Text>
              <Text numberOfLines={1} wrap={false} style={invoice13Styles.lightText}>
                {[clientAddress.replace(/\n/g, ', '), client.phone].filter(Boolean).join('  •  ')}
              </Text>
            </View>
            <View style={invoice13Styles.fromColumn}>
              <Text style={invoice13Styles.label}>FROM</Text>
              <Text numberOfLines={1} wrap={false} style={invoice13Styles.fromText}>{businessAddress}</Text>
              {biz.gstin && <Text numberOfLines={1} wrap={false} style={invoice13Styles.lightText}>GSTIN: {biz.gstin}</Text>}
            </View>
          </View>

          <View style={invoice13Styles.table}>
            <View style={invoice13Styles.tableHead}>
              <Text style={[invoice13Styles.headText, invoice13Styles.description]}>DESCRIPTION</Text>
              <Text style={[invoice13Styles.headText, invoice13Styles.quantity]}>QTY</Text>
              <Text style={[invoice13Styles.headText, invoice13Styles.rate]}>RATE</Text>
              <Text style={[invoice13Styles.headText, invoice13Styles.rowAmount]}>AMOUNT</Text>
            </View>
            {items.map((item, index) => (
              <View key={index} style={[invoice13Styles.tableRow, index === items.length - 1 ? invoice13Styles.tableRowLast : {}]} wrap={false}>
                <Text style={[invoice13Styles.rowText, invoice13Styles.description]}>{item.name || 'Item'}</Text>
                <Text style={[invoice13Styles.rowText, invoice13Styles.quantity]}>{item.quantity || 0}</Text>
                <Text style={[invoice13Styles.rowText, invoice13Styles.rate]}>{amount(item.price)}</Text>
                <Text style={[invoice13Styles.rowAmountText, invoice13Styles.rowAmount]}>{amount(item.total ?? (item.price || 0) * (item.quantity || 0))}</Text>
              </View>
            ))}
          </View>

          <View style={invoice13Styles.totals}>
            <View style={invoice13Styles.totalRow}><Text style={invoice13Styles.totalLabel}>SUBTOTAL</Text><Text style={invoice13Styles.totalValue}>{amount(invoice.subtotal)}</Text></View>
            {Number(invoice.discountAmount) > 0 && <View style={invoice13Styles.totalRow}><Text style={invoice13Styles.totalLabel}>DISCOUNT</Text><Text style={invoice13Styles.totalValue}>-{amount(invoice.discountAmount)}</Text></View>}
            {taxRows.map(([label, value]) => <View key={label} style={invoice13Styles.totalRow}><Text style={invoice13Styles.totalLabel}>{label}{rateOf(label)}</Text><Text style={invoice13Styles.totalValue}>{amount(value)}</Text></View>)}
            <View style={invoice13Styles.grandTotal}><Text style={invoice13Styles.grandLabel}>TOTAL</Text><Text style={invoice13Styles.grandValue}>{totalLabel}</Text></View>
          </View>

          <View style={invoice13Styles.payment}>
            <Text style={invoice13Styles.paymentLabel}>PAYMENT DETAILS</Text>
            <Text style={invoice13Styles.paymentText}>{paymentDetails || notes || 'Payment details will be shared separately.'}</Text>
            {paymentDetails && notes && <Text style={invoice13Styles.paymentText}>{notes}</Text>}
          </View>

          <View style={invoice13Styles.signatory}>
            <View style={invoice13Styles.signatureSlot}>
              {biz.businessSignature && <Image src={biz.businessSignature} style={invoice13Styles.signature} />}
            </View>
            <View style={invoice13Styles.signatureLine} />
            <Text style={invoice13Styles.signatoryLabel}>Authorised Signatory</Text>
            {signerName ? <Text wrap={false} style={invoice13Styles.signatoryName}>{signerName}</Text> : null}
          </View>
          <View style={invoice13Styles.sealSlot}>
            {biz.businessSeal ? (
              <Image src={biz.businessSeal} style={{ width: 40, height: 40, objectFit: 'contain' }} />
            ) : (
              <View style={invoice13Styles.seal}><Text style={invoice13Styles.sealText}>SEAL</Text></View>
            )}
          </View>

          <View style={invoice13Styles.footerLine} fixed />
          <Text wrap={false} style={[invoice13Styles.footerContact, { fontSize: fitFont(contactLine, 8, 180, 5) }]} fixed>{contactLine}</Text>
          <Text style={invoice13Styles.powered} fixed>Powered by GoodSynk™</Text>
          <Text style={invoice13Styles.footerLink} fixed>invoice.goodsynk.com</Text>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Watermark */}
        {(!biz?.plan || String(biz.plan).toLowerCase() === 'free') ? (
          <View style={styles.watermarkContainer} pointerEvents="none" fixed>
            <Text style={styles.watermarkText}>GoodSynk</Text>
          </View>
        ) : isRasterImage(invoice.watermarkImage || biz.watermarkImage) ? (
          <View style={styles.watermarkContainer} pointerEvents="none" fixed>
            <Image src={invoice.watermarkImage || biz.watermarkImage} style={styles.watermarkImg} />
          </View>
        ) : null}
        {theme.mode === 'band' ? (
          <View style={styles.band}>
            <View style={styles.brand}>{biz.businessLogo ? <Image src={biz.businessLogo} style={styles.logo} /> : <Text style={styles.logoFallback}>G</Text>}<View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} wrap={false} style={{ ...styles.bizName, color: '#FFFFFF' }}>{biz.businessName || biz.name || 'Your Business'}</Text><Text style={{ color: '#DCE5ED', marginTop: 3 }}>Tax invoice and payment record</Text></View></View>
            <View style={styles.titleBlock}><Text style={{ ...styles.title, color: '#FFFFFF' }}>{theme.title}</Text><Text style={{ color: '#DCE5ED', textAlign: 'right', marginTop: 4, maxWidth: 210 }}>#{number}</Text></View>
          </View>
        ) : (
          <View style={styles.top}>
            <View style={styles.brand}>{biz.businessLogo ? <Image src={biz.businessLogo} style={styles.logo} /> : <Text style={styles.logoFallback}>G</Text>}<View style={{ flex: 1, minWidth: 0 }}><Text numberOfLines={1} wrap={false} style={styles.bizName}>{biz.businessName || biz.name || 'Your Business'}</Text><Text wrap={false} style={styles.muted}>{biz.email || ''}</Text></View></View>
            <View style={styles.titleBlock}><Text style={styles.title}>{theme.title}</Text><Text style={styles.meta}>#{number}{'\n'}Issued {date(invoice.issueDate)}{'\n'}{isQuotation ? `Valid until ${date(invoice.validUntil)}` : `Due ${date(invoice.dueDate)}`}</Text></View>
          </View>
        )}
        {isQuotation && <View style={styles.callout}><Text style={styles.sectionLabel}>Project proposal</Text><Text style={{ color: theme.ink, fontFamily: 'Helvetica-Bold' }}>Thank you for the opportunity to work together.</Text><Text style={styles.muted}>This quotation outlines the requested products and services, pricing, and terms.</Text></View>}
        <View style={styles.intro}>
          <View><Text style={styles.sectionLabel}>{isQuotation ? 'Prepared for' : 'Bill to'}</Text><Text style={{ ...styles.address, fontFamily: 'Helvetica-Bold', color: theme.ink }}>{client.name || 'Client'}</Text><Text style={styles.address}>{client.email || ''}{client.phone ? `\n${client.phone}` : ''}{clientAddress ? `\n${clientAddress}` : ''}</Text></View>
          <View><Text style={styles.sectionLabel}>Business details</Text><Text style={styles.address}>{biz.phone || ''}{biz.gstin ? `\nGSTIN: ${biz.gstin}` : ''}{biz.address?.city ? `\n${biz.address.city}, ${biz.address.state || ''}` : ''}</Text></View>
        </View>
        <View style={styles.table}>
          <View style={styles.head}><Text style={styles.desc}>Description</Text><Text style={styles.qty}>Qty</Text><Text style={styles.price}>Rate</Text><Text style={styles.tax}>Tax</Text><Text style={styles.total}>Amount</Text></View>
          {items.map((item, index) => <View key={index} style={[styles.row, index % 2 ? styles.alt : {}]}><View style={styles.desc}><Text style={styles.itemName}>{item.name || 'Item'}</Text><Text style={styles.itemSub}>{item.description || ''}{item.hsn ? ` | HSN ${item.hsn}` : ''}</Text></View><Text style={styles.qty}>{item.quantity || 0} {item.unit || ''}</Text><Text style={styles.price}>{money(item.price, currency)}</Text><Text style={styles.tax}>{Number(item.cgstRate || 0) + Number(item.sgstRate || 0) + Number(item.igstRate || 0) + Number(item.vatRate || 0)}%</Text><Text style={styles.total}>{money(item.total ?? (item.price || 0) * (item.quantity || 0), currency)}</Text></View>)}
        </View>
        <View style={styles.lower}>
          <View style={styles.notes}><Text style={styles.sectionLabel}>{isQuotation ? 'Scope and terms' : 'Notes and payment details'}</Text>{isTight ? <Text style={{ fontSize: 8, lineHeight: 1.15, color: '#53606C' }}>{tightNotes || 'Thank you for your business.'}</Text> : <><Text>{notesText || 'Thank you for your business.'}</Text><Text style={{ marginTop: 8 }}>{invoice.termsAndConditions || ''}</Text>{biz.bankDetails?.bankName && <Text style={{ marginTop: 8 }}>Bank: {biz.bankDetails.bankName}{biz.bankDetails.accountNumber ? ` | A/C ${biz.bankDetails.accountNumber}` : ''}{biz.bankDetails.ifscCode ? ` | IFSC ${biz.bankDetails.ifscCode}` : ''}{biz.bankDetails.branch ? ` | Branch ${biz.bankDetails.branch}` : ''}</Text>}</>}</View>
          <View style={styles.totals}><View style={styles.totalLine}><Text>Subtotal</Text><Text>{money(invoice.subtotal, currency)}</Text></View><View style={styles.totalLine}><Text>Discount</Text><Text>- {money(invoice.discountAmount, currency)}</Text></View><View style={styles.totalLine}><Text>Tax</Text><Text>{money(invoice.taxTotal, currency)}</Text></View><View style={styles.grand}><Text>{isQuotation ? 'Estimated total' : 'Amount due'}</Text><Text>{money(invoice.total, currency)}</Text></View></View>
        </View>
        <View style={{ marginTop: 10, paddingHorizontal: 34, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end' }} wrap={false}>
          {biz.businessSeal && <Image src={biz.businessSeal} style={{ height: 50, width: 50, objectFit: 'contain', marginRight: 12 }} />}
          <SignatoryDetails biz={biz} color={theme.primary} />
        </View>
        <View style={styles.footer} fixed>
          <Text style={styles.muted}>Powered by GoodSynk<Text style={{ fontSize: 7, fontFamily: 'Helvetica' }}>™</Text> | {biz.email || 'invoice.goodsynk.com'}</Text>
        </View>
        <Text
          style={{ position: 'absolute', bottom: 12, right: 34, fontSize: 7.5, color: '#333333' }}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
