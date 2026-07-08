// Builds the branded HTML email body sent alongside the PDF attachment.
const APP_NAME = 'GoodSynk Invoices';

const buildDocumentEmailHTML = ({
    businessName,
    businessLogoUrl,
    docLabel,        // 'Invoice' | 'Quotation'
    docNumber,
    docDate,
    amount,
    currencySymbol = '₹',
    viewUrl,         // optional — omit the button if not provided
    replyToEmail,
    clientName,
    customMessage,
}) => {
    const greeting = clientName ? `Hi ${clientName},` : '';
    const formattedAmount = Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

    const viewButton = viewUrl ? `
    <tr>
      <td style="padding: 24px 0 8px;">
        <a href="${viewUrl}" style="display:inline-block;background:#4A72D4;color:#ffffff;text-decoration:none;
          font-weight:600;font-size:15px;padding:12px 28px;border-radius:8px;">
          View ${docLabel}
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding: 8px 0 0; font-size: 13px; color: #64748b;">
        If you're having trouble with the button above, use the URL below.<br/>
        <a href="${viewUrl}" style="color:#4A72D4; word-break: break-all;">${viewUrl}</a>
      </td>
    </tr>
  ` : '';

    return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#f4f5f7; padding: 32px 16px;">
    <table role="presentation" width="100%" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <tr>
        <td style="padding: 32px 32px 8px;">
          ${businessLogoUrl ? `<img src="${businessLogoUrl}" alt="${businessName}" style="max-height: 48px; margin-bottom: 12px;" />` : ''}
          <div style="font-size: 15px; font-weight: 700; color: #0f172a;">${businessName || 'Your Business'}</div>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 32px 0; font-size: 15px; color: #334155;">
          ${greeting}
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 32px 0; font-size: 15px; color: #334155;">
          Thank you for your business!
        </td>
      </tr>
      ${customMessage ? `
      <tr>
        <td style="padding: 12px 32px 0; font-size: 14px; color: #475569; white-space: pre-line;">
          ${customMessage}
        </td>
      </tr>` : ''}
      <tr>
        <td style="padding: 16px 32px 0; font-size: 13px; color: #64748b;">
          Please find the PDF attached to this email.
        </td>
      </tr>

      <tr>
        <td style="padding: 24px 32px 0;">
          <div style="font-size: 12px; font-weight: 600; letter-spacing: 0.05em; color: #94a3b8; text-transform: uppercase;">Amount</div>
          <div style="font-size: 30px; font-weight: 800; color: #0f172a; margin-top: 4px;">${currencySymbol}${formattedAmount}</div>
        </td>
      </tr>

      <tr>
        <td style="padding: 20px 32px 0;">
          <table role="presentation" width="100%">
            <tr>
              <td style="font-size: 13px; font-weight: 700; color: #0f172a; padding-bottom: 4px;">${docLabel} #:</td>
              <td style="font-size: 14px; color: #334155; text-align: right;">${docNumber}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; font-weight: 700; color: #0f172a;">${docLabel} Date:</td>
              <td style="font-size: 14px; color: #334155; text-align: right;">${docDate}</td>
            </tr>
          </table>
        </td>
      </tr>

      <tr><td style="padding: 0 32px;"><table role="presentation" width="100%">${viewButton}</table></td></tr>

      <tr>
        <td style="padding: 28px 32px 0; font-size: 13px; color: #64748b;">
          If you have any questions, kindly reply all to this email
          ${replyToEmail ? ` <a href="mailto:${replyToEmail}" style="color:#4A72D4;">${replyToEmail}</a>` : ''}
        </td>
      </tr>

      <tr>
        <td style="padding: 24px 32px 24px; border-top: 1px solid #e2e8f0; margin-top: 24px;">
          <div style="font-size: 12px; color: #94a3b8; padding-top: 16px;">
            © ${new Date().getFullYear()} ${businessName || 'Your Business'}. All rights reserved.
          </div>
          <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">
            Sent using <strong>${APP_NAME}</strong>
          </div>
        </td>
      </tr>
    </table>
  </div>
  `;
};

module.exports = { buildDocumentEmailHTML, APP_NAME };