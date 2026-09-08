const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'src', 'pages', 'invoices', 'templates');

for (let i = 1; i <= 11; i++) {
    const file = path.join(templatesDir, `Template${i}.jsx`);
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        let updated = false;

        // Ensure topLogo style exists
        if (!content.includes('topLogo:')) {
            content = content.replace(/(bizName[^:]*: \{.*\},)/, "topLogo: { width: 70, height: 70, objectFit: 'contain', marginBottom: 6 },\n    $1");
            updated = true;
        }

        // Replace the block
        // Find: {biz?.businessLogo && ( <Image style={s.topLogo} src={biz.businessLogo} /> )}
        // And the <Text style={s.bizName...}>{bizName}</Text>
        const regex = /\{biz\?\.businessLogo\s*&&\s*\(\s*<Image\s*style=\{s\.topLogo\}\s*src=\{biz\.businessLogo\}\s*\/>\s*\)\s*\}\s*<Text\s*style=\{s\.bizName(Top|Text|Header)?\}>\{bizName\}<\/Text>/g;
        
        if (regex.test(content)) {
            content = content.replace(regex, (match, suffix) => {
                const styleProp = suffix ? `s.bizName${suffix}` : `s.bizName`;
                return `{biz?.businessLogo ? (
              <Image style={s.topLogo} src={biz.businessLogo} />
            ) : (
              <Text style={${styleProp}}>{bizName}</Text>
            )}`;
            });
            updated = true;
        } else {
            // Also try to match without parentheses
            const regex2 = /\{biz\?\.businessLogo\s*&&\s*<Image\s*style=\{s\.topLogo\}\s*src=\{biz\.businessLogo\}\s*\/>\s*\}\s*<Text\s*style=\{s\.bizName(Top|Text|Header)?\}>\{bizName\}<\/Text>/g;
            if (regex2.test(content)) {
                content = content.replace(regex2, (match, suffix) => {
                    const styleProp = suffix ? `s.bizName${suffix}` : `s.bizName`;
                    return `{biz?.businessLogo ? (
              <Image style={s.topLogo} src={biz.businessLogo} />
            ) : (
              <Text style={${styleProp}}>{bizName}</Text>
            )}`;
                });
                updated = true;
            }
        }

        if (updated) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Updated Template${i}.jsx`);
        }
    }
}
