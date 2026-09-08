const fs = require('fs');
const path = require('path');

const templatesJsxFile = path.join(__dirname, 'src', 'pages', 'settings', 'Templates.jsx');

let content = fs.readFileSync(templatesJsxFile, 'utf8');

if (!content.includes('import { PDFViewer }')) {
    content = content.replace(
        "import { Palette, CheckCircle2, X, Lock } from 'lucide-react';",
        "import { Palette, CheckCircle2, X, Lock } from 'lucide-react';\nimport { PDFViewer } from '@react-pdf/renderer';\nimport TemplateResolver from '../invoices/templates/TemplateResolver';"
    );
}

const dummyInvoiceLogic = `
  const dummyInvoiceForPreview = previewTemplate ? {
    invoiceType: documentType,
    invoiceNumber: documentType === 'quotation' ? 'QT-001' : 'INV-001',
    issueDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    client: { name: 'Acme Corp', address: { street: '123 Main St', city: 'Metropolis', state: 'NY', pincode: '10001' } },
    items: [
      { name: 'Web Design', quantity: 1, price: 500, description: 'Homepage redesign' },
      { name: 'Hosting', quantity: 1, price: 100, description: '1 year' }
    ],
    subtotal: 600,
    total: 600,
    user: user,
    template: previewTemplate.id,
    templateColors: templateColors || DEFAULT_COLORS[previewTemplate.id],
    _currency: user?.currency || 'INR',
    _taxType: 'none'
  } : null;
`;

if (!content.includes('dummyInvoiceForPreview')) {
    content = content.replace('const [previewTemplate, setPreviewTemplate] = useState(null);', `const [previewTemplate, setPreviewTemplate] = useState(null);\n${dummyInvoiceLogic}`);
}

const oldImgTag = `<img src={documentType === 'quotation' ? (QUOTATION_PREVIEWS[previewTemplate.id] || previewTemplate.img) : previewTemplate.img} alt={previewTemplate.name} style={{ height: 'auto', width: '100%', objectFit: 'contain', boxShadow: 'var(--shadow-lg)', borderRadius: '8px', display: 'block' }} />`;
const newViewerTag = `
                  <div style={{ height: '700px', width: '100%', overflow: 'hidden', borderRadius: '8px', boxShadow: 'var(--shadow-lg)' }}>
                    <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
                      <TemplateResolver invoice={dummyInvoiceForPreview} />
                    </PDFViewer>
                  </div>
`;

if (content.includes(oldImgTag)) {
    content = content.replace(oldImgTag, newViewerTag);
}

fs.writeFileSync(templatesJsxFile, content, 'utf8');
console.log('Templates.jsx updated successfully.');
