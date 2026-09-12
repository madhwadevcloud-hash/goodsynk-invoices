import React from 'react';
import Template1 from './Template1';
import Template2 from './Template2';
import Template5 from './Template5';
import Template6 from './Template6';
import Template7 from './Template7';
import Template10 from './Template10';
import Template16 from './Template16';
import Template17 from './Template17';
import Template18 from './Template18';
import Template19 from './Template19';
import Template20 from './Template20';
import DocumentTemplate from './DocumentTemplate';

import { getDocumentSettings } from '../../../utils/documentSettings';

// Central registry — active templates and safe fallbacks for removed templates.
const TEMPLATE_MAP = {
    template1: Template1,
    template2: Template2,
    template5: Template5,
    template6: Template6,
    template7: Template7,
    template10: Template10,
    template16: Template16,
    template17: Template17,
    template18: Template18,
    template19: Template19,
    template20: Template20,
    invoice12: (props) => <DocumentTemplate {...props} variant="invoice12" />,
    invoice14: (props) => <DocumentTemplate {...props} variant="invoice14" />,
    // Legacy fallbacks for removed templates so existing saved records don't break:
    template3: Template1,
    template4: Template1,
    template8: Template1,
    template9: Template1,
    template11: Template1,
    invoice13: Template1,
    invoice15: Template1,
    quotation12: (props) => <DocumentTemplate {...props} variant="invoice12" />,
    quotation13: Template1,
    quotation14: (props) => <DocumentTemplate {...props} variant="invoice14" />,
    quotation15: Template1,
};

export default function TemplateResolver({ invoice }) {
    const docSettings = getDocumentSettings();
    const isDiscColumnVisible = !docSettings.hideDiscount && docSettings.showDiscountColumn;

    let processedInvoice = {
        ...invoice,
        watermarkImage: invoice?.watermarkImage || docSettings.watermarkImage,
    };
    if (!isDiscColumnVisible) {
        processedInvoice = {
            ...processedInvoice,
            discountAmount: 0,
            itemDiscount: 0,
            overallDiscTotal: 0,
            hideDiscount: true,
            hideDiscountColumn: true,
            items: processedInvoice.items?.map((item) => ({ ...item, discount: 0 })),
        };
    }

    const key = (processedInvoice.template || processedInvoice._resolvedTemplate || 'template1').toLowerCase();
    const Chosen = TEMPLATE_MAP[key] || Template1; // safe fallback if a key is ever missing
    return <Chosen invoice={processedInvoice} />;
}