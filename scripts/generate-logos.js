const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// Create a horizontal logo SVG with the ball icon + "MINI FOOTBALL" text
function createLogoSvg(textColor, bgColor) {
    return Buffer.from(`<svg width="520" height="128" viewBox="0 0 520 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Ball Icon -->
  <circle cx="64" cy="64" r="52" stroke="${textColor}" stroke-width="6" fill="${bgColor}"/>
  <path d="M64 34 L86 49 V79 L64 94 L42 79 V49 Z" stroke="${textColor}" stroke-width="5" fill="none" stroke-linejoin="round"/>
  <line x1="64" y1="34" x2="64" y2="12" stroke="${textColor}" stroke-width="5" stroke-linecap="round"/>
  <line x1="86" y1="49" x2="106" y2="38" stroke="${textColor}" stroke-width="5" stroke-linecap="round"/>
  <line x1="86" y1="79" x2="106" y2="90" stroke="${textColor}" stroke-width="5" stroke-linecap="round"/>
  <line x1="64" y1="94" x2="64" y2="116" stroke="${textColor}" stroke-width="5" stroke-linecap="round"/>
  <line x1="42" y1="79" x2="22" y2="90" stroke="${textColor}" stroke-width="5" stroke-linecap="round"/>
  <line x1="42" y1="49" x2="22" y2="38" stroke="${textColor}" stroke-width="5" stroke-linecap="round"/>
  
  <!-- Text "MINI FOOTBALL" -->
  <text x="140" y="55" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="bold" fill="${textColor}" letter-spacing="4">MINI</text>
  <text x="140" y="95" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="bold" fill="${textColor}" letter-spacing="4">FOOTBALL</text>
</svg>`);
}

async function generateLogos() {
    console.log('Generating logo variants...');

    // logo-white.png: white text/icon on transparent background (for dark mode)
    const whiteLogoSvg = createLogoSvg('white', 'transparent');
    await sharp(whiteLogoSvg)
        .resize(520, 128)
        .png()
        .toFile(path.join(assetsDir, 'logo-white.png'));
    console.log('✓ logo-white.png');

    // logo-black.png: black text/icon on transparent background (for light mode)
    const blackLogoSvg = createLogoSvg('black', 'transparent');
    await sharp(blackLogoSvg)
        .resize(520, 128)
        .png()
        .toFile(path.join(assetsDir, 'logo-black.png'));
    console.log('✓ logo-black.png');

    console.log('\nAll logos generated successfully!');
}

generateLogos().catch(err => {
    console.error('Error generating logos:', err);
    process.exit(1);
});
