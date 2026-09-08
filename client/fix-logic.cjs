const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'src', 'pages', 'invoices', 'templates');

// Regex to find the optional logo Image and the business name Text
const renderRegex = /(?:\{biz\?\.businessLogo\s*&&\s*<Image\s*style=\{s\.topLogo\}\s*src=\{biz\.businessLogo\}\s*\/>\}\s*)?<Text\s*style=\{s\.bizName(Top|Text|Header)?\}>\{bizName\}<\/Text>/g;

for (let i = 1; i <= 11; i++) {
    const file = path.join(templatesDir, `Template${i}.jsx`);
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        let updated = false;

        // Ensure topLogo style exists, make it big enough
        if (!content.includes('topLogo:')) {
            content = content.replace(/(bizName[^:]*: \{.*\},)/, "topLogo: { width: 70, height: 70, objectFit: 'contain', marginBottom: 6 },\n    $1");
            updated = true;
        }

        // Replace the render block
        if (renderRegex.test(content)) {
            content = content.replace(renderRegex, (match, suffix) => {
                const styleProp = suffix ? `s.bizName${suffix}` : `s.bizName`;
                return `{biz?.businessLogo ? (
              <Image style={s.topLogo} src={biz.businessLogo} />
            ) : (
              <Text style={${styleProp}}>{bizName}</Text>
            )}`;
            });
            updated = true;
        }

        if (updated) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Updated Template${i}.jsx`);
        }
    }
}

// For DocumentTemplate.jsx
const docTemplateFile = path.join(templatesDir, `DocumentTemplate.jsx`);
if (fs.existsSync(docTemplateFile)) {
    let content = fs.readFileSync(docTemplateFile, 'utf8');
    
    // We want to hide the business name block if businessLogo is present.
    // Currently: {biz.businessLogo ? <Image ... /> : <Text ...>G</Text>}<View><Text ...bizName.../><Text ...muted.../></View>
    // Let's replace the whole brand View contents.
    
    // In band:
    content = content.replace(
        /<View style=\{styles\.brand\}>\{biz\.businessLogo \? <Image src=\{biz\.businessLogo\} style=\{styles\.logo\} \/> : <Text style=\{styles\.logoFallback\}>G<\/Text>\}<View><Text style=\{\{ \.\.\.styles\.bizName, color: '#FFFFFF' \}\}>\{biz\.businessName \|\| biz\.name \|\| 'Your Business'\}<\/Text><Text style=\{\{ color: '#DCE5ED', marginTop: 3 \}\}>Tax invoice and payment record<\/Text><\/View><\/View>/g,
        `<View style={styles.brand}>{biz.businessLogo ? <Image src={biz.businessLogo} style={styles.logo} /> : <View><Text style={{ ...styles.bizName, color: '#FFFFFF' }}>{biz.businessName || biz.name || 'Your Business'}</Text><Text style={{ color: '#DCE5ED', marginTop: 3 }}>Tax invoice and payment record</Text></View>}</View>`
    );
    
    // In normal top:
    content = content.replace(
        /<View style=\{styles\.brand\}>\{biz\.businessLogo \? <Image src=\{biz\.businessLogo\} style=\{styles\.logo\} \/> : <Text style=\{styles\.logoFallback\}>G<\/Text>\}<View><Text style=\{styles\.bizName\}>\{biz\.businessName \|\| biz\.name \|\| 'Your Business'\}<\/Text><Text style=\{styles\.muted\}>\{biz\.email \|\| ''\}<\/Text><\/View><\/View>/g,
        `<View style={styles.brand}>{biz.businessLogo ? <Image src={biz.businessLogo} style={styles.logo} /> : <View><Text style={styles.bizName}>{biz.businessName || biz.name || 'Your Business'}</Text><Text style={styles.muted}>{biz.email || ''}</Text></View>}</View>`
    );

    // Also increase logo size in DocumentTemplate
    content = content.replace(/logo: \{ width: 36, height: 36, objectFit: 'contain' \}/g, "logo: { width: 50, height: 50, objectFit: 'contain' }");

    fs.writeFileSync(docTemplateFile, content, 'utf8');
    console.log(`Updated DocumentTemplate.jsx`);
}
