import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

const themes = {
  invoice12: { ink: '#123B5D', accent: '#D9A441', soft: '#F2F5F7', mode: 'ledger', title: 'INVOICE' },
  invoice13: { ink: '#243B53', accent: '#E07A5F', soft: '#FFF4F0', mode: 'band', title: 'INVOICE' },
  invoice14: { ink: '#174A3A', accent: '#B7D7C5', soft: '#F1F8F4', mode: 'columns', title: 'INVOICE' },
  invoice15: { ink: '#202124', accent: '#F4B942', soft: '#FFF9E8', mode: 'receipt', title: 'INVOICE' },
  quotation12: { ink: '#6B2D5C', accent: '#F2C14E', soft: '#FFF8E5', mode: 'proposal', title: 'QUOTATION' },
  quotation13: { ink: '#1D3557', accent: '#A8DADC', soft: '#EFFBFC', mode: 'roadmap', title: 'QUOTATION' },
  quotation14: { ink: '#7F5539', accent: '#EDE0D4', soft: '#FBF7F2', mode: 'portfolio', title: 'QUOTATION' },
  quotation15: { ink: '#3D405B', accent: '#81B29A', soft: '#F1F7F2', mode: 'contract', title: 'QUOTATION' },
};

const money = (value, currency) => `${currency === 'INR' ? 'Rs. ' : `${currency} `}${Number(value || 0).toFixed(2)}`;
const date = (value) => value ? new Date(value).toLocaleDateString('en-GB') : '-';

