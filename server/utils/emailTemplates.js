const APP_NAME = 'Goodsynk Invoices';
const TAGLINE = 'Invoice Banega, Payment Badega.';

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SGD: 'S$' };

const buildDocumentEmailHTML = ({
  businessName,
  docLabel,
  docNumber,
  docDate,
  dueDateLabel,
  dueDateValue,
  amount,
  currencySymbol = '₹',
  viewUrl,
  replyToEmail,
  clientName,
}) => {
  const greeting = clientName ? `Hello ${clientName},` : 'Hello,';
  const formattedAmount = Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const amountLabel = docLabel === 'Invoice' ? 'Amount Due' : 'Amount';
  const thankYouIntro = docLabel === 'Invoice'
    ? 'Thank you for your business.'
    : `Thank you for choosing <strong>${businessName}</strong>.`;
  const closingLine = docLabel === 'Invoice'
    ? `Thank you for choosing <strong>${businessName}</strong>.`
    : 'Thank you for your business.';

  const viewButton = viewUrl ? `
    <tr>
      <td style="padding: 20px 0 4px;">
        <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">View ${docLabel}</div>
        <a href="${viewUrl}" style="display:inline-block;background:#4A72D4;color:#ffffff;text-decoration:none;
          font-weight:600;font-size:14px;padding:11px 26px;border-radius:8px;">
          View ${docLabel}
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding: 10px 0 4px; font-size: 13px; color: #64748b;">
        If you're having trouble with the button above, use the URL below.<br/>
        <a href="${viewUrl}" style="color:#4A72D4; word-break:break-all;">${viewUrl}</a>
      </td>
    </tr>
  ` : '';

  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#f4f5f7; padding: 32px 16px;">
    <table role="presentation" width="100%" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
      <tr><td style="padding: 28px 32px 0; font-size: 15px; color: #334155;">${greeting}</td></tr>
      <tr><td style="padding: 10px 32px 0; font-size: 14px; color: #475569;">${thankYouIntro}</td></tr>

      <tr>
        <td style="padding: 20px 32px 0;">
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">${docLabel} Details</div>
          <table role="presentation" width="100%" style="font-size: 13.5px; color: #334155;">
            <tr><td style="padding: 2px 0;">• ${docLabel} No: ${docNumber}</td></tr>
            <tr><td style="padding: 2px 0;">• ${docLabel} Date: ${docDate}</td></tr>
            <tr><td style="padding: 2px 0;">• ${dueDateLabel}: ${dueDateValue}</td></tr>
            <tr><td style="padding: 2px 0;">• ${amountLabel}: ${currencySymbol}${formattedAmount}</td></tr>
          </table>
        </td>
      </tr>

      <tr><td style="padding: 0 32px;"><table role="presentation" width="100%">${viewButton}</table></td></tr>

      <tr>
        <td style="padding: 20px 32px 0; font-size: 13px; color: #64748b;">
          A PDF copy of your ${docLabel.toLowerCase()} is attached to this email${docLabel === 'Quotation' ? ' for your convenience' : ''}.
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 32px 0; font-size: 13px; color: #64748b;">
          For any ${docLabel === 'Invoice' ? 'questions' : 'queries'} regarding this ${docLabel.toLowerCase()}, please contact
          ${replyToEmail ? `<a href="mailto:${replyToEmail}" style="color:#4A72D4;">${replyToEmail}</a>` : ''}.
        </td>
      </tr>
      <tr><td style="padding: 8px 32px 0; font-size: 13px; color: #64748b;">${closingLine}</td></tr>

      <tr>
        <td style="padding: 20px 32px 0; font-size: 13.5px; color: #334155;">
          Regards,<br/>${businessName || 'Your Business'}
        </td>
      </tr>

      <tr>
        <td style="padding: 20px 32px 0; font-size: 12px; color: #94a3b8;">
          Powered by <strong>${APP_NAME}</strong><br/>${TAGLINE}
        </td>
      </tr>

      <tr>
        <td style="padding: 20px 32px 24px; border-top: 1px solid #e2e8f0; margin-top: 16px;">
          <div style="font-size: 11.5px; color: #94a3b8; padding-top: 14px;">
            This is an automated email sent from noreply@goodsynk.com. Please do not reply to this email.
          </div>
          <div style="font-size: 11.5px; color: #94a3b8; margin-top: 4px;">
            For assistance, contact the sender at ${replyToEmail ? `<a href="mailto:${replyToEmail}" style="color:#94a3b8;">${replyToEmail}</a>` : ''}.
          </div>
          <div style="font-size: 11.5px; color: #94a3b8; margin-top: 8px;">
            © ${new Date().getFullYear()} Goodsynk. All rights reserved.
          </div>
        </td>
      </tr>
    </table>
  </div>
  `;
};

module.exports = { buildDocumentEmailHTML, APP_NAME, TAGLINE, CURRENCY_SYMBOLS };