const fs = require('fs');
const path = require('path');

const templatesJsxFile = path.join(__dirname, 'src', 'pages', 'settings', 'Templates.jsx');
let content = fs.readFileSync(templatesJsxFile, 'utf8');

// Fix 1: Locking logic in Templates.jsx
content = content.replace(
    /if \(!FREE_TEMPLATES\.includes\(templateId\)\) \{/,
    "const isFreePlan = !user?.plan || user.plan === 'free';\n    if (!FREE_TEMPLATES.includes(templateId) && isFreePlan) {"
);

content = content.replace(
    /const isLocked = !FREE_TEMPLATES\.includes\(tmpl\.id\);/g,
    "const isFreePlan = !user?.plan || user.plan === 'free';\n          const isLocked = !FREE_TEMPLATES.includes(tmpl.id) && isFreePlan;"
);

// Fix 2: Add dynamic logo overlay over the img tag in Templates.jsx preview modal
// The user wants the old layout (img) but with the dynamic logo.
const oldPreviewModal = `<img src={documentType === 'quotation' ? (QUOTATION_PREVIEWS[previewTemplate.id] || previewTemplate.img) : previewTemplate.img} alt={previewTemplate.name} style={{ height: 'auto', width: '100%', objectFit: 'contain', boxShadow: 'var(--shadow-lg)', borderRadius: '8px', display: 'block' }} />`;

// We overlay the business logo using absolute positioning near the top left/center.
const newPreviewModal = `
                  <img src={documentType === 'quotation' ? (QUOTATION_PREVIEWS[previewTemplate.id] || previewTemplate.img) : previewTemplate.img} alt={previewTemplate.name} style={{ height: 'auto', width: '100%', objectFit: 'contain', boxShadow: 'var(--shadow-lg)', borderRadius: '8px', display: 'block' }} />
                  {user?.businessLogo && (
                    <img src={user.businessLogo} style={{ position: 'absolute', top: '10%', left: '8%', width: '15%', height: 'auto', objectFit: 'contain', background: '#fff', padding: 2, borderRadius: 4 }} alt="Your Logo" />
                  )}
`;

content = content.replace(oldPreviewModal, newPreviewModal);

fs.writeFileSync(templatesJsxFile, content, 'utf8');

// Fix 3: Locking logic in InvoiceForm.jsx
const invoiceFormFile = path.join(__dirname, 'src', 'pages', 'invoices', 'InvoiceForm.jsx');
let invoiceFormContent = fs.readFileSync(invoiceFormFile, 'utf8');

invoiceFormContent = invoiceFormContent.replace(
    /if \(!FREE_TEMPLATES\.includes\(previewTemplate\.id\)\) \{/,
    "const isFreePlan = !currentUser?.plan || currentUser.plan === 'free';\n                      if (!FREE_TEMPLATES.includes(previewTemplate.id) && isFreePlan) {"
);

invoiceFormContent = invoiceFormContent.replace(
    /\{previewTemplate\.id && !FREE_TEMPLATES\.includes\(previewTemplate\.id\) \? 'Upgrade to Use' : 'Use This Template'\}/g,
    "{previewTemplate.id && !FREE_TEMPLATES.includes(previewTemplate.id) && (!currentUser?.plan || currentUser.plan === 'free') ? 'Upgrade to Use' : 'Use This Template'}"
);

// Also fix the grid item locking in InvoiceForm
invoiceFormContent = invoiceFormContent.replace(
    /t\.id !== '' && !FREE_TEMPLATES\.includes\(t\.id\)/g,
    "t.id !== '' && !FREE_TEMPLATES.includes(t.id) && (!currentUser?.plan || currentUser.plan === 'free')"
);

fs.writeFileSync(invoiceFormFile, invoiceFormContent, 'utf8');

console.log('Fixed locking logic and added overlay to Templates.jsx and InvoiceForm.jsx');
