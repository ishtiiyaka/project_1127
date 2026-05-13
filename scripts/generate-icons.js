// Generates public/icon-192.png and public/icon-512.png
// Run: node scripts/generate-icons.js
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  // Green border
  const bw = Math.max(2, size * 0.03);
  ctx.strokeStyle = '#00ff41';
  ctx.lineWidth = bw;
  ctx.strokeRect(bw / 2, bw / 2, size - bw, size - bw);

  // Inner glow border
  ctx.strokeStyle = 'rgba(0,255,65,0.3)';
  ctx.lineWidth = bw * 2;
  ctx.strokeRect(bw * 2, bw * 2, size - bw * 4, size - bw * 4);

  // "1127" text
  const fontSize = size * 0.28;
  ctx.fillStyle = '#00ff41';
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#00ff41';
  ctx.shadowBlur = size * 0.05;
  ctx.fillText('1127', size / 2, size * 0.44);

  // Sub text
  const subSize = size * 0.09;
  ctx.font = `${subSize}px monospace`;
  ctx.fillStyle = 'rgba(0,255,65,0.6)';
  ctx.shadowBlur = 0;
  ctx.fillText('PROJECT', size / 2, size * 0.68);

  return canvas.toBuffer('image/png');
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), generateIcon(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), generateIcon(512));
console.log('Icons generated: public/icon-192.png, public/icon-512.png');
