import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const themes = {
  quotationGreen: { accent: '#1F7A5A', soft: '#E8F4EE', ink: '#17352B', title: 'QUOTATION' },
  quotationOrange: { accent: '#C65D2E', soft: '#FFF1E9', ink: '#3D2117', title: 'QUOTATION' },
  invoiceSlate: { accent: '#334155', soft: '#E2E8F0', ink: '#172033', title: 'INVOICE' },
  invoiceTeal: { accent: '#0F766E', soft: '#CCFBF1', ink: '#123C3A', title: 'INVOICE' },
};

export default function PremiumTemplate({ invoice, variant }) {
  const { client, user: biz } = invoice;
  const theme = themes[variant];
  const isQuotation = invoice.invoiceType === 'quotation';
  const currency = invoice._currency || invoice.currency || 'INR';
  const fmt = (value) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
  const date = (value) => value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Upon receipt';
  const styles = StyleSheet.create({
    page: { padding: 38, fontFamily: 'Helvetica', color: theme.ink, backgroundColor: '#FFFFFF' },
    topBand: { backgroundColor: theme.accent, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    topBandTitle: { color: '#FFFFFF', fontSize: 26, fontFamily: 'Helvetica-Bold', letterSpacing: 2 },
    topBandMeta: { color: '#FFFFFF', fontSize: 8, textAlign: 'right', lineHeight: 1.5 },
    logo: { width: 92, height: 42, objectFit: 'contain', marginBottom: 6 },
    business: { paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between' },
    businessName: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: theme.ink, marginBottom: 5 },
    small: { fontSize: 8, color: '#52615D', lineHeight: 1.45 },
    address: { textAlign: 'right', maxWidth: 220 },
    infoGrid: { flexDirection: 'row', borderTop: `1pt solid ${theme.soft}`, borderBottom: `1pt solid ${theme.soft}`, paddingVertical: 14, marginBottom: 18 },
    infoBlock: { flex: 1, paddingHorizontal: 10, borderRight: `0.5pt solid ${theme.soft}` },
    infoLast: { borderRight: 0 },
    label: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: theme.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
    clientName: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
    table: { border: `1pt solid ${theme.soft}` },
    head: { flexDirection: 'row', backgroundColor: theme.accent, paddingVertical: 8, paddingHorizontal: 8 },
    row: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 8, borderBottom: `0.5pt solid ${theme.soft}` },
    cell: { fontSize: 8, color: theme.ink },
    headCell: { fontSize: 7, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
    number: { width: '7%' }, desc: { width: '45%' }, qty: { width: '13%', textAlign: 'center' }, price: { width: '17%', textAlign: 'right' }, total: { width: '18%', textAlign: 'right' },
    lower: { flexDirection: 'row', marginTop: 18, justifyContent: 'space-between' }, notes: { width: '53%', paddingRight: 22 }, totals: { width: '40%', backgroundColor: theme.soft, padding: 12 },
    totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }, grand: { borderTop: `1pt solid ${theme.accent}`, marginTop: 5, paddingTop: 7, fontFamily: 'Helvetica-Bold', fontSize: 12 },
    footer: { position: 'absolute', bottom: 25, left: 38, right: 38, borderTop: `2pt solid ${theme.accent}`, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' }, signature: { textAlign: 'right', width: 170 },
  });
  return (
    <Document><Page size="A4" style={styles.page}>
      <View style={styles.topBand}><Text style={styles.topBandTitle}>{theme.title}</Text><View><Text style={styles.topBandMeta}>{isQuotation ? 'Prepared for your approval' : 'Payment document'}</Text><Text style={styles.topBandMeta}>{invoice.invoiceNumber || invoice.quotationNumber || 'Draft'}</Text></View></View>
      <View style={styles.business}><View>{biz?.businessLogo && <Image src={biz.businessLogo} style={styles.logo} />}<Text style={styles.businessName}>{biz?.businessName || biz?.name || ''}</Text>{biz?.gstin && <Text style={styles.small}>GSTIN: {biz.gstin}</Text>}</View><View style={styles.address}>{biz?.address?.street && <Text style={styles.small}>{biz.address.street}</Text>}{biz?.address?.city && <Text style={styles.small}>{biz.address.city}, {biz.address.state} {biz.address.pincode}</Text>}{biz?.phone && <Text style={styles.small}>{biz.phone}</Text>}</View></View>
      <View style={styles.infoGrid}><View style={styles.infoBlock}><Text style={styles.label}>Prepared For</Text><Text style={styles.clientName}>{client?.name || 'Client'}</Text>{client?.companyName && <Text style={styles.small}>{client.companyName}</Text>}{client?.email && <Text style={styles.small}>{client.email}</Text>}{client?.phone && <Text style={styles.small}>{client.phone}</Text>}</View><View style={styles.infoBlock}><Text style={styles.label}>Document Date</Text><Text style={styles.small}>{date(invoice.issueDate)}</Text><Text style={[styles.label, { marginTop: 9 }]}>{isQuotation ? 'Valid Until' : 'Due Date'}</Text><Text style={styles.small}>{date(invoice.dueDate)}</Text></View><View style={[styles.infoBlock, styles.infoLast]}><Text style={styles.label}>Reference</Text><Text style={styles.small}>{isQuotation ? 'Quotation' : 'Invoice'} #{invoice.invoiceNumber || invoice.quotationNumber || 'Draft'}</Text><Text style={[styles.label, { marginTop: 9 }]}>Currency</Text><Text style={styles.small}>{currency}</Text></View></View>
      <View style={styles.table}><View style={styles.head}><Text style={[styles.headCell, styles.number]}>#</Text><Text style={[styles.headCell, styles.desc]}>Description</Text><Text style={[styles.headCell, styles.qty]}>Qty</Text><Text style={[styles.headCell, styles.price]}>Unit Price</Text><Text style={[styles.headCell, styles.total]}>Amount</Text></View>{(invoice.items || []).map((item, index) => <View style={styles.row} key={index}><Text style={[styles.cell, styles.number]}>{index + 1}</Text><View style={styles.desc}><Text style={[styles.cell, { fontFamily: 'Helvetica-Bold' }]}>{item.name || 'Item'}</Text>{item.description && <Text style={[styles.small, { marginTop: 2 }]}>{item.description}</Text>}</View><Text style={[styles.cell, styles.qty]}>{item.itemType === 'Service' ? '-' : item.quantity}</Text><Text style={[styles.cell, styles.price]}>{fmt(item.price)}</Text><Text style={[styles.cell, styles.total]}>{fmt(item.total)}</Text></View>)}</View>
      <View style={styles.lower}><View style={styles.notes}><Text style={styles.label}>Notes &amp; Terms</Text><Text style={styles.small}>{invoice.notes || 'Thank you for your business.'}</Text>{invoice.termsAndConditions && <Text style={[styles.small, { marginTop: 8 }]}>{invoice.termsAndConditions}</Text>}{isQuotation && invoice.paymentInfo && <><Text style={[styles.label, { marginTop: 12 }]}>Payment Details</Text><Text style={styles.small}>{invoice.paymentInfo}</Text></>}</View><View style={styles.totals}><View style={styles.totalLine}><Text style={styles.small}>Subtotal</Text><Text style={styles.small}>{currency} {fmt(invoice.subtotal)}</Text></View>{invoice.discountAmount > 0 && <View style={styles.totalLine}><Text style={styles.small}>Discount</Text><Text style={styles.small}>- {fmt(invoice.discountAmount)}</Text></View>}{invoice.taxTotal > 0 && <View style={styles.totalLine}><Text style={styles.small}>Tax</Text><Text style={styles.small}>{fmt(invoice.taxTotal)}</Text></View>}<View style={[styles.totalLine, styles.grand]}><Text>Total</Text><Text>{currency} {fmt(invoice.total)}</Text></View></View></View>
      <View style={styles.footer} fixed><Text style={styles.small}>Generated with Goodsynk Invoices</Text><View style={styles.signature}>{biz?.businessSignature && <Image src={biz.businessSignature} style={{ height: 28, objectFit: 'contain' }} />}<Text style={styles.small}>Authorised signature</Text></View></View>
    </Page></Document>
  );
}