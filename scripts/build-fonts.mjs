// scripts/build-fonts.mjs
// ============================================================
//  يبني نسخ مصغّرة (subset) من خطوط الأيقونات — الأيقونات المستخدمة بس
//  - ينزّل المصادر الرسمية في scripts/.cache لو مش موجودة
//  - يفك ترميز الـ CSS escapes بشكل صحيح
//  - يطلع: vendor/* (خطوط woff2 صغيرة + CSS مفلتر)
//  التشغيل: node scripts/build-fonts.mjs
// ============================================================

import fs from 'fs';
import path from 'path';
import https from 'https';
import subsetFont from 'subset-font';

const ROOT = 'D:/my-web-html';
const CACHE = path.join(ROOT, 'scripts/.cache');

const SOURCES = [
    ['https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css', 'devicon.min.css'],
    ['https://cdn.jsdelivr.net/gh/devicons/devicon@latest/fonts/devicon.ttf', 'devicon.ttf'],
    ['https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css', 'bootstrap-icons.css'],
    ['https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/fonts/bootstrap-icons.woff2', 'bootstrap-icons.woff2']
];

function get(url, d) {
    d = d || 0;
    return new Promise((res, rej) => {
        if (d > 6) return rej(new Error('too many redirects'));
        https.get(url, r => {
            if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) return get(r.headers.location, d + 1).then(res, rej);
            if (r.statusCode !== 200) return rej(new Error('HTTP ' + r.statusCode + ' — ' + url));
            const chunks = [];
            r.on('data', c => chunks.push(c));
            r.on('end', () => res(Buffer.concat(chunks)));
        }).on('error', rej);
    });
}

fs.mkdirSync(CACHE, { recursive: true });
for (const [url, name] of SOURCES) {
    const dest = path.join(CACHE, name);
    if (!fs.existsSync(dest)) {
        console.log('downloading', name, '...');
        fs.writeFileSync(dest, await get(url));
    }
}

// ---------- فك ترميز CSS content (يدعم \f102 والأحرف المباشرة) ----------
function decodeCssContent(raw) {
    let out = '';
    let i = 0;
    while (i < raw.length) {
        if (raw[i] === '\\') {
            let j = i + 1, hex = '';
            while (j < raw.length && hex.length < 6 && /[0-9a-fA-F]/.test(raw[j])) { hex += raw[j]; j++; }
            if (hex) {
                out += String.fromCodePoint(parseInt(hex, 16));
                if (raw[j] === ' ') j++; // المسافة بعد الـ escape مجرد فاصل
                i = j;
                continue;
            }
            if (j < raw.length) { out += raw[j]; i = j + 1; continue; }
            i++;
            continue;
        }
        out += raw[i];
        i++;
    }
    return out;
}

// ---------- الأيقونات المستخدمة ----------
const iconsSrc = fs.readFileSync(path.join(ROOT, 'dashboard/core/icons.js'), 'utf8');
const data = JSON.parse(iconsSrc.slice(iconsSrc.indexOf('=') + 1).replace(/;\s*$/, ''));

const usedDev = new Set();
const usedBi = new Set();
data.groups.forEach(g => g.items.forEach(it => {
    if (it.c.startsWith('devicon-')) usedDev.add(it.c.replace(' colored', ''));
    if (it.c.startsWith('bi-')) usedBi.add(it.c);
}));

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', 'vendor', '.git', '.wrangler', 'assets', 'scripts'].includes(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(js|html)$/.test(entry.name)) {
            const text = fs.readFileSync(full, 'utf8');
            const re = /\bbi-[a-z0-9-]+/g;
            let m;
            while ((m = re.exec(text)) !== null) {
                const cls = m[0].replace(/-+$/, '');
                if (cls !== 'bi') usedBi.add(cls);
            }
        }
    }
}
walk(ROOT);

// أيقونات بتستخدم ديناميكياً في الكود (الأسهم بتتبني من متغيرات) — مش بتظهر كنص ثابت
['bi-arrow-left', 'bi-arrow-right'].forEach(c => usedBi.add(c));

console.log('used devicon:', usedDev.size, '| used bi:', usedBi.size);

// ---------- تحليل CSS ----------
function parseRules(css) {
    // ⚠️ مهم جداً: نشيل التعليقات الأول — من غيرها التعليق اللي قبل @font-face
    // بيتلزق بالـ selector وبيخلي فلتر @font-face يفشل (Bug حقيقي حصل)
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const rules = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(css)) !== null) rules.push({ selector: m[1].trim(), body: m[2].trim(), raw: m[0] });
    return rules;
}

const devCss = fs.readFileSync(path.join(CACHE, 'devicon.min.css'), 'utf8');
const devRules = parseRules(devCss);
const devContent = {};
const devColor = {};
for (const rule of devRules) {
    for (const sel of rule.selector.split(',')) {
        const s = sel.trim();
        let mm = s.match(/^\.(devicon-[a-z0-9-]+):before$/);
        if (mm && rule.body.includes('content:')) {
            const cm = rule.body.match(/content:\s*"([^"]*)"/);
            if (cm && cm[1]) devContent[mm[1]] = decodeCssContent(cm[1]);
        }
        mm = s.match(/^\.(devicon-[a-z0-9-]+)\.colored$/);
        if (mm && rule.body.includes('color:')) {
            const cm = rule.body.match(/color:\s*([^;]+)/);
            if (cm) devColor[mm[1]] = cm[1].trim();
        }
    }
}

