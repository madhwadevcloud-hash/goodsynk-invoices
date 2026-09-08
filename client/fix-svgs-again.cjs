const fs = require('fs');
const path = require('path');

const publicTemplatesDir = path.join(__dirname, 'public', 'templates');

function processSvgFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file.endsWith('.svg')) {
            const filePath = path.join(dir, file);
            let content = fs.readFileSync(filePath, 'utf8');

            // Find the <g opacity="0.6">...</g> followed by <text ...>Business Name</text>
            // Note: some have <g opacity="0.6">...</g>...<text ...>ABC SOLUTIONS</text>
            const regex = /<g opacity="0\.6">[\s\S]*?<\/g>\s*<text\s+x="([^"]+)"\s+y="([^"]+)"([^>]*)>(ABC SOLUTIONS(?: PVT\. LTD\.)?|Goodsynk Studio[^<]*)<\/text>/g;
            
            if (regex.test(content)) {
                content = content.replace(regex, (match, textX, textY, textAttrs) => {
                    const x = parseFloat(textX);
                    const y = parseFloat(textY) - 18; // move up slightly to align with text baseline
                    return `<g opacity="0.8"><rect x="${x}" y="${y}" width="46" height="30" rx="4" fill="#e2e8f0"/><text x="${x + 23}" y="${y + 19}" font-size="10" font-weight="bold" font-family="Arial" fill="#94a3b8" text-anchor="middle">LOGO</text></g>`;
                });
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated SVG: ${file}`);
            }
        }
    }
}

processSvgFiles(publicTemplatesDir);
console.log('Done replacing SVGs');
