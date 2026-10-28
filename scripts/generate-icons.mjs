import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputSvg = 'public/favicon.svg';
const outputDir = 'public/icons';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const icons = [
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'maskable-icon-512x512.png', size: 512, maskable: true },
];

async function generateIcons() {
    for (const icon of icons) {
        let pipeline = sharp(inputSvg)
            .resize(icon.size, icon.size);

        if (icon.maskable) {
            // Maskable icons need some padding to ensure they are within the safe zone
            // We'll add 10% padding
            const padding = Math.floor(icon.size * 0.1);
            const innerSize = icon.size - padding * 2;
            
            pipeline = sharp({
                create: {
                    width: icon.size,
                    height: icon.size,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background or specific color
                }
            })
            .composite([{
                input: await sharp(inputSvg).resize(innerSize, innerSize).toBuffer(),
                top: padding,
                left: padding
            }]);
        }

        await pipeline.toFile(path.join(outputDir, icon.name));
        console.log(`Generated ${icon.name}`);
    }
}

generateIcons().catch(console.error);
