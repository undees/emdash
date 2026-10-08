import sharp from 'sharp';

const GREEN_500 = '#377d51';
const GREEN_600 = '#2f7049';

/**
 * SVG path for a superellipse ("squircle") filling the box at (x, y) with side `size`.
 * |x/a|^n + |y/a|^n = 1, sampled finely enough to look smooth at any icon size.
 */
export function squirclePath(size, x = 0, y = 0, n = 5, steps = 128) {
  const a = size / 2;
  const cx = x + a;
  const cy = y + a;
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const px = cx + a * Math.sign(c) * Math.abs(c) ** (2 / n);
    const py = cy + a * Math.sign(s) * Math.abs(s) ** (2 / n);
    pts.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** White rounded bar — the em dash — centred in a box of side `size`. */
function dash(size, x = 0, y = 0) {
  const w = size * 0.56;
  const h = size * 0.09;
  return `<rect x="${x + (size - w) / 2}" y="${y + (size - h) / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="white"/>`;
}

// iOS (apple-touch-icon) and Android (maskable) apply their own corner mask,
// so those get a full-bleed square; everything else gets the squircle.
const SIZES = [
  { file: 'apple-touch-icon.png', size: 180, fullBleed: true },
  { file: 'icon-192.png',         size: 192, fullBleed: false },
  { file: 'icon-512.png',         size: 512, fullBleed: true },
];

function makeSvg(size, fullBleed) {
  const bg = fullBleed
    ? `<rect width="${size}" height="${size}" fill="${GREEN_500}"/>`
    : `<path d="${squirclePath(size)}" fill="${GREEN_500}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  ${bg}
  ${dash(size)}
</svg>`;
}

if (import.meta.main) {
  for (const { file, size, fullBleed } of SIZES) {
    await sharp(Buffer.from(makeSvg(size, fullBleed)))
      .png()
      .toFile(`public/${file}`);
    console.log(`Generated public/${file} (${size}×${size})`);
  }

  // OG image — 1200×1200 square
  // iMessage shows the full square; platforms like Slack/Facebook crop to ~1200×630.
  // Title and description are rendered natively by each platform from og:title /
  // og:description — no need to bake text into the image.
  const OG = 1200;
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${OG} ${OG}" width="${OG}" height="${OG}">
  <rect width="${OG}" height="${OG}" fill="${GREEN_500}"/>
  <path d="${squirclePath(800, 200, 200)}" fill="${GREEN_600}"/>
  ${dash(800, 200, 200)}
</svg>`;

  await sharp(Buffer.from(ogSvg)).png().toFile('public/og-image.png');
  console.log(`Generated public/og-image.png (${OG}×${OG})`);

  // The favicon in public/index.html inlines the same squircle at viewBox 100:
  console.log(`Favicon squircle path (viewBox 100, n=5, 32 steps):\n${squirclePath(100, 0, 0, 5, 32)}`);
}
