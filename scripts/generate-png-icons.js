import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      if ((crc ^ byte) & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
      byte = byte >>> 1;
    }
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function generatePng(width, height, isMaskable = false) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter byte (0) per row
  const raw = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.44;

  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background gradient (Violet #8B5CF6 to Emerald #10B981)
      const gradRatio = (x + y) / (width + height);
      let r = Math.round(139 * (1 - gradRatio) + 16 * gradRatio);
      let g = Math.round(92 * (1 - gradRatio) + 185 * gradRatio);
      let b = Math.round(246 * (1 - gradRatio) + 129 * gradRatio);
      let a = 255;

      // Sprout plant leaf / emblem in center
      // Center stem:
      const stemDist = Math.abs(dx);
      if (stemDist < width * 0.035 && dy > -height * 0.25 && dy < height * 0.25) {
        r = 255; g = 255; b = 255; a = 255;
      }

      // Right leaf:
      const rightLeafDx = dx - width * 0.12;
      const rightLeafDy = dy + height * 0.05;
      if (rightLeafDx > 0 && Math.sqrt(rightLeafDx * rightLeafDx * 1.5 + rightLeafDy * rightLeafDy * 2) < width * 0.18) {
        r = 52; g = 211; b = 153; a = 255; // #34D399
      }

      // Left leaf:
      const leftLeafDx = dx + width * 0.12;
      const leftLeafDy = dy - height * 0.03;
      if (leftLeafDx < 0 && Math.sqrt(leftLeafDx * leftLeafDx * 1.5 + leftLeafDy * leftLeafDy * 2) < width * 0.16) {
        r = 110; g = 231; b = 183; a = 255; // #6EE7B7
      }

      // Top heart / bloom:
      const heartDx = dx;
      const heartDy = dy + height * 0.24;
      if (Math.sqrt(heartDx * heartDx + heartDy * heartDy) < width * 0.1) {
        r = 244; g = 114; b = 182; a = 255; // #F472B6
      }

      // Rounded mask if not maskable
      if (!isMaskable) {
        // Squircle/rounded rect corner check
        const cornerRadius = width * 0.22;
        const qx = Math.max(0, Math.abs(dx) - (cx - cornerRadius));
        const qy = Math.max(0, Math.abs(dy) - (cy - cornerRadius));
        if (qx > 0 && qy > 0 && Math.sqrt(qx * qx + qy * qy) > cornerRadius) {
          a = 0;
          r = 0; g = 0; b = 0;
        }
      }

      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(raw);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePng(180, 180, false));

console.log('PNG Icons successfully generated in /public!');
