/**
 * WhatsApp message templates.
 * You can customize the text below to change the default message sent to clients.
 */

/**
 * Generates the WhatsApp message for a Quotation.
 * @param {Object} inv - The quotation/invoice object
 * @param {string} shareUrl - The public share URL for the document
 * @param {Function} fmtCurrency - Currency formatter function
 * @returns {string} The prefilled message text
 */
export const getQuotationMessage = (inv, shareUrl, fmtCurrency) => {
  const clientName = inv.client?.name || 'Customer';
  const docNumber = inv.invoiceNumber || '';
  const amount = fmtCurrency(inv.total, inv.currency);

  return `Hi ${clientName},\n\nHere is your quotation ${docNumber} for ${amount}.\n\nYou can view and download the PDF directly here:\n${shareUrl}`;
};

/**
 * Generates the WhatsApp message for an Invoice.
 * @param {Object} inv - The invoice object
 * @param {string} shareUrl - The public share URL for the document
 * @param {Function} fmtCurrency - Currency formatter function
 * @returns {string} The prefilled message text
 */
export const getInvoiceMessage = (inv, shareUrl, fmtCurrency) => {
  const clientName = inv.client?.name || 'Customer';
  const docNumber = inv.invoiceNumber || '';
  const amount = fmtCurrency(inv.total, inv.currency);

  return `Hi ${clientName},\n\nHere is your invoice ${docNumber} for ${amount}.\n\nYou can view and download the PDF directly here:\n${shareUrl}`;
};
