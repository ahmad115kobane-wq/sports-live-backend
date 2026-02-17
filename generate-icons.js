const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Path to the source image (relative to mobile/ directory)
const sourceImage = path.join(__dirname, '../.kiro/WhatsApp Image 2026-02-17 at 9.03.22 PM.jpeg');
const assetsDir = path.join(__dirname, 'assets');

async function processIcons() {
  try {
    console.log('Source image:', sourceImage);
    if (!fs.existsSync(sourceImage)) {
      console.error('Source image not found at:', sourceImage);
      return;
    }

    // Ensure assets directory exists
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    // 1. icon.png (1024x1024) - Main app icon
    await sharp(sourceImage)
      .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }) 
      .toFormat('png')
      .toFile(path.join(assetsDir, 'icon.png'));
    
    console.log('✅ icon.png generated');

    // 2. adaptive-icon.png (1024x1024) - Foreground for adaptive icon
    // We resize it to 720x720 and center it in 1024x1024
    await sharp(sourceImage)
      .resize(720, 720, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .extend({
        top: 152,
        bottom: 152,
        left: 152,
        right: 152,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFormat('png')
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));

    console.log('✅ adaptive-icon.png generated');

  } catch (error) {
    console.error('Error processing icons:', error);
  }
}

processIcons();
