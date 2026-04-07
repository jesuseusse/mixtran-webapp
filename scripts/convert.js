import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory of the script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function convertToIco() {
    // Define absolute paths
    // We go up one level from 'scripts' to reach the root, then into 'public'
    const inputPath = path.join(__dirname, '../public/favicon.svg');
    const outputPath = path.join(__dirname, '../public/favicon.ico');

    try {
        console.log(`Reading from: ${inputPath}`);

        const pngBuffer = await sharp(inputPath, { density: 300 })
            .resize(256, 256, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toBuffer();

        const icoBuffer = await pngToIco(pngBuffer);

        fs.writeFileSync(outputPath, icoBuffer);
        console.log(`✅ Icon created successfully at: ${outputPath}`);
    } catch (err) {
        console.error('❌ Error during conversion:', err.message);
    }
}

convertToIco();