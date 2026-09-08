const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'src', 'pages', 'invoices', 'templates');

for (let i = 1; i <= 11; i++) {
    const file = path.join(templatesDir, `Template${i}.jsx`);
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');

        // Increase logo size and remove centering
        content = content.replace(/width: 40, height: 40/g, "width: 80, height: 80");
        content = content.replace(/width: 70, height: 70/g, "width: 80, height: 80");
        content = content.replace(/height: scaled\.logoHeight, maxWidth: 120/g, "height: 80, maxWidth: 200");
        content = content.replace(/height: scaled\.logoHeight, maxWidth: 150/g, "height: 80, maxWidth: 200");
        content = content.replace(/height: scaled\.logoHeight, maxWidth: 160/g, "height: 80, maxWidth: 200");
        
        // If there's an alignItems: 'center' on bizBox or similar wrapper, maybe remove it
        // We know Template10 had alignItems: 'center' on bizBox with flexDirection: 'row' - that's fine (vertical centering).
        
        fs.writeFileSync(file, content, 'utf8');
    }
}

// DocumentTemplate.jsx
const docTemplateFile = path.join(templatesDir, `DocumentTemplate.jsx`);
if (fs.existsSync(docTemplateFile)) {
    let content = fs.readFileSync(docTemplateFile, 'utf8');
    content = content.replace(/logo: \{ width: 50, height: 50, objectFit: 'contain' \}/g, "logo: { width: 80, height: 80, objectFit: 'contain' }");
    content = content.replace(/logo: \{ width: 46, height: 46, objectFit: 'contain' \}/g, "logo: { width: 80, height: 80, objectFit: 'contain' }");
    fs.writeFileSync(docTemplateFile, content, 'utf8');
}

console.log("Updated logo sizes");
