import React from 'react';
import Template1 from './Template1';
import Template2 from './Template2';
import Template3 from './Template3';
import Template4 from './Template4';
import Template5 from './Template5';
import Template6 from './Template6';
import Template7 from './Template7';
import Template8 from './Template8';
import Template9 from './Template9';
import Template10 from './Template10';
import Template11 from './Template11';
import Template16 from './Template16';
import Template17 from './Template17';
import Template18 from './Template18';
import Template19 from './Template19';
import Template20 from './Template20';
import Restro from './Restro';
import DocumentTemplate from './DocumentTemplate';

import { getDocumentSettings } from '../../../utils/documentSettings';
import { withReverseChargeNote } from './reverseChargeNote';

// Central registry — active templates and safe fallbacks for removed templates.
const TEMPLATE_MAP = {
    template1: Template1,
    template2: Template2,
    template3: Template3,
    template4: Template4,
    template5: Template5,
    template6: Template6,
    template7: Template7,
    template8: Template8,
    template9: Template9,
    template10: Template10,
    template11: Template11,
    template16: Template16,
    template17: Template17,
    template18: Template18,
    template19: Template19,
    template20: Template20,

    // Restaurant template
    restro: Restro,

    invoice12: (props) => <DocumentTemplate {...props} variant="invoice12" />,
    invoice13: (props) => <DocumentTemplate {...props} variant="invoice13" />,
    invoice14: (props) => <DocumentTemplate {...props} variant="invoice14" />,

    // Legacy fallbacks for removed templates so existing saved records don't break:
    invoice15: Template1,
    quotation12: (props) => <DocumentTemplate {...props} variant="invoice12" />,
    quotation13: Template1,
    quotation14: (props) => <DocumentTemplate {...props} variant="invoice14" />,
    quotation15: Template1,
};

export default function TemplateResolver({ invoice }) {
    const docSettings = getDocumentSettings();
    const isDiscColumnVisible =
        !docSettings.hideDiscount && docSettings.showDiscountColumn;

    let processedInvoice = {
        ...invoice,
        watermarkImage: invoice?.watermarkImage || docSettings.watermarkImage,
    };

    // Auto-inject the mandatory GST reverse-charge note into the notes field
    // for every template when reverseCharge is enabled on the invoice.
    processedInvoice = withReverseChargeNote(processedInvoice);

    if (!isDiscColumnVisible) {
        processedInvoice = {
            ...processedInvoice,
            discountAmount: 0,
            itemDiscount: 0,
            overallDiscTotal: 0,
            hideDiscount: true,
            hideDiscountColumn: true,
            items: processedInvoice.items?.map((item) => ({
                ...item,
                discount: 0,
            })),
        };
    }

    const key = (
        processedInvoice.template ||
        processedInvoice._resolvedTemplate ||
        'template1'
    ).toLowerCase();

    const Chosen = TEMPLATE_MAP[key] || Template1;

    return <Chosen invoice={processedInvoice} />;
}
