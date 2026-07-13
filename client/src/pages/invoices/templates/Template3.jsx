import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf' });
Font.register({ family: 'Inter-SemiBold', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf' });
Font.register({ family: 'Inter-Bold', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf' });

const B = 'Inter-Bold';
const M = 'Inter-SemiBold';

export default function Template3({ invoice }) {
  const { client, user: biz } = invoice;
  const colors = invoice.templateColors || { primary: '#1B365D', secondary: '#F0F4F8' };
  const DARK_BLUE = colors.primary;
  const LIGHT_BLUE = colors.secondary;

  const s = StyleSheet.create({
    page: { paddingBottom: 60, fontFamily: 'Inter', color: '#000' },
    
    headerBlock: { backgroundColor: DARK_BLUE, paddingTop: 30, paddingBottom: 25, paddingHorizontal: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerLeft: { width: '65%' },
    headerRight: { width: '30%', alignItems: 'flex-end' },
    logoImage: { height: 45, maxWidth: 140, objectFit: 'contain', marginBottom: 8 },
    bizNameText: { color: '#FFF', fontFamily: B, fontSize: 13, textTransform: 'uppercase' },
    bizInfoText: { color: '#FFF', fontSize: 8.5, marginTop: 2, lineHeight: 1.4, opacity: 0.85 },
    invoiceTitle: { color: '#FFF', fontFamily: B, fontSize: 26, letterSpacing: 2, marginTop: 10 },

    separator: { width: '100%', height: 1, backgroundColor: '#EEE' },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingVertical: 15, marginBottom: 10 },
    detailsItem: { flex: 1 },
    detailsLabel: { fontSize: 7.5, fontFamily: B, color: '#666', textTransform: 'uppercase', marginBottom: 2 },
    detailsValue: { fontSize: 9.5, color: '#000' },

    metaGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, marginBottom: 20 },
    metaColumn: { width: '45%' },
    metaLabel: { fontSize: 8.5, color: '#444', marginBottom: 6, textTransform: 'uppercase', fontFamily: B, borderBottom: '0.5pt solid #DDD', paddingBottom: 3 },
    billToName: { fontSize: 11, fontFamily: B, color: DARK_BLUE, marginBottom: 2 },
    billToText: { fontSize: 9, color: '#444', lineHeight: 1.4 },

    tableWrap: { paddingHorizontal: 40 },
    tHead: { flexDirection: 'row', backgroundColor: DARK_BLUE, color: '#FFF', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 4 },
    th: { fontSize: 9.5, fontFamily: B },
    
    tRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 15, borderBottom: '1pt solid #EEE' },
    td: { fontSize: 9, color: '#000' },

    colNo: { flex: 0.4 },
    colDesc: { flex: 2.2 },
    colHsn: { flex: 0.8, textAlign: 'center' },
    colPrice: { flex: 1.1, textAlign: 'right' },
    colQty: { flex: 0.9, textAlign: 'center' },
    colDisc: { flex: 0.7, textAlign: 'center' },
    colTax: { flex: 0.8, textAlign: 'center' },
    colTotal: { flex: 1.2, textAlign: 'right' },

    bottomSection: { flexDirection: 'row', paddingHorizontal: 40, marginTop: 30 },
    leftBottom: { width: '60%', paddingRight: 40 },
    rightBottom: { width: '40%' },

    totalsBox: { backgroundColor: LIGHT_BLUE, padding: 15, borderRadius: 6 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    totalLabel: { fontSize: 9, color: '#222' },
    totalVal: { fontSize: 9.5, fontFamily: M, color: '#000' },
    
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1pt solid #DDD' },
    grandTotalLabel: { fontSize: 11, fontFamily: B, color: DARK_BLUE },
    grandTotalVal: { fontSize: 11, fontFamily: B, color: DARK_BLUE },

    paymentTitle: { fontSize: 10, fontFamily: B, color: DARK_BLUE, marginBottom: 6 },
    paymentText: { fontSize: 9, color: '#000', marginBottom: 3 },

    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTop: '0.5pt solid #EEE', paddingTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 30 },
    footerText: { fontSize: 8.5, color: '#666' },
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
        
        {/* Header Block */}
        <View style={s.headerBlock}>
          <View style={s.headerLeft}>
            {biz?.businessLogo && <Image style={s.logoImage} src={biz.businessLogo} />}
            <Text style={s.bizNameText}>{bizName}</Text>
            <Text style={s.bizInfoText}>
              {biz?.address?.street && `${biz.address.street}\n`}
              {biz?.address?.city && `${biz.address.city}, ${biz.address.state} ${biz.address.pincode || ''}\n`}
              {biz?.gstin && `GSTIN: ${biz.gstin}`}
            </Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.invoiceTitle}>{isQuotation ? 'QUOTATION' : 'INVOICE'}</Text>
          </View>
        </View>

        {/* Separator & Details */}
        <View style={s.separator} />
        <View style={s.detailsRow}>
           <View style={s.detailsItem}>
              <Text style={s.detailsLabel}>{isQuotation ? 'Quotation No' : 'Invoice No'}</Text>
              <Text style={s.detailsValue}>{invoice.invoiceNumber || invoice.quotationNumber}</Text>
           </View>
           <View style={s.detailsItem}>
              <Text style={s.detailsLabel}>Date of Issue</Text>
              <Text style={s.detailsValue}>{new Date(invoice.issueDate).toLocaleDateString()}</Text>
           </View>
           <View style={s.detailsItem}>
              <Text style={s.detailsLabel}>Due Date</Text>
              <Text style={s.detailsValue}>
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon Receipt'}
              </Text>
           </View>
        </View>

        {/* Client & Payment Info Grid */}
        <View style={s.metaGrid}>
          <View style={s.metaColumn}>
            <Text style={s.metaLabel}>Billed To</Text>
            <Text style={s.billToName}>{client?.name}</Text>
            <Text style={s.billToText}>
              {client?.address?.street && `${client.address.street}\n`}
              {client?.address?.city && (
                <Text>
                  {client.address.city}, {client.address.state} {client.address.pincode || ''}{'\n'}
                </Text>
              )}
              {client?.phone && `Phone: ${client.phone}`}
            </Text>
          </View>

          <View style={s.metaColumn}>
            <Text style={s.metaLabel}>Payment Details</Text>
            {(!isQuotation && biz?.bankDetails?.accountNumber) ? (
              <View>
                {biz.bankDetails.bankName && <Text style={s.billToText}>Bank: {biz.bankDetails.bankName}</Text>}
                <Text style={s.billToText}>A/C Name: {biz.bankDetails.accountName}</Text>
                <Text style={s.billToText}>A/C Number: {biz.bankDetails.accountNumber}</Text>
                {biz.bankDetails.ifscCode && <Text style={s.billToText}>IFSC: {biz.bankDetails.ifscCode}</Text>}
              </View>
            ) : (
              <Text style={s.billToText}>{invoice.paymentInfo || '—'}</Text>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={s.tableWrap}>
          <View style={s.tHead}>
            <Text style={[s.th, s.colNo]}>#</Text>
            <Text style={[s.th, s.colDesc, { paddingLeft: 10 }]}>Item Description</Text>
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

        {/* Bottom Section */}
        <View style={s.bottomSection}>
          <View style={s.leftBottom}>
            {invoice.notes && (
              <View style={{ marginBottom: 15 }}>
                <Text style={s.paymentTitle}>Notes</Text>
                <Text style={s.paymentText}>{invoice.notes}</Text>
              </View>
            )}
             {invoice.termsAndConditions && (
              <View style={{ marginTop: 15 }}>
                <Text style={s.paymentTitle}>Terms & Conditions</Text>
                <Text style={s.paymentText}>{invoice.termsAndConditions}</Text>
              </View>
            )}
          </View>
          
          <View style={s.rightBottom}>
            <View style={s.totalsBox}>
              <View style={s.totalRow}><Text style={s.totalLabel}>Subtotal</Text><Text style={s.totalVal}>{fmt(invoice.subtotal)}</Text></View>
              {invoice.discountAmount > 0 && <View style={s.totalRow}><Text style={s.totalLabel}>Discount</Text><Text style={s.totalVal}>-{fmt(invoice.discountAmount)}</Text></View>}
              {invoice.taxTotal > 0 && <View style={s.totalRow}><Text style={s.totalLabel}>Tax</Text><Text style={s.totalVal}>{fmt(invoice.taxTotal)}</Text></View>}
              <View style={s.grandTotalRow}>
                <Text style={s.grandTotalLabel}>Total</Text>
                <Text style={s.grandTotalVal}>{currency} {fmt(invoice.total)}</Text>
              </View>
            </View>

            {/* Signature — bottom-right */}
            <View style={{ marginTop: 24, alignItems: 'flex-end' }}>
              {biz?.businessSignature && (
                <Image src={biz.businessSignature} style={{ width: 160, height: 55, objectFit: 'contain', marginBottom: 4 }} />
              )}
              <View style={{ width: 120, borderTopWidth: 0.5, borderTopColor: '#888', borderTopStyle: 'solid', paddingTop: 4 }}>
                <Text style={{ fontSize: 8, color: '#555', textAlign: 'center' }}>Authorised Signature</Text>
              </View>
            </View>

          </View>
        </View>

        {/* Footer: contact details */}
        {(biz?.phone || biz?.email) && (
          <View style={s.footer} fixed>
            {biz?.phone && <Text style={s.footerText}>Phone: {biz.phone}</Text>}
            {biz?.email && <Text style={s.footerText}>Email: {biz.email}</Text>}
          </View>
        )}
      </Page>
    </Document>
  );
}
