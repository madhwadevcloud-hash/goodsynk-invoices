import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register fonts
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

function numberToWords(num) {
  if (!num) return 'Zero';
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  const n = String(num).split('.');
  let numStr = n[0];
  if (numStr.length > 9) return num; // too big
  let words = '';
  
  if (numStr.length === 0) return 'Zero';
  
  const getGroup = (nStr) => {
    let w = '';
    const num = parseInt(nStr, 10);
    if (num > 99) {
      w += a[Math.floor(num/100)] + 'Hundred ';
    }
    const rem = num % 100;
    if (rem > 0) {
      if (rem < 20) w += a[rem];
      else {
        w += b[Math.floor(rem/10)] + ' ';
        if (rem%10 > 0) w += a[rem%10];
      }
    }
    return w;
  };

  let crores = 0, lakhs = 0, thousands = 0, rest = 0;
  if (numStr.length > 7) {
    crores = parseInt(numStr.substring(0, numStr.length - 7), 10);
    numStr = numStr.substring(numStr.length - 7);
  }
  if (numStr.length > 5) {
    lakhs = parseInt(numStr.substring(0, numStr.length - 5), 10);
    numStr = numStr.substring(numStr.length - 5);
  }
  if (numStr.length > 3) {
    thousands = parseInt(numStr.substring(0, numStr.length - 3), 10);
    numStr = numStr.substring(numStr.length - 3);
  }
  rest = parseInt(numStr, 10);

  if (crores) words += getGroup(String(crores)) + 'Crore ';
  if (lakhs) words += getGroup(String(lakhs)) + 'Lakh ';
  if (thousands) words += getGroup(String(thousands)) + 'Thousand ';
  if (rest) words += getGroup(String(rest));

  return words.trim();
}

