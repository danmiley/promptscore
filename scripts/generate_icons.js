/**
 * Generate minimal valid PNG icons for Chrome extension.
 * Creates an elegant indigo/violet gem square with rounded corners.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const iconsDir = path.join(__dirname, '..', 'extension', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

// Minimal SVG of PromptScore icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#d946ef"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="#141724"/>
  <rect x="4" y="4" width="120" height="120" rx="24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
  <path d="M 64 22 L 76 52 L 106 64 L 76 76 L 64 106 L 52 76 L 22 64 L 52 52 Z" fill="url(#grad)"/>
  <circle cx="64" cy="64" r="6" fill="#ffffff"/>
</svg>`;

const svgPath = path.join(iconsDir, 'icon.svg');
fs.writeFileSync(svgPath, svg, 'utf-8');

// Also create fallback 16x16, 48x48, 128x128 PNGs using python or sips (macOS built-in)
try {
  execSync(`qlmanage -t -s 128 -o "${iconsDir}" "${svgPath}" 2>/dev/null || true`);
  const qlOutput = path.join(iconsDir, 'icon.svg.png');
  if (fs.existsSync(qlOutput)) {
    execSync(`sips -z 128 128 "${qlOutput}" --out "${path.join(iconsDir, 'icon128.png')}"`);
    execSync(`sips -z 48 48 "${qlOutput}" --out "${path.join(iconsDir, 'icon48.png')}"`);
    execSync(`sips -z 16 16 "${qlOutput}" --out "${path.join(iconsDir, 'icon16.png')}"`);
    fs.unlinkSync(qlOutput);
  }
} catch (e) {
  console.log('sips conversion notice:', e.message);
}

// Fallback: If PNGs not created yet, generate a 1x1 base64 transparent PNG
const minimalPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

for (const size of [16, 48, 128]) {
  const p = path.join(iconsDir, `icon${size}.png`);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, minimalPng);
  }
}

console.log('Icons generated in extension/icons/');
