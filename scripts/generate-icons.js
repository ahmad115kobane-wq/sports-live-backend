const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const svgPath = path.join(assetsDir, 'app-icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

// App theme colors from Colors.ts
const DARK = {
    bg: '#080808',
    text: '#F5F5F5',
};
const LIGHT = {
    bg: '#FFFFFF',
    text: '#111111',
};

// Create ball SVG with specific colors
function createBallSvg(strokeColor, bgColor, size = 512) {
    return Buffer.from(`<svg width="${size}" height="${size}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="80" fill="${bgColor}"/>
  <circle cx="256" cy="256" r="144" stroke="${strokeColor}" stroke-width="12" fill="${bgColor}"/>
  <g stroke="${strokeColor}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
    <path d="M256 206 L305 242 L287 305 L225 305 L207 242 Z" fill="none"/>
    <path d="M256 206 L256 134" />
    <path d="M305 242 L368 222" /> 
    <path d="M287 305 L332 358" />
    <path d="M225 305 L180 358" />
    <path d="M207 242 L144 222" />
  </g>
</svg>`);
}

// Create logo SVG with ball + text
function createLogoSvg(textColor, bgColor) {
    return Buffer.from(`<svg width="520" height="128" viewBox="0 0 520 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="64" cy="64" r="52" stroke="${textColor}" stroke-width="6" fill="${bgColor}"/>
  <path d="M64 34 L86 49 V79 L64 94 L42 79 V49 Z" stroke="${textColor}" stroke-width="5" fill="none" stroke-linejoin="round"/>
  <line x1="64" y1="34" x2="64" y2="12" stroke="${textColor}" stroke-width="5" stroke-linecap="round"/>
  <line x1="86" y1="49" x2="106" y2="38" stroke="${textColor}" stroke-width="5" stroke-linecap="round"/>
  <line x1="86" y1="79" x2="106" y2="90" stroke="${textColor}" stroke-width="5" stroke-linecap="round"/>
  <line x1="64" y1="94" x2="64" y2="116" stroke="${textColor}" stroke-width="5" stroke-linecap="round"/>
  <line x1="42" y1="79" x2="22" y2="90" stroke="${textColor}" stroke-width="5" stroke-linecap="round"/>
  <line x1="42" y1="49" x2="22" y2="38" stroke="${textColor}" stroke-width="5" stroke-linecap="round"/>
  <text x="140" y="55" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="bold" fill="${textColor}" letter-spacing="4">MINI</text>
  <text x="140" y="95" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="bold" fill="${textColor}" letter-spacing="4">FOOTBALL</text>
</svg>`);
}

async function generateAll() {
    console.log('=== Generating all icons with app theme colors ===\n');

    // --- DARK MODE icons (main app icon) ---
    const darkBallSvg = createBallSvg(DARK.text, DARK.bg);

    // 1. icon.png (1024x1024) - dark mode
    await sharp(darkBallSvg).resize(1024, 1024).png().toFile(path.join(assetsDir, 'icon.png'));
    console.log('✓ icon.png (1024x1024) - dark mode (#080808 bg, #F5F5F5 icon)');

    // 2. adaptive-icon.png (1024x1024) - dark mode
    await sharp(darkBallSvg).resize(1024, 1024).png().toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('✓ adaptive-icon.png (1024x1024) - dark mode');

    // 3. favicon.png (48x48) - dark mode
    await sharp(darkBallSvg).resize(48, 48).png().toFile(path.join(assetsDir, 'favicon.png'));
    console.log('✓ favicon.png (48x48) - dark mode');

    // 4. notification-icon.png (96x96) - dark mode
    await sharp(darkBallSvg).resize(96, 96).png().toFile(path.join(assetsDir, 'notification-icon.png'));
    console.log('✓ notification-icon.png (96x96) - dark mode');

    // 5. splash.png (1284x2778) - dark mode, ball centered
    const splashWidth = 1284;
    const splashHeight = 2778;
    const ballSize = 512;
    const ballPng = await sharp(darkBallSvg).resize(ballSize, ballSize).png().toBuffer();

    await sharp({
        create: {
            width: splashWidth,
            height: splashHeight,
            channels: 4,
            background: { r: 8, g: 8, b: 8, alpha: 1 } // #080808
        }
    })
        .composite([{
            input: ballPng,
            left: Math.floor((splashWidth - ballSize) / 2),
            top: Math.floor((splashHeight - ballSize) / 2)
        }])
        .png()
        .toFile(path.join(assetsDir, 'splash.png'));
    console.log('✓ splash.png (1284x2778) - dark mode');

    // --- LOGOS ---
    // logo-white.png: #F5F5F5 icon/text on transparent (for dark backgrounds)
    const whiteLogoSvg = createLogoSvg(DARK.text, 'transparent');
    await sharp(whiteLogoSvg).resize(520, 128).png().toFile(path.join(assetsDir, 'logo-white.png'));
    console.log('✓ logo-white.png - #F5F5F5 on transparent (dark mode header)');

    // logo-black.png: #111111 icon/text on transparent (for light backgrounds)
    const blackLogoSvg = createLogoSvg(LIGHT.text, 'transparent');
    await sharp(blackLogoSvg).resize(520, 128).png().toFile(path.join(assetsDir, 'logo-black.png'));
    console.log('✓ logo-black.png - #111111 on transparent (light mode header)');

    console.log('\n=== All icons generated with app theme colors! ===');
}

generateAll().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
