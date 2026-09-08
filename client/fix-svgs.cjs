const fs = require('fs');
const path = require('path');

const publicTemplatesDir = path.join(__dirname, 'public', 'templates');

function processSvgFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file.endsWith('.svg')) {
            const filePath = path.join(dir, file);
            let content = fs.readFileSync(filePath, 'utf8');

            const regex = /<rect x="([^"]+)" y="([^"]+)" width="16" height="16" rx="4" fill="#6366f1"\/>/g;
            if (regex.test(content)) {
                content = content.replace(regex, (match, logoX, logoY) => {
                    const x = parseFloat(logoX);
                    const y = parseFloat(logoY);
                    return `<g opacity="0.6"><rect x="${x}" y="${y}" width="18" height="18" rx="4" fill="#f1f5f9"/><rect x="${x}" y="${y}" width="18" height="18" rx="4" fill="none" stroke="#cbd5e1" stroke-width="1"/><path d="M${x+3} ${y+13}l3.5-3.5 2 2 3.5-3.5 3 3" stroke="#94a3b8" fill="none" stroke-width="1.5" stroke-linecap="round"/><circle cx="${x+5.5}" cy="${y+6.5}" r="1.5" fill="#94a3b8"/></g>`;
                });
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated ${file}`);
            }
        }
    }
}

processSvgFiles(publicTemplatesDir);
console.log('Done replacing SVGs');
