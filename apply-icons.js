const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, 'assets');
const iconPng = path.join(assetsDir, 'icon.png');

async function generateAllIcons() {
  try {
    if (!fs.existsSync(iconPng)) {
      console.error('❌ icon.png not found');
      return;
    }

    // 1. adaptive-icon.png (1024x1024 - same as icon.png)
    await sharp(iconPng)
      .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFormat('png')
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    console.log('✅ adaptive-icon.png');

    // 2. favicon.png (48x48)
    await sharp(iconPng)
      .resize(48, 48, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFormat('png')
      .toFile(path.join(assetsDir, 'favicon.png'));
    console.log('✅ favicon.png');

    // 3. notification-icon.png (96x96 - white monochrome silhouette)
    // Android notification icons must be single-color (white) with transparent background
    await sharp(iconPng)
      .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .grayscale()
      .threshold(128)
      .toFormat('png')
      .toFile(path.join(assetsDir, 'notification-icon.png'));
    console.log('✅ notification-icon.png');

    // 4. splash.png (1284x2778 - centered on dark background)
    const splashWidth = 1284;
    const splashHeight = 2778;
    const logoSize = 400; // Size of the logo on the splash screen

    const resizedLogo = await sharp(iconPng)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
        create: {
          width: splashWidth,
          height: splashHeight,
          channels: 4,
          background: { r: 8, g: 8, b: 8, alpha: 255 } // #080808
        }
      })
      .composite([{ input: resizedLogo, gravity: 'center' }])
      .toFormat('png')
      .toFile(path.join(assetsDir, 'splash.png'));
    console.log('✅ splash.png');

    // 5. app-icon.svg - copy icon.svg content
    const iconSvgPath = path.join(assetsDir, 'icon.svg');
    const appIconSvgPath = path.join(assetsDir, 'app-icon.svg');
    if (fs.existsSync(iconSvgPath)) {
      fs.copyFileSync(iconSvgPath, appIconSvgPath);
      console.log('✅ app-icon.svg');
    }

    console.log('\n🎉 All icons generated from icon.png!');
    console.log('⚠️  logo-black.png and logo-white.png left unchanged.');

  } catch (error) {
    console.error('Error:', error);
  }
}

generateAllIcons();
