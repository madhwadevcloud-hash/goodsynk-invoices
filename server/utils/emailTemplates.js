const APP_NAME = 'Goodsynk Billing';
const BRAND_LINE = 'Goodsynk Billing | Simple Invoicing, Billing & Quotations | Visit invoice.goodsynk.com';
const TRUST_LINE = 'Generated securely by Goodsynk Billing. This is a digitally signed document.';

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
  body,
}) => {
  if (body) {
    // Clean up the custom body if the user accidentally copy-pasted the automated footer/disclaimer/powered-by blocks
    let cleanBody = body;
    const stripMarkers = [
      '*** DISCLAIMER ***',
      'This is an automated email sent from',
      'Powered by Goodsynk',
      'Goodsynk Billing |',
      'Generated securely by Goodsynk'
    ];
    for (const marker of stripMarkers) {
      const idx = cleanBody.indexOf(marker);
      if (idx !== -1) {
        cleanBody = cleanBody.slice(0, idx);
      }
    }

    // If a custom body is provided from the frontend, it contains the main text content.
    // We replace the {{ViewInvoiceButton}} / {{ViewQuotationButton}} placeholder with the actual button HTML.
    const viewButtonHtml = viewUrl ? `
      <table role="presentation" width="100%" style="margin-top: 16px; margin-bottom: 16px;">
        <tr>
          <td style="padding: 10px 0 4px;">
            <a href="${viewUrl}" style="display:inline-block;background:#4A72D4;color:#ffffff;text-decoration:none;
              font-weight:600;font-size:14px;padding:11px 26px;border-radius:8px;">
              View ${docLabel}
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0 4px; font-size: 13px; color: #64748b; line-height: 1.4;">
            If you're having trouble with the button above, use the URL below.<br/>
            <a href="${viewUrl}" style="color:#4A72D4; word-break:break-all;">${viewUrl}</a>
          </td>
        </tr>
      </table>
    ` : '';

    let bodyHtml = cleanBody.replace(/\n/g, '<br/>');
    const placeholder = `{{View${docLabel}Button}}`;
    if (bodyHtml.includes(placeholder)) {
      bodyHtml = bodyHtml.replace(placeholder, viewButtonHtml);
    } else {
      // Robust insertion: find signature/footer tags in the message body
      const markers = [
        'A PDF copy of',
        'For any questions',
        'For any queries',
        'Thank you for choosing',
        'Regards'
      ];
      let insertIndex = -1;
      for (const marker of markers) {
        const idx = bodyHtml.indexOf(marker);
        if (idx !== -1 && (insertIndex === -1 || idx < insertIndex)) {
          insertIndex = idx;
        }
      }

      if (insertIndex !== -1) {
        // Insert the button before the signature/attachment text block, preserving layouts
        bodyHtml = bodyHtml.slice(0, insertIndex) + viewButtonHtml + '<br/>' + bodyHtml.slice(insertIndex);
      } else {
        bodyHtml = bodyHtml + '<br/>' + viewButtonHtml;
      }
    }

    return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#f4f5f7; padding: 32px 16px;">
      <table role="presentation" width="100%" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <tr>
          <td style="padding: 28px 32px 24px; font-size: 14.5px; color: #334155; line-height: 1.6;">
            ${bodyHtml}
          </td>
        </tr>

        <tr>
          <td style="padding: 20px 32px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
            ${BRAND_LINE}<br/>${TRUST_LINE}
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
            <div style="font-size: 11.5px; color: #94a3b8; margin-top: 4px;">
              © ${new Date().getFullYear()} Goodsynk. All rights reserved.
            </div>
          </td>
        </tr>
      </table>
    </div>
    `;
  }

  // Fallback for automated system emails without custom composer body
  const greetingRow = `<tr><td style="padding: 28px 32px 0; font-size: 15px; color: #334155; font-weight: 600;">Hello ${clientName || 'Customer'},</td></tr>`;
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
      ${greetingRow}
      <tr><td style="padding: 10px 32px 0; font-size: 14px; color: #475569; line-height: 1.5;">${thankYouIntro}</td></tr>

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
        <td style="padding: 20px 32px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
          ${BRAND_LINE}<br/>${TRUST_LINE}
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
          <div style="font-size: 11.5px; color: #94a3b8; margin-top: 4px;">
            © ${new Date().getFullYear()} Goodsynk. All rights reserved.
          </div>
        </td>
      </tr>
    </table>
  </div>
  `;
};

module.exports = { buildDocumentEmailHTML, APP_NAME, BRAND_LINE, TRUST_LINE, CURRENCY_SYMBOLS };