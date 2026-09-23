#!/usr/bin/env node
// scripts/deploy.js
// ============================================================
//  نشر آمن للـ Pages:
//  1) ينسخ الملفات العامة فقط إلى dist/ (مجلد نظيف)
//  2) يفحص أمنياً إن مفيش أي ملف تطوير اتسرب
//  3) ينشر dist/ على Cloudflare Pages
//
//  الاستخدام:  npm run deploy   (أو node scripts/deploy.js)
// ============================================================

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PROJECT = 'portfolio';

// الملفات/المجلدات العامة الوحيدة اللي بيتنشروا (أي حاجة غيرها ملهاش دعوة)
const PUBLIC = [
    'index.html',
    '404.html',
    'post.html',
    'blog',
    'css',
    'js',
    'sections',
    'vendor',
    'assets',
    'dashboard',
    'functions',       // لازم تتنشر عشان الـ API
    '_headers',        // ترويسات الأمان
    'robots.txt',
    'sitemap.xml'
];

// لو أي حاجة من دول ظهرت في dist → نوقف فوراً (فشل أمني)
const FORBIDDEN = [
    'wrangler.toml',
    'package.json',
    'package-lock.json',
    'db',
    'scripts',
    'node_modules',
    'README.md',
    '.git',
    '.wrangler',
    '.env',
    'Your-Portfolio'
];

function copy(src, dest) {
    const st = fs.statSync(src);
    if (st.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src)) {
            copy(path.join(src, entry), path.join(dest, entry));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

// 1) staging نظيف
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

let copied = 0;
for (const item of PUBLIC) {
    const src = path.join(ROOT, item);
    if (!fs.existsSync(src)) {
        console.warn('  skip (not found): ' + item);
        continue;
    }
    copy(src, path.join(DIST, item));
    copied++;
}
console.log('Staged ' + copied + ' entries -> dist/');

// 2) فحص أمني
const leaked = FORBIDDEN.filter(function (f) { return fs.existsSync(path.join(DIST, f)); });
if (leaked.length) {
    console.error('SECURITY ABORT — forbidden files found in dist/: ' + leaked.join(', '));
    process.exit(1);
}
if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('ABORT — dist/index.html missing');
    process.exit(1);
}
if (!fs.existsSync(path.join(DIST, 'functions', 'api', '[[route]].js'))) {
    console.error('ABORT — functions/api/[[route]].js missing (API will break)');
    process.exit(1);
}
console.log('Security check: clean ✓');

// 3) النشر
const args = ['wrangler', 'pages', 'deploy', 'dist',
    '--project-name', PROJECT,
    '--branch', 'main',
    '--commit-dirty=true'];

console.log('$ npx ' + args.join(' '));
const res = spawnSync('npx', args, { cwd: ROOT, stdio: 'inherit', shell: true });
process.exit(res.status === null ? 1 : res.status);