export default function DocumentTemplate({ invoice, variant }) {
  const theme = themes[variant] || themes.invoice12;
  const biz = invoice.user || {};
  const client = invoice.client || {};
  const currency = invoice.currency || 'INR';
  const number = invoice.invoiceNumber || invoice.quotationNumber || '-';
  const items = invoice.items || [];
  const isQuotation = theme.title === 'QUOTATION';
  const styles = StyleSheet.create({
    page: { padding: 34, fontSize: 9, color: '#27313B', fontFamily: 'Helvetica', backgroundColor: '#FFFFFF' },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 18, borderBottomWidth: theme.mode === 'band' ? 0 : 1, borderBottomColor: theme.accent },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logo: { width: 36, height: 36, objectFit: 'contain' },
    logoFallback: { width: 36, height: 36, backgroundColor: theme.ink, color: '#FFFFFF', textAlign: 'center', paddingTop: 12, fontSize: 10, fontFamily: 'Helvetica-Bold' },
    bizName: { color: theme.ink, fontSize: 14, fontFamily: 'Helvetica-Bold' },
    muted: { color: '#66717D', marginTop: 3, lineHeight: 1.35 },
    title: { color: theme.ink, fontSize: 25, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
    meta: { textAlign: 'right', color: '#66717D', lineHeight: 1.45 },
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
    notes: { width: '52%', color: '#53606C', lineHeight: 1.4 },
    totals: { width: '38%', borderTopWidth: 2, borderTopColor: theme.ink, paddingTop: 8 },
    totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
    grand: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.accent, color: theme.ink, padding: 9, marginTop: 6, fontFamily: 'Helvetica-Bold', fontSize: 11 },
    footer: { marginTop: 28, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E8EBEE', flexDirection: 'row', justifyContent: 'space-between' },
    signature: { textAlign: 'right', color: '#66717D' },
    signatureImage: { height: 28, width: 90, objectFit: 'contain', marginBottom: 3 },
    band: { backgroundColor: theme.ink, color: '#FFFFFF', marginHorizontal: -34, padding: '18px 34px', flexDirection: 'row', justifyContent: 'space-between' },
    callout: { marginTop: 18, padding: 14, borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.soft },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {theme.mode === 'band' ? (
          <View style={styles.band}><View style={styles.brand}>{biz.businessLogo ? <Image src={biz.businessLogo} style={styles.logo} /> : <Text style={styles.logoFallback}>G</Text>}<View><Text style={{ ...styles.bizName, color: '#FFFFFF' }}>{biz.businessName || biz.name || 'Your Business'}</Text><Text style={{ color: '#DCE5ED', marginTop: 3 }}>Tax invoice and payment record</Text></View></View><View><Text style={{ ...styles.title, color: '#FFFFFF' }}>{theme.title}</Text><Text style={{ color: '#DCE5ED', textAlign: 'right', marginTop: 4 }}>#{number}</Text></View></View>
        ) : (
          <View style={styles.top}><View style={styles.brand}>{biz.businessLogo ? <Image src={biz.businessLogo} style={styles.logo} /> : <Text style={styles.logoFallback}>G</Text>}<View><Text style={styles.bizName}>{biz.businessName || biz.name || 'Your Business'}</Text><Text style={styles.muted}>{biz.email || ''}</Text></View></View><View><Text style={styles.title}>{theme.title}</Text><Text style={styles.meta}>#{number}{'\n'}Issued {date(invoice.issueDate)}{'\n'}{isQuotation ? `Valid until ${date(invoice.validUntil)}` : `Due ${date(invoice.dueDate)}`}</Text></View></View>
        )}
        {isQuotation && <View style={styles.callout}><Text style={styles.sectionLabel}>Project proposal</Text><Text style={{ color: theme.ink, fontFamily: 'Helvetica-Bold' }}>Thank you for the opportunity to work together.</Text><Text style={styles.muted}>This quotation outlines the requested products and services, pricing, and terms.</Text></View>}
        <View style={styles.intro}><View><Text style={styles.sectionLabel}>{isQuotation ? 'Prepared for' : 'Bill to'}</Text><Text style={{ ...styles.address, fontFamily: 'Helvetica-Bold', color: theme.ink }}>{client.name || 'Client'}</Text><Text style={styles.address}>{client.email || ''}{client.phone ? `\n${client.phone}` : ''}{client.address ? `\n${client.address}` : ''}</Text></View><View><Text style={styles.sectionLabel}>Business details</Text><Text style={styles.address}>{biz.phone || ''}{biz.gstin ? `\nGSTIN: ${biz.gstin}` : ''}{biz.address?.city ? `\n${biz.address.city}, ${biz.address.state || ''}` : ''}</Text></View></View>
        <View style={styles.table}><View style={styles.head}><Text style={styles.desc}>Description</Text><Text style={styles.qty}>Qty</Text><Text style={styles.price}>Rate</Text><Text style={styles.tax}>Tax</Text><Text style={styles.total}>Amount</Text></View>{items.map((item, index) => <View key={index} style={[styles.row, index % 2 ? styles.alt : {}]}><View style={styles.desc}><Text style={styles.itemName}>{item.name || 'Item'}</Text><Text style={styles.itemSub}>{item.description || ''}{item.hsn ? ` | HSN ${item.hsn}` : ''}</Text></View><Text style={styles.qty}>{item.quantity || 0} {item.unit || ''}</Text><Text style={styles.price}>{money(item.price, currency)}</Text><Text style={styles.tax}>{Number(item.cgstRate || 0) + Number(item.sgstRate || 0) + Number(item.igstRate || 0) + Number(item.vatRate || 0)}%</Text><Text style={styles.total}>{money(item.total ?? (item.price || 0) * (item.quantity || 0), currency)}</Text></View>)}</View>
        <View style={styles.lower}><View style={styles.notes}><Text style={styles.sectionLabel}>{isQuotation ? 'Scope and terms' : 'Notes and payment details'}</Text><Text>{invoice.notes || 'Thank you for your business.'}</Text><Text style={{ marginTop: 8 }}>{invoice.termsAndConditions || ''}</Text>{biz.bankDetails?.bankName && <Text style={{ marginTop: 8 }}>Bank: {biz.bankDetails.bankName}{biz.bankDetails.accountNumber ? ` | A/C ${biz.bankDetails.accountNumber}` : ''}</Text>}</View><View style={styles.totals}><View style={styles.totalLine}><Text>Subtotal</Text><Text>{money(invoice.subtotal, currency)}</Text></View><View style={styles.totalLine}><Text>Discount</Text><Text>- {money(invoice.discountAmount, currency)}</Text></View><View style={styles.totalLine}><Text>Tax</Text><Text>{money(invoice.taxTotal, currency)}</Text></View><View style={styles.grand}><Text>{isQuotation ? 'Estimated total' : 'Amount due'}</Text><Text>{money(invoice.total, currency)}</Text></View></View></View>
        <View style={styles.footer}><Text style={styles.muted}>Goodsynk Invoices | {biz.email || 'invoice.goodsynk.com'}</Text><View style={styles.signature}>{biz.businessSignature && <Image src={biz.businessSignature} style={styles.signatureImage} />}<Text>Authorised signature</Text></View></View>
      </Page>
    </Document>
  );
}