const biCss = fs.readFileSync(path.join(CACHE, 'bootstrap-icons.css'), 'utf8');
const biRules = parseRules(biCss);
const biContent = {};
for (const rule of biRules) {
    for (const sel of rule.selector.split(',')) {
        const s = sel.trim();
        const mm = s.match(/^\.(bi-[a-z0-9-]+)::?before$/);
        if (mm && rule.body.includes('content:')) {
            const cm = rule.body.match(/content:\s*"([^"]*)"/);
            if (cm && cm[1]) biContent[mm[1]] = decodeCssContent(cm[1]);
        }
    }
}

const missingDev = [...usedDev].filter(c => !devContent[c]);
const missingBi = [...usedBi].filter(c => !biContent[c]);
console.log('missing devicon content:', missingDev.length, missingDev);
console.log('missing bi content:', missingBi.length, missingBi);

// ---------- القص ----------
function charsOf(map, classes) {
    const chars = new Set();
    for (const c of classes) {
        const v = map[c];
        if (v) for (const ch of v) chars.add(ch);
    }
    return [...chars].join('');
}

const devText = charsOf(devContent, usedDev);
const biText = charsOf(biContent, usedBi);
console.log('devicon glyphs:', [...devText].length, '| bi glyphs:', [...biText].length);

const devSubset = await subsetFont(fs.readFileSync(path.join(CACHE, 'devicon.ttf')), devText, { targetFormat: 'woff2' });
fs.writeFileSync(path.join(ROOT, 'vendor/devicon/fonts/devicon-subset-v2.woff2'), devSubset);

const biSubset = await subsetFont(fs.readFileSync(path.join(CACHE, 'bootstrap-icons.woff2')), biText, { targetFormat: 'woff2' });
fs.writeFileSync(path.join(ROOT, 'vendor/bootstrap-icons/fonts/bootstrap-icons-subset-v2.woff2'), biSubset);

console.log('devicon subset:', (devSubset.length / 1024).toFixed(1), 'KB | bi subset:', (biSubset.length / 1024).toFixed(1), 'KB');

// ---------- CSS المفلتر ----------
const cssEscape = ch => '\\' + ch.codePointAt(0).toString(16);

let devOut = '@font-face{font-family:"devicon";src:url("fonts/devicon-subset-v2.woff2") format("woff2");font-weight:normal;font-style:normal;font-display:block}\n';
// ⚠️ قواعد الأساس (زي [class^=devicon-] اللي بتحدد font-family) — ضرورية جداً
for (const rule of devRules) {
    if (rule.selector.startsWith('@font-face') || rule.raw.includes('@font-face')) continue;
    if (/\.devicon-/.test(rule.selector)) continue; // قواعد الأيقونات بتتكتب من الماب تحت
    devOut += rule.raw + '\n';
}
for (const cls of [...usedDev].sort()) {
    if (!devContent[cls]) continue;
    devOut += `.${cls}:before{content:"${cssEscape(devContent[cls])}"}\n`;
    if (devColor[cls]) devOut += `.${cls}.colored:before{color:${devColor[cls]}}\n`;
}
fs.writeFileSync(path.join(ROOT, 'vendor/devicon/devicon.min.css'), devOut);

let biOut = '@font-face{font-family:"bootstrap-icons";src:url("fonts/bootstrap-icons-subset-v2.woff2") format("woff2");font-weight:normal;font-style:normal;font-display:block}\n';
for (const rule of biRules) {
    if (rule.selector.startsWith('@font-face') || rule.raw.includes('@font-face')) continue;
    const iconSels = rule.selector.split(',').map(s => s.trim()).filter(s => /^\.bi-[a-z0-9-]+::?before$/.test(s));
    if (iconSels.length) {
        if (!iconSels.some(s => usedBi.has(s.replace(/::?before$/, '').replace(/^\./, '')))) continue;
    }
    biOut += rule.raw + '\n';
}
fs.writeFileSync(path.join(ROOT, 'vendor/bootstrap-icons/bootstrap-icons.css'), biOut);

// فحص أمان: لازم يبقى @font-face واحد بس في كل ملف (المصغّر)
for (const f of ['vendor/devicon/devicon.min.css', 'vendor/bootstrap-icons/bootstrap-icons.css']) {
    const css = fs.readFileSync(path.join(ROOT, f), 'utf8');
    const count = (css.match(/@font-face/g) || []).length;
    if (count !== 1) {
        console.error('ERROR: ' + f + ' contains ' + count + ' @font-face blocks (expected 1)');
        process.exit(1);
    }
}
console.log('font-face integrity check: OK (each css has exactly 1)');

console.log('devicon css:', (Buffer.byteLength(devOut) / 1024).toFixed(1), 'KB | bi css:', (Buffer.byteLength(biOut) / 1024).toFixed(1), 'KB');
console.log('DONE');