export default function Template7({ invoice }) {
  const { client, user: biz } = invoice;
  const colors = invoice.templateColors || { primary: '#B565D8' };
  const PRIMARY = colors.primary;

  const s = StyleSheet.create({
    page: { paddingTop: 40, paddingBottom: 120, fontFamily: 'Inter', color: '#000' },
    container: { paddingHorizontal: 40 },
    
    // Header
    topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 40, marginBottom: 0 },
    docTitle: { fontFamily: B, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: PRIMARY, marginBottom: 6 },
    bizName: { fontFamily: B, fontSize: 13, color: '#000', textTransform: 'uppercase', marginBottom: 2 },
    bizText: { fontSize: 7, color: '#444', marginBottom: 1, lineHeight: 1.3 },
    boldText: { fontFamily: B, color: '#000' },
    originalText: { fontSize: 6.5, color: '#666', textTransform: 'uppercase', textAlign: 'right', marginBottom: 10, fontFamily: B },
    topLogo: { height: 35, maxWidth: 140, objectFit: 'contain', alignSelf: 'flex-end' },
    // Meta & Info Columns
    gridRow: { flexDirection: 'row', paddingHorizontal: 40, marginBottom: 10 },
    col1: { width: '38%' },
    col2: { width: '40%' },
    col3: { width: '22%', alignItems: 'flex-end' },
    
    metaLabel: { fontSize: 7.5, color: '#444' },
    metaValue: { fontSize: 7.5, color: '#000', fontFamily: B },

    infoTitle: { fontSize: 7.5, color: '#444', marginBottom: 4 },
    infoName: { fontFamily: B, fontSize: 8, color: '#000', marginBottom: 1.5 },
    infoText: { fontSize: 7.5, color: '#000', marginBottom: 1.5 },

    // Table
    table: { width: '100%', paddingHorizontal: 40, marginBottom: 8 },
    tHeadRow: { flexDirection: 'row', borderBottom: `1pt solid ${PRIMARY}`, borderTop: `1pt solid ${PRIMARY}`, paddingVertical: 4 },
    tRow: { flexDirection: 'row', paddingVertical: 6, borderBottom: '1pt solid #E5E5E5' },
    th: { fontSize: 7, fontFamily: B, color: '#000', paddingHorizontal: 2 },
    td: { fontSize: 7.5, color: '#000', paddingHorizontal: 2 },
    
    colNo: { width: '5%', textAlign: 'left' },
    colDesc: { width: '38%' },
    colRate: { width: '12%', textAlign: 'right' },
    colQty: { width: '10%', textAlign: 'center' },
    colTaxable: { width: '12%', textAlign: 'right' },
    colTaxAmt: { width: '13%', textAlign: 'right' },
    colTotal: { width: '10%', textAlign: 'right' },

    // Totals Box
    totalsWrapper: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 40, marginBottom: 6 },
    totalsBox: { width: '50%' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1.5 },
    totalLabel: { fontSize: 7.5, fontFamily: B, color: '#000', textAlign: 'right', flex: 1, paddingRight: 10 },
    totalVal: { fontSize: 7.5, fontFamily: B, color: '#000', width: 70, textAlign: 'right' },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, marginTop: 4 },
    grandTotalLabel: { fontSize: 11, fontFamily: B, color: '#000', textAlign: 'right', flex: 1, paddingRight: 10 },
    grandTotalVal: { fontSize: 11, fontFamily: B, color: '#000', width: 70, textAlign: 'right' },

    // Items and Words
    wordsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTop: `1pt solid ${PRIMARY}`, borderBottom: `1pt solid ${PRIMARY}`, marginHorizontal: 40, paddingVertical: 3, marginBottom: 15 },
    wordsText: { fontSize: 6.5, color: '#666' },

    // Bank & Signature
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40 },
    bankCol: { width: '50%' },
    sigCol: { width: '40%', alignItems: 'flex-end' },
    bankLabel: { fontSize: 7.5, fontFamily: B, color: '#000', marginBottom: 4 },
    bankRow: { flexDirection: 'row', marginBottom: 1.5 },
    bankKey: { fontSize: 7, color: '#444', width: 60 },
    bankVal: { fontSize: 7, fontFamily: B, color: '#000' },
    
    sigText: { fontSize: 7, color: '#444', marginBottom: 25 },
    sigLine: { fontSize: 7, color: '#444', paddingTop: 4, width: 100, textAlign: 'center' },

    // Footer
    footerBox: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: 54, backgroundColor: PRIMARY, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingVertical: 8 },
    footerText: { fontSize: 8.5, color: '#FFF' },
    footerDivider: { width: 36, height: 1, backgroundColor: hexToRgba('#FFF', 0.3), marginBottom: 5 },
    footerBrandLine: { fontSize: 7.5, fontFamily: B, color: '#F2C94C', letterSpacing: 0.4, textAlign: 'center' },
    footerLink: { fontSize: 7.5, fontFamily: B, color: '#F2C94C', letterSpacing: 0.4 },
    footerTagline: { fontSize: 6.5, color: '#FFF', opacity: 0.9, textAlign: 'center', marginTop: 3 },
    footerTrustLine: { fontSize: 6, color: '#FFF', opacity: 0.6, marginTop: 3, textAlign: 'center' },
    poweredByContainer: { alignItems: 'center', marginTop: 6 },
    poweredByLabel: { fontSize: 6, color: hexToRgba('#FFF', 0.65), letterSpacing: 0.5 },
    poweredByValue: { fontSize: 9.5, fontFamily: B, color: '#FFF', letterSpacing: 0.5, marginTop: 1 },
  });

  const currency = invoice._currency || invoice.currency || 'INR';
  const fmt = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

  const bizName = biz?.businessName || biz?.name || '';
  const isQuotation = invoice.invoiceType === 'quotation';
  const docTitle = isQuotation ? 'QUOTATION' : 'INVOICE';

  const totalItems = invoice.items?.length || 0;
  const totalQty = invoice.items?.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0) || 0;
  const totalInWords = numberToWords(Math.floor(invoice.total || 0));

  // Determine overall tax percentages if consistent, otherwise show generic
  const cgstRateDisplay = invoice.items?.find(i => i.cgstRate > 0)?.cgstRate || 0;
  const sgstRateDisplay = invoice.items?.find(i => i.sgstRate > 0)?.sgstRate || 0;
  const igstRateDisplay = invoice.items?.find(i => i.igstRate > 0)?.igstRate || 0;
  const vatRateDisplay = invoice.items?.find(i => i.vatRate > 0)?.vatRate || 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.topSection}>
          <View style={{ width: '60%' }}>
            <Text style={s.docTitle}>{docTitle}</Text>
            <Text style={s.bizName}>{bizName}</Text>
            {biz?.gstin && <Text style={s.bizText}>GSTIN <Text style={s.boldText}>{biz.gstin}</Text></Text>}
            {biz?.address?.street && <Text style={s.bizText}>{biz.address.street}</Text>}
            {biz?.address?.city && (
              <Text style={s.bizText}>
                {biz.address.city}, {biz.address.state}, {biz.address.pincode}
              </Text>
            )}
            {(biz?.phone || biz?.email) && (
              <Text style={s.bizText}>
                {biz?.phone && <Text><Text style={s.boldText}>Mobile</Text> {biz.phone}   </Text>}
                {biz?.email && <Text><Text style={s.boldText}>Email</Text> {biz.email}</Text>}
              </Text>
            )}
            {biz?.website && <Text style={s.bizText}><Text style={s.boldText}>Website</Text> {biz.website}</Text>}
          </View>
          <View style={{ width: '40%', alignItems: 'flex-end' }}>
            {biz?.businessLogo && <Image style={s.topLogo} src={biz.businessLogo} />}
          </View>
        </View>

        <View style={[s.gridRow, { marginTop: 15 }]}>
          <View style={s.col1}>
            <Text style={s.metaLabel}>{isQuotation ? 'Quotation #' : 'Invoice #'}: <Text style={s.metaValue}>{invoice.invoiceNumber || invoice.quotationNumber}</Text></Text>
          </View>
          <View style={s.col2}>
            <Text style={s.metaLabel}>{isQuotation ? 'Quotation Date' : 'Invoice Date'}: <Text style={s.metaValue}>{new Date(invoice.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text></Text>
          </View>
          <View style={s.col3}>
            {invoice.dueDate && (
              <Text style={s.metaLabel}>{isQuotation ? 'Validity' : 'Due Date'}: <Text style={s.metaValue}>{new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text></Text>
            )}
          </View>
        </View>

        <View style={[s.gridRow, { marginBottom: 15 }]}>
          <View style={s.col1}>
            <Text style={s.infoTitle}>Customer Details:</Text>
            <Text style={s.infoName}>{client?.name}</Text>
            {client?.companyName && <Text style={s.infoName}>{client.companyName}</Text>}
            {client?.phone && <Text style={s.infoText}>Ph: {client.phone}</Text>}
            {client?.email && <Text style={s.infoText}>{client.email}</Text>}
            {client?.address?.state && (
              <View style={{ marginTop: 6 }}>
                <Text style={s.infoTitle}>Place of Supply:</Text>
                <Text style={s.infoName}>{client.address.state}</Text>
              </View>
            )}
          </View>
          <View style={s.col2}>
            <Text style={s.infoTitle}>Billing Address:</Text>
            {client?.address?.street && <Text style={s.infoText}>{client.address.street}</Text>}
            {client?.address?.city && <Text style={s.infoText}>{client.address.city}, {client.address.state}</Text>}
            {client?.address?.pincode && <Text style={s.infoText}>{client.address.pincode}</Text>}
          </View>
          <View style={s.col3}></View>
        </View>

        {/* Table */}
        <View style={s.table}>
          <View style={s.tHeadRow}>
            <Text style={[s.th, s.colNo]}>#</Text>
            <Text style={[s.th, s.colDesc]}>Item</Text>
            <Text style={[s.th, s.colRate]}>Rate / Item</Text>
            <Text style={[s.th, s.colQty]}>Qty</Text>
            <Text style={[s.th, s.colTaxable]}>Taxable Value</Text>
            <Text style={[s.th, s.colTaxAmt]}>Tax Amount</Text>
            <Text style={[s.th, s.colTotal]}>Amount</Text>
          </View>

          {invoice.items?.map((item, i) => {
            const taxAmt = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0) + (item.vatAmount || 0);
            const taxable = (item.price * item.quantity) - (item.discountAmount || 0);
            const totalItemTaxRate = (item.cgstRate || 0) + (item.sgstRate || 0) + (item.igstRate || 0) + (item.vatRate || 0);
            const taxRateStr = totalItemTaxRate > 0 ? ` (${totalItemTaxRate}%)` : '';
            return (
              <View key={i} style={s.tRow}>
                <Text style={[s.td, s.colNo]}>{i + 1}</Text>
                <Text style={[s.td, s.colDesc, { fontFamily: B }]}>{item.name}</Text>
                <Text style={[s.td, s.colRate]}>{fmt(item.price)}</Text>
                <Text style={[s.td, s.colQty]}>{item.quantity}</Text>
                <Text style={[s.td, s.colTaxable]}>{fmt(taxable)}</Text>
                <Text style={[s.td, s.colTaxAmt]}>{fmt(taxAmt)}{taxRateStr}</Text>
                <Text style={[s.td, s.colTotal]}>{fmt(item.total)}</Text>
              </View>
            );
          })}
        </View>

        {/* Totals Box */}
        <View style={s.totalsWrapper}>
          <View style={s.totalsBox}>
            <View style={s.totalRow}><Text style={s.totalLabel}>Taxable Amount</Text><Text style={s.totalVal}>₹{fmt(invoice.subtotal - (invoice.discountAmount || 0))}</Text></View>
            {invoice.cgstTotal > 0 && <View style={s.totalRow}><Text style={s.totalLabel}>CGST {cgstRateDisplay ? `${cgstRateDisplay}%` : ''}</Text><Text style={s.totalVal}>₹{fmt(invoice.cgstTotal)}</Text></View>}
            {invoice.sgstTotal > 0 && <View style={s.totalRow}><Text style={s.totalLabel}>SGST {sgstRateDisplay ? `${sgstRateDisplay}%` : ''}</Text><Text style={s.totalVal}>₹{fmt(invoice.sgstTotal)}</Text></View>}
            {invoice.igstTotal > 0 && <View style={s.totalRow}><Text style={s.totalLabel}>IGST {igstRateDisplay ? `${igstRateDisplay}%` : ''}</Text><Text style={s.totalVal}>₹{fmt(invoice.igstTotal)}</Text></View>}
            {invoice.vatTotal > 0 && <View style={s.totalRow}><Text style={s.totalLabel}>VAT {vatRateDisplay ? `${vatRateDisplay}%` : ''}</Text><Text style={s.totalVal}>₹{fmt(invoice.vatTotal)}</Text></View>}
            <View style={s.grandTotalRow}>
              <Text style={s.grandTotalLabel}>Total</Text>
              <Text style={s.grandTotalVal}>₹{fmt(invoice.total)}</Text>
            </View>
          </View>
        </View>

        <View style={s.wordsRow}>
          <Text style={s.wordsText}>Total items / Qty : {totalItems} / {totalQty}</Text>
          <Text style={s.wordsText}>Total amount (in words): INR {totalInWords} Rupees Only.</Text>
        </View>

        <View style={s.bottomRow}>
          <View style={s.bankCol}>
            {(isQuotation && biz?.bankDetails?.accountNumber) && (
              <>
                <Text style={s.bankLabel}>Bank Details:</Text>
                {biz.bankDetails.bankName && (
                  <View style={s.bankRow}><Text style={s.bankKey}>Bank:</Text><Text style={s.bankVal}>{biz.bankDetails.bankName}</Text></View>
                )}
                <View style={s.bankRow}><Text style={s.bankKey}>Account #:</Text><Text style={s.bankVal}>{biz.bankDetails.accountNumber}</Text></View>
                {biz.bankDetails.ifscCode && (
                  <View style={s.bankRow}><Text style={s.bankKey}>IFSC Code:</Text><Text style={s.bankVal}>{biz.bankDetails.ifscCode}</Text></View>
                )}
                {biz.bankDetails.branch && (
                  <View style={s.bankRow}><Text style={s.bankKey}>Branch:</Text><Text style={s.bankVal}>{biz.bankDetails.branch}</Text></View>
                )}
              </>
            )}
          </View>
          <View style={s.sigCol}>
            <Text style={s.sigText}>For {bizName}</Text>
            {biz?.businessSignature && (
              <Image src={biz.businessSignature} style={{ width: 100, height: 40, objectFit: 'contain', marginBottom: 4 }} />
            )}
            <Text style={s.sigLine}>Authorized Signatory</Text>
          </View>
        </View>

        <View style={s.footerBox} fixed>
          {(biz?.phone || biz?.email) && (
            <View style={{ flexDirection: 'row', gap: 30, marginBottom: 3 }}>
              {biz?.phone && <Text style={s.footerText}>Phone: {biz.phone}</Text>}
              {biz?.email && <Text style={s.footerText}>Email: {biz.email}</Text>}
            </View>
          )}
          <View style={s.footerDivider} />
          <Text style={s.footerBrandLine}>
            Goodsynk Billing  |  Simple Invoicing, Billing & Quotations  |  Visit{' '}
            <Text style={s.footerLink} src="https://invoice.goodsynk.com">invoice.goodsynk.com</Text>
          </Text>
          <View style={s.poweredByContainer}>
            <Text style={s.poweredByLabel}>Powered By</Text>
            <Text style={s.poweredByValue}>GoodSynk</Text>
          </View>
          <Text style={s.footerTagline}>Invoice Banega, Payment Badega.</Text>
          <Text style={s.footerTrustLine}>
            Generated securely by Goodsynk Billing. This is a digitally signed document.
          </Text>
        </View>

      </Page>
    </Document>
  );
}
