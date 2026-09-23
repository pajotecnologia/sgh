import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Criar SVG vetor de alta resolução
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <!-- Background Rounded Rect -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" stroke="#334155" stroke-width="8" />
  
  <!-- Hospital Medical Cross -->
  <g filter="url(#glow)">
    <rect x="220" y="116" width="72" height="280" rx="24" fill="url(#crossGrad)" />
    <rect x="116" y="220" width="280" height="72" rx="24" fill="url(#crossGrad)" />
  </g>

  <!-- Heartbeat line in center -->
  <path d="M140 256 L200 256 L226 196 L256 316 L286 216 L312 256 L372 256" 
        fill="none" stroke="#ffffff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" />
        
  <!-- App Title text inside icon -->
  <text x="256" y="445" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="52" fill="#38bdf8" letter-spacing="4">SGH</text>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent, 'utf-8');

/**
 * Cria um PNG RGB válido sem bibliotecas externas
 */
function createPng(width, height) {
  // Cores: Slate escuro no fundo (#0f172a), cruz azul (#2563eb / #38bdf8) e linha branca
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // PNG filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Distância do centro normalizada [-1, 1]
      const nx = (x / width) * 2 - 1;
      const ny = (y / height) * 2 - 1;

      // Cantos arredondados (squircle)
      const distSquircle = Math.pow(Math.abs(nx), 4) + Math.pow(Math.abs(ny), 4);
      if (distSquircle > 0.95) {
        // Transparente / fora do ícone
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // Cruz médica
      const inVerticalBar = Math.abs(nx) < 0.16 && Math.abs(ny) < 0.60;
      const inHorizontalBar = Math.abs(ny) < 0.16 && Math.abs(nx) < 0.60;
      const inCross = inVerticalBar || inHorizontalBar;

      // Linha de batimento cardíaco
      const isHeartbeat = Math.abs(ny) < 0.04 && Math.abs(nx) < 0.50;

      if (isHeartbeat) {
        rawData[pxOffset] = 255;
        rawData[pxOffset + 1] = 255;
        rawData[pxOffset + 2] = 255;
        rawData[pxOffset + 3] = 255;
      } else if (inCross) {
        rawData[pxOffset] = 37;
        rawData[pxOffset + 1] = 99;
        rawData[pxOffset + 2] = 235;
        rawData[pxOffset + 3] = 255;
      } else {
        // Background gradiente suave
        const bgGrad = Math.floor(15 + (1 - ny) * 8);
        rawData[pxOffset] = bgGrad;
        rawData[pxOffset + 1] = bgGrad + 8;
        rawData[pxOffset + 2] = bgGrad + 24;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  function createChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);

    // CRC32
    let crc = 0xffffffff;
    for (let i = 4; i < 8 + len; i++) {
      const byte = buf[i];
      crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    buf.writeInt32BE((crc ^ 0xffffffff) | 0, 8 + len);
    return buf;
  }

  const crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Gera 192x192, 512x512 e apple-touch-icon
const png192 = createPng(192, 192);
const png512 = createPng(512, 512);

fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), png192);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), png512);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), png192);
fs.writeFileSync(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'), png192);

console.log('✅ Ícones PWA gerados com sucesso em public/icons/!');
