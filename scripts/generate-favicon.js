const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function generateFavicon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const s = size / 512;

  // Paper background
  ctx.fillStyle = "#f4eee2";
  const radius = 96 * s;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // Center transform
  ctx.save();
  ctx.translate(size / 2, size / 2);

  // Ink brush J stroke
  ctx.strokeStyle = "rgba(26, 26, 26, 0.85)";
  ctx.lineWidth = 12 * s;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(-12 * s, -120 * s);
  ctx.bezierCurveTo(-8 * s, -100 * s, -6 * s, -80 * s, -6 * s, -60 * s);
  ctx.bezierCurveTo(-4 * s, -40 * s, -4 * s, -10 * s, -4 * s, 20 * s);
  ctx.bezierCurveTo(-4 * s, 50 * s, 0 * s, 80 * s, 10 * s, 100 * s);
  ctx.bezierCurveTo(20 * s, 115 * s, 35 * s, 120 * s, 45 * s, 115 * s);
  ctx.bezierCurveTo(55 * s, 105 * s, 50 * s, 90 * s, 30 * s, 75 * s);
  ctx.bezierCurveTo(18 * s, 73 * s, 10 * s, 78 * s, 10 * s, 80 * s);
  ctx.stroke();

  // Ink texture dots
  ctx.fillStyle = "rgba(26, 26, 26, 0.1)";
  ctx.beginPath();
  ctx.arc(-8 * s, -75 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(26, 26, 26, 0.08)";
  ctx.beginPath();
  ctx.arc(3 * s, 60 * s, 1.5 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(26, 26, 26, 0.06)";
  ctx.beginPath();
  ctx.arc(42 * s, 95 * s, 1 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  return canvas.toBuffer("image/png");
}

const publicDir = path.join(__dirname, "..", "public");

// Generate all sizes
const sizes = [
  { name: "favicon-192.png", size: 192 },
  { name: "favicon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon.ico", size: 32 },
];

for (const { name, size } of sizes) {
  const buffer = generateFavicon(size);
  fs.writeFileSync(path.join(publicDir, name), buffer);
  console.log(`Generated ${name} (${size}x${size})`);
}

console.log("Done!");
