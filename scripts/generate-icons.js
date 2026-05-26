const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#020502';
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2, cy = size / 2;
  const r = size * 0.35;

  // Outer ring (cyan)
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = size * 0.06;
  ctx.shadowBlur = size * 0.15;
  ctx.shadowColor = '#38bdf8';
  ctx.stroke();

  // Inner ring (amber)
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = size * 0.04;
  ctx.shadowBlur = size * 0.1;
  ctx.shadowColor = '#f59e0b';
  ctx.stroke();

  // Core dot
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = size * 0.2;
  ctx.shadowColor = '#ffffff';
  ctx.fill();

  // T letter
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.25}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('T', cx, cy + 2);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outDir, filename), buf);
  console.log(`✓ ${filename} (${size}x${size})`);
}

function generateMaskable(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#020502';
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2, cy = size / 2;
  const safe = 0.8;
  const r = size * 0.35 * safe;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = size * 0.05;
  ctx.shadowBlur = size * 0.15;
  ctx.shadowColor = '#38bdf8';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = size * 0.04;
  ctx.shadowBlur = size * 0.1;
  ctx.shadowColor = '#f59e0b';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.05, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = size * 0.2;
  ctx.shadowColor = '#ffffff';
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.2}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('T', cx, cy + 1);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outDir, `icon-${size}-maskable.png`), buf);
  console.log(`✓ icon-${size}-maskable.png (${size}x${size}) maskable`);
}

generateIcon(192, 'icon-192.png');
generateIcon(512, 'icon-512.png');
generateMaskable(512);
