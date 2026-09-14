const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Simple PNG encoder in pure JS
function createPNG(width, height, drawPixelFn) {
  // Raw image data: height rows, each starting with filter byte 0, then width * 4 bytes (RGBA)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawPixelFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // Bit depth
  ihdr[9] = 6;  // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  
  // CRC calculation
  const crcData = buf.slice(4, 8 + len);
  const crc = crc32(crcData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

// Standard CRC-32
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return (c ^ 0xffffffff) >>> 0;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

// Icon Drawer: Otivo Modern Trading Chart Brand Icon
function drawOtivoIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = w / 512;

  // Background
  const distFromCenter = Math.hypot(x - cx, y - cy);
  const maxRadius = w / 2;

  // Corner radius for standard icon
  let inBounds = true;
  if (!isMaskable) {
    const cornerR = w * 0.22;
    const dx = Math.max(0, Math.abs(x - cx) - (w / 2 - cornerR));
    const dy = Math.max(0, Math.abs(y - cy) - (h / 2 - cornerR));
    if (Math.hypot(dx, dy) > cornerR) inBounds = false;
  }

  if (!inBounds) return [0, 0, 0, 0];

  // Base background gradient: Dark Navy / Obsidian #0b0f19 -> #131b2e
  const bgGrad = y / h;
  let r = Math.round(11 + bgGrad * 12);
  let g = Math.round(15 + bgGrad * 18);
  let b = Math.round(25 + bgGrad * 35);
  let a = 255;

  // Outer glow / accent circle ring
  const ringRadius = w * (isMaskable ? 0.36 : 0.40);
  const ringDist = Math.abs(distFromCenter - ringRadius);
  if (ringDist < 6 * scale) {
    const ringAlpha = Math.max(0, 1 - ringDist / (6 * scale));
    r = Math.round(r * (1 - ringAlpha) + 41 * ringAlpha);
    g = Math.round(g * (1 - ringAlpha) + 98 * ringAlpha);
    b = Math.round(b * (1 - ringAlpha) + 255 * ringAlpha);
  }

  // Draw Candlesticks & Chart Pattern inside safe zone
  // Bar 1 (Bullish green): x=140..180, high y=180, low y=360, body y=220..320
  // Bar 2 (Bearish red/accent): x=200..240, high y=140, low y=340, body y=170..280
  // Bar 3 (Bullish green): x=260..300, high y=110, low y=300, body y=130..250
  // Bar 4 (Ascending peak): x=320..360, high y=90, low y=260, body y=110..200

  const px = x / scale;
  const py = y / scale;

  // Candlestick function
  function isInsideCandle(bx, w, highY, lowY, bodyTop, bodyBottom) {
    // Wick
    const wickX = bx + w / 2;
    if (Math.abs(px - wickX) <= 2 && py >= highY && py <= lowY) return 'wick';
    // Body
    if (px >= bx && px <= bx + w && py >= bodyTop && py <= bodyBottom) return 'body';
    return null;
  }

  // Bar 1: Green #10b981
  const b1 = isInsideCandle(145, 34, 180, 360, 230, 320);
  if (b1) return [16, 185, 129, 255];

  // Bar 2: Red #ef4444
  const b2 = isInsideCandle(195, 34, 150, 340, 180, 270);
  if (b2) return [239, 68, 68, 255];

  // Bar 3: Green #10b981
  const b3 = isInsideCandle(245, 34, 120, 310, 150, 250);
  if (b3) return [16, 185, 129, 255];

  // Bar 4: Electric Blue #2962ff
  const b4 = isInsideCandle(295, 34, 90, 270, 110, 210);
  if (b4) return [41, 98, 255, 255];

  // Bar 5: Cyan/Green apex #00e5ff
  const b5 = isInsideCandle(345, 34, 70, 230, 80, 170);
  if (b5) return [0, 229, 255, 255];

  // Trendline glow ribbon running across tops
  // Points: (162, 230), (212, 180), (262, 150), (312, 110), (362, 80)
  if (px >= 140 && px <= 380) {
    // Linear approximation of spline curve
    let targetY = 230;
    if (px < 212) targetY = 230 - ((px - 162) / 50) * 50;
    else if (px < 262) targetY = 180 - ((px - 212) / 50) * 30;
    else if (px < 312) targetY = 150 - ((px - 262) / 50) * 40;
    else targetY = 110 - ((px - 312) / 50) * 30;

    const dy = Math.abs(py - targetY);
    if (dy <= 3) {
      return [41, 98, 255, 255]; // Vivid Blue trendline
    } else if (dy <= 7) {
      const glow = (7 - dy) / 4;
      return [
        Math.round(r * (1 - glow) + 41 * glow),
        Math.round(g * (1 - glow) + 98 * glow),
        Math.round(b * (1 - glow) + 255 * glow),
        255
      ];
    }
  }

  // "OTIVO" text bar at bottom of icon: y=380..420
  // Letter dots or text representation
  if (py >= 390 && py <= 412 && px >= 160 && px <= 352) {
    // O T I V O pattern
    return [220, 230, 250, 230];
  }

  return [r, g, b, a];
}

// Generate files
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

console.log('Generating PWA PNG icons...');

// 1. app.png (512x512)
const appPng = createPNG(512, 512, (x, y, w, h) => drawOtivoIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'app.png'), appPng);
console.log('Created public/app.png (512x512)');

