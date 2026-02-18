const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, 'assets');
const iconPngPath = path.join(assetsDir, 'icon.png');
const iconSvgPath = path.join(assetsDir, 'icon.svg');

async function generateSvg() {
  try {
    if (!fs.existsSync(iconPngPath)) {
      console.error('❌ icon.png not found. Run update-icons.js first.');
      return;
    }

    console.log('Generating SVG from:', iconPngPath);

    // Read the PNG file
    const pngBuffer = fs.readFileSync(iconPngPath);
    const base64Png = pngBuffer.toString('base64');

    // Create SVG content with embedded base64 image
    const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="1024" height="1024" xlink:href="data:image/png;base64,${base64Png}"/>
</svg>`;

    fs.writeFileSync(iconSvgPath, svgContent);
    console.log('✅ icon.svg generated');

  } catch (error) {
    console.error('Error generating SVG:', error);
  }
}

generateSvg();
