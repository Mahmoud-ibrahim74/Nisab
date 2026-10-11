const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

function encodeBmp24(width, height, rgbBuffer) {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buf = Buffer.alloc(fileSize);

  // BITMAPFILEHEADER (14 bytes)
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt16LE(0, 6);
  buf.writeUInt16LE(0, 8);
  buf.writeUInt32LE(54, 10);

  // BITMAPINFOHEADER (40 bytes)
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30); // BI_RGB (uncompressed)
  buf.writeUInt32LE(pixelArraySize, 34);
  buf.writeInt32LE(2835, 38);
  buf.writeInt32LE(2835, 42);
  buf.writeUInt32LE(0, 46);
  buf.writeUInt32LE(0, 50);

  // Pixels bottom-to-top, BGR order
  for (let y = 0; y < height; y++) {
    const srcY = height - 1 - y;
    const destRowOffset = 54 + y * rowSize;
    const srcRowOffset = srcY * width * 3;
    for (let x = 0; x < width; x++) {
      const srcPx = srcRowOffset + x * 3;
      const r = rgbBuffer[srcPx];
      const g = rgbBuffer[srcPx + 1];
      const b = rgbBuffer[srcPx + 2];

      const destPx = destRowOffset + x * 3;
      buf[destPx] = b;
      buf[destPx + 1] = g;
      buf[destPx + 2] = r;
    }
  }

  return buf;
}

async function generate() {
  const assetsDir = path.resolve(__dirname, '../src/assets');
  const iconPngPath = path.resolve(assetsDir, 'icon.png');

  // 1. Wizard Small Bitmap (55 x 55 px) with clean white background
  const smallRaw = await sharp(iconPngPath)
    .resize(48, 48, { fit: 'contain', background: '#ffffff' })
    .extend({
      top: 3,
      bottom: 4,
      left: 3,
      right: 4,
      background: '#ffffff'
    })
    .flatten({ background: '#ffffff' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const smallBmp = encodeBmp24(smallRaw.info.width, smallRaw.info.height, smallRaw.data);
  fs.writeFileSync(path.resolve(assetsDir, 'wizard-small.bmp'), smallBmp);
  console.log(`✓ wizard-small.bmp generated (${smallRaw.info.width}x${smallRaw.info.height}, ${smallBmp.length} bytes)`);

  // 2. Wizard Large Bitmap (164 x 314 px) with Islamic emerald theme
  const iconBadge = await sharp(iconPngPath)
    .resize(100, 100)
    .toBuffer();

  const svgBanner = Buffer.from(`
    <svg width="164" height="314" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#031b17;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#0b3d33;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#062b25;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      <circle cx="82" cy="85" r="56" fill="#d4af37" fill-opacity="0.15" />
      <text x="82" y="180" font-family="Segoe UI, Tahoma, sans-serif" font-size="22" font-weight="bold" fill="#f5eedc" text-anchor="middle">نصاب</text>
      <text x="82" y="205" font-family="Segoe UI, Tahoma, sans-serif" font-size="13" font-weight="bold" fill="#d4af37" text-anchor="middle">Nisab v1.0</text>
      <line x1="28" y1="222" x2="136" y2="222" stroke="#d4af37" stroke-opacity="0.3" stroke-width="1" />
      <text x="82" y="245" font-family="Segoe UI, Tahoma, sans-serif" font-size="11" fill="#9ec5b8" text-anchor="middle">رفيقك المسلم اليومي</text>
      <text x="82" y="265" font-family="Segoe UI, Tahoma, sans-serif" font-size="10" fill="#719488" text-anchor="middle">Windows 7, 8, 10, 11</text>
    </svg>
  `);

  const largePngBuffer = await sharp(svgBanner)
    .composite([{ input: iconBadge, top: 35, left: 32 }])
    .png()
    .toBuffer();

  const largeRaw = await sharp(largePngBuffer)
    .resize(164, 314)
    .flatten({ background: '#031b17' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const largeBmp = encodeBmp24(largeRaw.info.width, largeRaw.info.height, largeRaw.data);
  fs.writeFileSync(path.resolve(assetsDir, 'wizard-large.bmp'), largeBmp);
  console.log(`✓ wizard-large.bmp generated (${largeRaw.info.width}x${largeRaw.info.height}, ${largeBmp.length} bytes)`);
}

module.exports = generate;

if (require.main === module) {
  generate().catch(err => {
    console.error('Failed generating bitmaps:', err);
    process.exit(1);
  });
}
