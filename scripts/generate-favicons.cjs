const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// PNG generator
function createPNG(width, height, drawPixelFn) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;
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
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

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
  const crc = crc32(buf.slice(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

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
  const distFromCenter = Math.hypot(x - cx, y - cy);

  let inBounds = true;
  if (!isMaskable) {
    const cornerR = w * 0.22;
    const dx = Math.max(0, Math.abs(x - cx) - (w / 2 - cornerR));
    const dy = Math.max(0, Math.abs(y - cy) - (h / 2 - cornerR));
    if (Math.hypot(dx, dy) > cornerR) inBounds = false;
  }

  if (!inBounds) return [0, 0, 0, 0];

  const bgGrad = y / h;
  let r = Math.round(11 + bgGrad * 12);
  let g = Math.round(15 + bgGrad * 18);
  let b = Math.round(25 + bgGrad * 35);
  let a = 255;

  const ringRadius = w * (isMaskable ? 0.36 : 0.40);
  const ringDist = Math.abs(distFromCenter - ringRadius);
  if (ringDist < 6 * scale) {
    const ringAlpha = Math.max(0, 1 - ringDist / (6 * scale));
    r = Math.round(r * (1 - ringAlpha) + 41 * ringAlpha);
    g = Math.round(g * (1 - ringAlpha) + 98 * ringAlpha);
    b = Math.round(b * (1 - ringAlpha) + 255 * ringAlpha);
  }

  const px = x / scale;
  const py = y / scale;

  function isInsideCandle(bx, cw, highY, lowY, bodyTop, bodyBottom) {
    const wickX = bx + cw / 2;
    if (Math.abs(px - wickX) <= (w < 64 ? 3 : 2) && py >= highY && py <= lowY) return 'wick';
    if (px >= bx && px <= bx + cw && py >= bodyTop && py <= bodyBottom) return 'body';
    return null;
  }

  // Candles
  const b1 = isInsideCandle(145, 34, 180, 360, 230, 320);
  if (b1) return [16, 185, 129, 255];

  const b2 = isInsideCandle(195, 34, 150, 340, 180, 270);
  if (b2) return [239, 68, 68, 255];

  const b3 = isInsideCandle(245, 34, 120, 310, 150, 250);
  if (b3) return [16, 185, 129, 255];

  const b4 = isInsideCandle(295, 34, 90, 270, 110, 210);
  if (b4) return [41, 98, 255, 255];

  const b5 = isInsideCandle(345, 34, 70, 230, 80, 170);
  if (b5) return [0, 229, 255, 255];

  if (px >= 140 && px <= 380) {
    let targetY = 230;
    if (px < 212) targetY = 230 - ((px - 162) / 50) * 50;
    else if (px < 262) targetY = 180 - ((px - 212) / 50) * 30;
    else if (px < 312) targetY = 150 - ((px - 262) / 50) * 40;
    else targetY = 110 - ((px - 312) / 50) * 30;

    const dy = Math.abs(py - targetY);
    const lineThick = w < 64 ? 6 : 4;
    if (dy <= lineThick) {
      return [41, 98, 255, 255];
    }
  }

  if (w >= 128 && py >= 390 && py <= 412 && px >= 160 && px <= 352) {
    return [220, 230, 250, 230];
  }

  return [r, g, b, a];
}

// Build standard .ico with 32x32 & 16x16 PNG entries
function createIco(png32Buffer, png16Buffer) {
  const numImages = 2;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(numImages, 4); // count

  const dirEntrySize = 16;
  const dataOffset1 = 6 + (dirEntrySize * numImages);
  const dataOffset2 = dataOffset1 + png32Buffer.length;

  // Dir entry 1: 32x32
  const entry1 = Buffer.alloc(dirEntrySize);
  entry1[0] = 32; // width
  entry1[1] = 32; // height
  entry1[2] = 0;  // palette
  entry1[3] = 0;  // reserved
  entry1.writeUInt16LE(1, 4); // color planes
  entry1.writeUInt16LE(32, 6); // bpp
  entry1.writeUInt32LE(png32Buffer.length, 8);
  entry1.writeUInt32LE(dataOffset1, 12);

  // Dir entry 2: 16x16
  const entry2 = Buffer.alloc(dirEntrySize);
  entry2[0] = 16; // width
  entry2[1] = 16; // height
  entry2[2] = 0;  // palette
  entry2[3] = 0;  // reserved
  entry2.writeUInt16LE(1, 4); // color planes
  entry2.writeUInt16LE(32, 6); // bpp
  entry2.writeUInt32LE(png16Buffer.length, 8);
  entry2.writeUInt32LE(dataOffset2, 12);

  return Buffer.concat([header, entry1, entry2, png32Buffer, png16Buffer]);
}

const publicDir = path.join(__dirname, '..', 'public');

const png512 = createPNG(512, 512, (x, y, w, h) => drawOtivoIcon(x, y, w, h, false));
const png192 = createPNG(192, 192, (x, y, w, h) => drawOtivoIcon(x, y, w, h, false));
const png32 = createPNG(32, 32, (x, y, w, h) => drawOtivoIcon(x, y, w, h, false));
const png16 = createPNG(16, 16, (x, y, w, h) => drawOtivoIcon(x, y, w, h, false));
const pngMaskable = createPNG(512, 512, (x, y, w, h) => drawOtivoIcon(x, y, w, h, true));

fs.writeFileSync(path.join(publicDir, 'app.png'), png512);
fs.writeFileSync(path.join(publicDir, 'favicon.png'), png512);
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);
fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), png16);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png192);

const icoBuf = createIco(png32, png16);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);

console.log('Successfully generated all URL favicon and PWA icons, including favicon.ico!');
