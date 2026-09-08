const fs = require('fs');
const path = require('path');

const publicTemplatesDir = path.join(__dirname, 'public', 'templates');

function processSvgFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file.endsWith('.svg')) {
            const filePath = path.join(dir, file);
            let content = fs.readFileSync(filePath, 'utf8');

            if (!content.includes('fill="#6366f1"')) {
                // Find ABC SOLUTIONS PVT. LTD. or ABC SOLUTIONS
                let match = content.match(/<text\s+x="([^"]+)"\s+y="([^"]+)"([^>]*)>ABC SOLUTIONS(?: PVT\. LTD\.)?(.*?)</);
                
                // If not found, maybe Goodsynk Studio wasn't matched properly in quotation9?
                if (!match && file === 'quotation9.svg') {
                    match = content.match(/<text\s+x="([^"]+)"\s+y="([^"]+)"([^>]*)>Goodsynk Studio(.*?)</);
                }

                if (match) {
                    const x = parseFloat(match[1]);
                    const y = parseFloat(match[2]);
                    const logoX = x - 25; 
                    const logoY = y - 12; 
                    const logoSvg = `<rect x="${logoX}" y="${logoY}" width="16" height="16" rx="4" fill="#6366f1"/>`;
                    
                    content = content.replace(match[0], `${logoSvg}${match[0]}`);
                    fs.writeFileSync(filePath, content, 'utf8');
                    console.log(`Updated ${file}`);
                }
            }
        }
    }
}

processSvgFiles(publicTemplatesDir);
console.log('Done SVG updates');
