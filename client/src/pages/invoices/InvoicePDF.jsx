import React from 'react';
import Template1 from './templates/Template1';
import Template2 from './templates/Template2';
import Template3 from './templates/Template3';
import Template4 from './templates/Template4';
import Template5 from './templates/Template5';
import Template6 from './templates/Template6';

export default function InvoicePDF({ invoice }) {
  const templateName = String(invoice?.template || invoice?.user?.invoiceTemplate || 'template1').toLowerCase();

  switch (templateName) {
    case 'template6': return <Template6 invoice={invoice} />;
    case 'template5': return <Template5 invoice={invoice} />;
    case 'template4': return <Template4 invoice={invoice} />;
    case 'template3': return <Template3 invoice={invoice} />;
    case 'template2': return <Template2 invoice={invoice} />;
    case 'template1':
    default:
      return <Template1 invoice={invoice} />;
  }
}
