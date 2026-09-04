import React from 'react';
import Template1 from './templates/Template1.jsx';
import Template2 from './templates/Template2.jsx';
import Template3 from './templates/Template3.jsx';
import Template4 from './templates/Template4.jsx';
import Template5 from './templates/Template5.jsx';
import Template6 from './templates/Template6.jsx';
import Template7 from './templates/Template7.jsx';
import Template8 from './templates/Template8.jsx';
import Template9 from './templates/Template9.jsx';
import Template10 from './templates/Template10.jsx';
import Template11 from './templates/Template11.jsx';

export default function InvoicePDF({ invoice }) {
  const templateName = String(invoice?.template || invoice?.user?.invoiceTemplate || 'template1').toLowerCase();

  switch (templateName) {
    case 'template11': return <Template11 invoice={invoice} />;
    case 'template10': return <Template10 invoice={invoice} />;
    case 'template9': return <Template9 invoice={invoice} />;
    case 'template8': return <Template8 invoice={invoice} />;
    case 'template7': return <Template7 invoice={invoice} />;
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