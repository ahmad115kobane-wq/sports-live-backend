const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sourceImage = path.join(__dirname, '../.kiro/WhatsApp Image 2026-02-17 at 9.03.22 PM.jpeg');
const assetsDir = path.join(__dirname, 'assets');

async function processIcons() {
  try {
    console.log('Processing icon from:', sourceImage);
    
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    const size = 1024;
    const eagleScale = 0.55; // Scale eagle to 55% for more white space
    const eagleSize = Math.round(size * eagleScale); // ~563px
    const eagleRadius = eagleSize / 2;

    // 1. Create the White Base Circle (1024x1024)
    // This serves as the background for the icon
    const whiteCircleSvg = Buffer.from(
      `<svg width="${size}" height="${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/>
      </svg>`
    );

    // 2. Prepare the Eagle Image
    // a. Resize first
    const resizedEagle = await sharp(sourceImage)
      .resize(eagleSize, eagleSize, { fit: 'cover' })
      .toBuffer();

    // b. Create a transparency mask from the image (remove dark pixels)
    //    Increase threshold to 70 for very aggressive removal of black background
    const thresholdLevel = 70; 
    const colorMask = await sharp(resizedEagle)
      .grayscale()
      .threshold(thresholdLevel) 
      // Removed blur to prevent dark halo at edges
      .toBuffer();

    // c. Create a Circular Mask to force the eagle image to be round (remove square corners)
    const circleMask = Buffer.from(
      `<svg width="${eagleSize}" height="${eagleSize}">
        <circle cx="${eagleRadius}" cy="${eagleRadius}" r="${eagleRadius}" fill="black"/>
      </svg>`
    );

    // d. Combine: Apply Color Mask (remove black) AND Circle Mask (remove corners)
    // We combine the color mask with the circle mask first
    const combinedMask = await sharp(colorMask)
      .composite([{ input: circleMask, blend: 'dest-in' }])
      .toBuffer();

    // e. Apply the combined mask to the resized eagle
    const circularEagle = await sharp(resizedEagle)
      .ensureAlpha()
      .composite([{
        input: combinedMask,
        blend: 'dest-in'
      }])
      .toBuffer();

    // 3. Composite: Transparent Canvas -> White Circle -> Centered Clean Eagle
    await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
      .composite([
        { input: whiteCircleSvg }, // Draw white circle base
        { input: circularEagle, gravity: 'center' } // Layer cleaned eagle on top
      ])
      .toFormat('png')
      .toFile(path.join(assetsDir, 'icon.png'));

    console.log('✅ icon.png generated (White Circle + Smaller Round Eagle)');

    // 4. Generate adaptive-icon.png (Same as icon.png)
    // For adaptive icons, the launcher applies its own mask (squircle/circle).
    // Providing a circular icon with transparent corners works well as a "legacy" style adaptive icon 
    // or we can just use the full bleed. 
    // Given the user wants "White Circle", we'll use the same generated image.
    
    // Note: If we wanted a full-bleed adaptive icon, we would make the background white square 
    // and place the eagle in the center. But "White Circle" implies the user wants the circle shape visible.
    // However, adaptive icons *are* the mask. 
    // To fix "black around it" for adaptive icons specifically, we might need a square white background.
    // Let's generate a SQUARE white background version for 'adaptive-icon.png' just in case the "black" 
    // comes from the transparent area being filled with black by some Android launchers.
    
    // Actually, the user said "black around it", which likely refers to the corners of the JPEG.
    // Let's stick to the circular design for now as requested.
    
    await sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
      .composite([
        { input: whiteCircleSvg },
        { input: circularEagle, gravity: 'center' }
      ])
      .toFormat('png')
      .toFile(path.join(assetsDir, 'adaptive-icon.png'));

    console.log('✅ adaptive-icon.png generated');

  } catch (error) {
    console.error('Error processing icons:', error);
  }
}

processIcons();