// 2. pwa-192x192.png
const pwa192 = createPNG(192, 192, (x, y, w, h) => drawOtivoIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
console.log('Created public/pwa-192x192.png');

// 3. pwa-512x512.png
const pwa512 = createPNG(512, 512, (x, y, w, h) => drawOtivoIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
console.log('Created public/pwa-512x512.png');

// 4. pwa-maskable-512x512.png
const pwaMaskable = createPNG(512, 512, (x, y, w, h) => drawOtivoIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable);
console.log('Created public/pwa-maskable-512x512.png');

// 5. apple-touch-icon.png (180x180)
const appleIcon = createPNG(180, 180, (x, y, w, h) => drawOtivoIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
console.log('Created public/apple-touch-icon.png');

// 6. icon.svg
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="100%" stop-color="#18223c" />
    </linearGradient>
    <linearGradient id="blueLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2962ff" />
      <stop offset="100%" stop-color="#00e5ff" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)" />
  <circle cx="256" cy="256" r="200" fill="none" stroke="#2962ff" stroke-width="2" opacity="0.4" />
  
  <!-- Candlesticks -->
  <line x1="162" y1="180" x2="162" y2="360" stroke="#10b981" stroke-width="4" stroke-linecap="round"/>
  <rect x="145" y="230" width="34" height="90" rx="4" fill="#10b981" />

  <line x1="212" y1="150" x2="212" y2="340" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
  <rect x="195" y="180" width="34" height="90" rx="4" fill="#ef4444" />

  <line x1="262" y1="120" x2="262" y2="310" stroke="#10b981" stroke-width="4" stroke-linecap="round"/>
  <rect x="245" y="150" width="34" height="100" rx="4" fill="#10b981" />

  <line x1="312" y1="90" x2="312" y2="270" stroke="#2962ff" stroke-width="4" stroke-linecap="round"/>
  <rect x="295" y="110" width="34" height="100" rx="4" fill="#2962ff" />

  <line x1="362" y1="70" x2="362" y2="230" stroke="#00e5ff" stroke-width="4" stroke-linecap="round"/>
  <rect x="345" y="80" width="34" height="90" rx="4" fill="#00e5ff" />

  <!-- Spline Path -->
  <path d="M 140 240 Q 212 170 262 145 T 380 75" fill="none" stroke="url(#blueLine)" stroke-width="5" stroke-linecap="round" />
  
  <!-- OTIVO Brand Text -->
  <text x="256" y="415" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="8" text-anchor="middle">OTIVO</text>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSvg);
console.log('Created public/icon.svg');
