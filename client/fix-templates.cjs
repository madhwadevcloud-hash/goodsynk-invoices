const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'src', 'pages', 'invoices', 'templates');

for (let i = 1; i <= 11; i++) {
    const file = path.join(templatesDir, `Template${i}.jsx`);
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');

        // Revert Template 1-7 layout:
        // From:
        // <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        //   {biz?.businessLogo && <Image src={biz.businessLogo} style={{ width: 40, height: 40, objectFit: 'contain', marginRight: 8 }} />}
        //   <Text style={[s.bizName..., { marginBottom: 0 }]}>{bizName}</Text>
        // </View>
        
        // Remove the inline logo entirely from next to the text.
        // And for 1-7, add it at the top of the header block.
        // Wait, for 8-11, I removed {biz?.businessLogo && <Image style={s.topLogo} src={biz.businessLogo} />}.
        // Let's use string replacements.

        // Fix the text wrap
        content = content.replace(/<View style=\{\{\s*flexDirection:\s*'row',\s*alignItems:\s*'center'(?:,\s*justifyContent:\s*'flex-end')?,\s*marginBottom:\s*4\s*\}\}>\s*\{biz\?\.businessLogo\s*&&\s*<Image\s*src=\{biz\.businessLogo\}\s*style=\{\{\s*width:\s*40,\s*height:\s*40,\s*objectFit:\s*'contain',\s*marginRight:\s*8\s*\}\}\s*\/>\}\s*<Text\s*style=\{\[([^,]+),\s*\{\s*marginBottom:\s*0\s*\}\]\}\>(\{bizName\})<\/Text>\s*<\/View>/g, '<Text style={$1}>$2</Text>');

        // For 8-11, add back the topLogo if missing
        if (i >= 8 && i <= 11) {
            // Need to insert {biz?.businessLogo && <Image style={s.topLogo} src={biz.businessLogo} />} above <Text style={s.bizName}>{bizName}</Text>
            if (!content.includes('s.topLogo')) {
                content = content.replace(/(<Text style=\{s\.bizName\}>\{bizName\}<\/Text>)/, '{biz?.businessLogo && <Image style={s.topLogo} src={biz.businessLogo} />}\n            $1');
            }
        } else {
            // For 1-7, where should the logo go?
            // In Template1, there is `<View style={s.headerRight}>`. The logo can be the very first thing.
            if (!content.includes('s.topLogo')) {
                // Add topLogo style if not present
                if (!content.includes('topLogo:')) {
                    content = content.replace(/(bizName: \{.*\},)/, "topLogo: { width: 40, height: 40, objectFit: 'contain', marginBottom: 6 },\n    $1");
                    content = content.replace(/(bizNameText: \{.*\},)/, "topLogo: { width: 40, height: 40, objectFit: 'contain', marginBottom: 6 },\n    $1");
                    content = content.replace(/(bizNameHeader: \{.*\},)/, "topLogo: { width: 40, height: 40, objectFit: 'contain', marginBottom: 6 },\n    $1");
                }
                
                // Now insert the logo above bizName
                if (content.includes('<Text style={s.bizName}>{bizName}</Text>')) {
                    content = content.replace(/(<Text style=\{s\.bizName\}>\{bizName\}<\/Text>)/, '{biz?.businessLogo && <Image style={s.topLogo} src={biz.businessLogo} />}\n            $1');
                } else if (content.includes('<Text style={s.bizNameText}>{bizName}</Text>')) {
                    content = content.replace(/(<Text style=\{s\.bizNameText\}>\{bizName\}<\/Text>)/, '{biz?.businessLogo && <Image style={s.topLogo} src={biz.businessLogo} />}\n            $1');
                } else if (content.includes('<Text style={s.bizNameHeader}>{bizName}</Text>')) {
                    content = content.replace(/(<Text style=\{s\.bizNameHeader\}>\{bizName\}<\/Text>)/, '{biz?.businessLogo && <Image style={s.topLogo} src={biz.businessLogo} />}\n            $1');
                }
            }
        }
        
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated Template${i}.jsx`);
    }
}
