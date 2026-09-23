// scripts/build-logo.mjs
// ============================================================
//  شعار Mostafa Sholkamy — نسخة نهائية
//  * الشعار: حلقة ذهبية + خلفية بيضا + مونوجرام MS + ورقة ذهبية
//    بتتداخل مع الحروف + SHOLKAMY
//  * الإصدارات: SVG شفاف + PNG شفاف + أيقونات بخلفية بيضا
//
//  الاستخدام: node scripts/build-logo.mjs
// ============================================================

import fs from 'fs';
import { Resvg } from '@resvg/resvg-js';

const OUT = 'D:/my-web-html/assets';

// ---------- جسم الشعار ----------
// background: 'transparent' (شفاف) أو 'white' (أبيض)
// scalePct: لو محتاج تصغير المحتوى جوه المساحة الآمنة (للماسكابل)
function badgeSvg(background, scalePct) {
    const bgRect = background === 'white'
        ? '<rect width="512" height="512" fill="#ffffff"/>'
        : '';
    const wrapOpen = scalePct
        ? '<g transform="translate(256 256) scale(' + scalePct + ') translate(-256 -256)">'
        : '<g>';

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f9e7ae"/>
      <stop offset="0.3" stop-color="#e8c766"/>
      <stop offset="0.6" stop-color="#c09428"/>
      <stop offset="1" stop-color="#f4d97f"/>
    </linearGradient>
    <linearGradient id="goldRing2" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#c99f31"/>
      <stop offset="0.55" stop-color="#f3dc8d"/>
      <stop offset="1" stop-color="#b98f22"/>
    </linearGradient>
    <radialGradient id="inner" cx="50%" cy="40%" r="75%">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.72" stop-color="#fbfcfe"/>
      <stop offset="1" stop-color="#eef1f6"/>
    </radialGradient>
    <linearGradient id="msBlue" x1="0" y1="0" x2="1" y2="0.35">
      <stop offset="0" stop-color="#132c55"/>
      <stop offset="0.5" stop-color="#1d4c92"/>
      <stop offset="1" stop-color="#3f8ad8"/>
    </linearGradient>
    <linearGradient id="leafGold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fbeaa9"/>
      <stop offset="0.45" stop-color="#e0b947"/>
      <stop offset="1" stop-color="#f8e39c"/>
    </linearGradient>
    <filter id="softShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#0a2c55" flood-opacity="0.28"/>
    </filter>
    <filter id="leafShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="3" dy="6" stdDeviation="5" flood-color="#5c430a" flood-opacity="0.35"/>
    </filter>
  </defs>

  ${bgRect}
  ${wrapOpen}

  <!-- الحلقات: إطار فضي خارجي + ذهبي + خط كحلي + قلب أبيض -->
  <circle cx="256" cy="256" r="240" fill="#e7eaf0"/>
  <circle cx="256" cy="256" r="233" fill="url(#gold)"/>
  <circle cx="256" cy="256" r="220" fill="url(#goldRing2)"/>
  <circle cx="256" cy="256" r="216" fill="#1d3f74"/>
  <circle cx="256" cy="256" r="210" fill="url(#inner)"/>

  <!-- مونوجرام MS -->
  <text x="256" y="330" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="205" font-weight="700" letter-spacing="-16"
        fill="url(#msBlue)" stroke="#ffffff" stroke-width="5"
        paint-order="stroke fill"
        filter="url(#softShadow)">MS</text>

  <!-- اسم العائلة -->
  <text x="256" y="408" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="44" font-weight="700" letter-spacing="8"
        fill="#1d4f96">SHOLKAMY</text>

  <!-- الورقة الذهبية — بتتداخل مع قمة الحروف زي الختم الكلاسيكي -->
  <g fill="url(#leafGold)" stroke="#a07c1c" stroke-width="1.6" filter="url(#leafShadow)">
    <path d="M138 216
             C 176 130, 296 84, 384 116
             C 322 118, 232 140, 178 200
             C 162 218, 148 222, 138 216 Z"/>
    <path d="M172 228
             C 208 174, 282 144, 336 150
             C 288 162, 224 188, 186 240
             C 177 245, 168 238, 172 228 Z"/>
    <path d="M382 117
             C 400 102, 414 98, 426 102
             C 412 108, 398 118, 388 132
             C 385 126, 383 121, 382 117 Z"/>
  </g>

  </g>
</svg>`;
}

// ---------- تحويل لأي مقاس ----------
function render(svg, size) {
    const resvg = new Resvg(svg, {
        fitTo: { mode: 'width', value: size },
        font: { loadSystemFonts: true, defaultFontFamily: 'Georgia' }
    });
    return resvg.render().asPng();
}

// نسخة الماسكابل: خلفية بيضا كاملة + الشعار جوه المنطقة الآمنة (78%)
function maskableSvg() {
    return badgeSvg('white', 0.78);
}

// ============================================================
//  المخرجات
// ============================================================

const transparent = badgeSvg('transparent');
const white = badgeSvg('white');

// الشعار الرئيسي (شفاف)
fs.writeFileSync(OUT + '/logo.svg', transparent);

const files = [
    // الشعار PNG شفاف بجودة عالية (لاستخدامه في أي مكان)
    ['logo.png', render(transparent, 800)],
    // الأيقونات
    ['favicon.svg', transparent],
    ['favicon-32.png', render(transparent, 32)],
    ['apple-touch-icon.png', render(white, 180)],
    ['icon-192.png', render(white, 192)],
    ['icon-512.png', render(white, 512)],
    ['icon-maskable-512.png', render(maskableSvg(), 512)]
];

for (const [name, data] of files) {
    fs.writeFileSync(OUT + '/' + name, data);
    console.log(name + ' -> ' + (typeof data === 'string' ? data.length + ' bytes' : Math.round(data.length / 1024) + ' KB'));
}
console.log('DONE');
