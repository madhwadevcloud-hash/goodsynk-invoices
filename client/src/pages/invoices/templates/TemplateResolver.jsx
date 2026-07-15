import React from 'react';
import Template1 from './Template1';
import Template2 from './Template2';
import Template3 from './Template3';
import Template4 from './Template4';
import Template5 from './Template5';
import Template6 from './Template6';
import Template7 from './Template7';

// Central registry — every selectable template must be listed here.
const TEMPLATE_MAP = {
    template1: Template1,
    template2: Template2,
    template3: Template3,
    template4: Template4,
    template5: Template5,
    template6: Template6,
    template7: Template7,
};

export default function TemplateResolver({ invoice }) {
    const key = (invoice.template || invoice._resolvedTemplate || 'template1').toLowerCase();
    const Chosen = TEMPLATE_MAP[key] || Template1; // safe fallback if a key is ever missing
    return <Chosen invoice={invoice} />;
}