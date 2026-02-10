import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.join(__dirname, '..', 'assets');

const svgPath = path.join(assetsDir, 'app-icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

// Splash screen SVG (vertical, dark bg with ball centered + text)
const splashSvg = `<svg width="1284" height="2778" viewBox="0 0 1284 2778" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bs" cx="642" cy="1100" r="400" fx="560" fy="1000" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.55" stop-color="#E8E8EC"/>
      <stop offset="0.85" stop-color="#B0B0B8"/>
      <stop offset="1" stop-color="#78788A"/>
    </radialGradient>
    <radialGradient id="bh" cx="560" cy="1000" r="220" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ag" cx="642" cy="1150" r="500" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#A8A8A8" stop-opacity="0.08"/>
      <stop offset="0.7" stop-color="#A8A8A8" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="pg" x1="200" y1="1400" x2="1084" y2="1400" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#A8A8A8" stop-opacity="0"/>
      <stop offset="0.2" stop-color="#A8A8A8"/>
      <stop offset="0.8" stop-color="#A8A8A8"/>
      <stop offset="1" stop-color="#A8A8A8" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="bc"><circle cx="642" cy="1100" r="280"/></clipPath>
  </defs>
  <rect width="1284" height="2778" fill="#080808"/>
  <circle cx="642" cy="1150" r="500" fill="url(#ag)"/>
  <circle cx="642" cy="1100" r="280" fill="url(#bs)"/>
  <g clip-path="url(#bc)">
    <path d="M642 1040L686 1065L672 1115H612L598 1065Z" fill="#1A1A1A" stroke="#2A2A2A" stroke-width="2.5"/>
    <path d="M642 870L682 893L670 940H614L602 893Z" fill="#1A1A1A" stroke="#2A2A2A" stroke-width="2.5"/>
    <path d="M800 940L838 965L822 1012H772L758 965Z" fill="#1A1A1A" stroke="#2A2A2A" stroke-width="2.5"/>
    <path d="M484 940L518 965L506 1012H456L440 965Z" fill="#1A1A1A" stroke="#2A2A2A" stroke-width="2.5"/>
    <path d="M786 1170L822 1195L808 1242H758L744 1195Z" fill="#1A1A1A" stroke="#2A2A2A" stroke-width="2.5"/>
    <path d="M498 1170L532 1195L518 1242H468L454 1195Z" fill="#1A1A1A" stroke="#2A2A2A" stroke-width="2.5"/>
    <path d="M642 1280L678 1305L666 1352H618L606 1305Z" fill="#1A1A1A" stroke="#2A2A2A" stroke-width="2.5"/>
    <path d="M642 940L642 1040M670 940L686 1065M614 940L598 1065M602 893L518 965M682 893L758 965M758 965L800 940M518 965L484 940M686 1065L786 1170M598 1065L498 1170M672 1115L786 1170M612 1115L498 1170M672 1115L678 1305M612 1115L606 1305M744 1195L822 1195M454 1195L532 1195" stroke="#C0C0C0" stroke-width="3.5" stroke-opacity="0.4"/>
  </g>
  <circle cx="560" cy="1000" r="180" fill="url(#bh)"/>
  <circle cx="642" cy="1100" r="280" stroke="white" stroke-width="4" stroke-opacity="0.1" fill="none"/>
  <path d="M200 1400L400 1400C420 1400 430 1400 448 1374C466 1348 474 1330 490 1296C506 1262 514 1252 522 1278C530 1304 538 1348 554 1400C570 1452 578 1462 586 1436C594 1410 602 1348 610 1296C618 1244 626 1236 634 1262C642 1288 650 1330 658 1356C666 1382 674 1388 690 1400L1084 1400" stroke="url(#pg)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M200 1400L400 1400C420 1400 430 1400 448 1374C466 1348 474 1330 490 1296C506 1262 514 1252 522 1278C530 1304 538 1348 554 1400C570 1452 578 1462 586 1436C594 1410 602 1348 610 1296C618 1244 626 1236 634 1262C642 1288 650 1330 658 1356C666 1382 674 1388 690 1400L1084 1400" stroke="#A8A8A8" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.15"/>
  <text x="642" y="1560" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="800" fill="white" letter-spacing="4">SPORTS LIVE</text>
  <text x="642" y="1620" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="400" fill="#6E6E6E" letter-spacing="8">LIVE SCORES</text>
</svg>`;

// Notification icon SVG (simple white ball on transparent)
const notifSvg = `<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="48" cy="48" r="36" fill="white"/>
  <path d="M48 30L56 35L53 44H43L40 35Z" fill="#333"/>
  <path d="M48 16L55 20L53 28H43L41 20Z" fill="#333"/>
  <path d="M66 22L72 27L69 34H63L60 27Z" fill="#333"/>
  <path d="M30 22L36 27L33 34H27L24 27Z" fill="#333"/>
  <path d="M64 52L70 57L67 64H61L58 57Z" fill="#333"/>
  <path d="M32 52L38 57L35 64H29L26 57Z" fill="#333"/>
  <path d="M48 66L55 70L53 76H43L41 70Z" fill="#333"/>
</svg>`;

async function generate() {
  console.log('Generating app icons from SVG...\n');

  // icon.png - 1024x1024
  await sharp(svgBuffer, { density: 300 })
    .resize(1024, 1024)
    .png({ quality: 100, compressionLevel: 6 })
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('  icon.png (1024x1024)');

  // adaptive-icon.png - 1024x1024
  await sharp(svgBuffer, { density: 300 })
    .resize(1024, 1024)
    .png({ quality: 100, compressionLevel: 6 })
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('  adaptive-icon.png (1024x1024)');

  // favicon.png - 48x48
  await sharp(svgBuffer, { density: 300 })
    .resize(48, 48)
    .png({ quality: 100 })
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('  favicon.png (48x48)');

  // splash.png - 1284x2778
  await sharp(Buffer.from(splashSvg), { density: 150 })
    .resize(1284, 2778)
    .png({ quality: 100, compressionLevel: 6 })
    .toFile(path.join(assetsDir, 'splash.png'));
  console.log('  splash.png (1284x2778)');

  // notification-icon.png - 96x96
  await sharp(Buffer.from(notifSvg), { density: 300 })
    .resize(96, 96)
    .png({ quality: 100 })
    .toFile(path.join(assetsDir, 'notification-icon.png'));
  console.log('  notification-icon.png (96x96)');

  console.log('\nAll icons generated successfully!');
}

generate().catch(console.error);
