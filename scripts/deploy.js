#!/usr/bin/env node
// scripts/deploy.js
// ============================================================
//  Safe deploy to Cloudflare Pages.
//
//  1. Stages only the public files into a clean dist/ folder.
//  2. Runs a security check: if any development file leaked into
//     dist/, the deploy is aborted before anything is published.
//  3. Deploys dist/ with Wrangler.
//
//  Usage:
//    node scripts/deploy.js            # stage, check, deploy
//    node scripts/deploy.js --check    # stage + check only (used by CI)
//    node scripts/deploy.js --project my-pages-project
// ============================================================

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const argv = process.argv.slice(2);
const CHECK_ONLY = argv.includes('--check');

// Files and folders that are safe to publish. Anything not listed here
// never reaches the public site.
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
    'functions',       // required: this is the API
    '_headers',        // security headers
    'robots.txt',
    'sitemap.xml'
];

// If any of these appear in dist/, the deploy is aborted. A misconfigured
// static host will happily serve your source files, so this is the last
// line of defence.
const FORBIDDEN = [
    'wrangler.toml',
    'package.json',
    'package-lock.json',
    'db',
    'scripts',
    'node_modules',
    'README.md',
    'CONTRIBUTING.md',
    'CUSTOMIZE.md',
    'LICENSE',
    '.git',
    '.github',
    '.wrangler',
    '.env',
    '.dev.vars'
];

/** Reads `name = "..."` from wrangler.toml so the project name stays in sync. */
function projectName() {
    const argIndex = argv.indexOf('--project');
    if (argIndex !== -1 && argv[argIndex + 1]) return argv[argIndex + 1];

    try {
        const toml = fs.readFileSync(path.join(ROOT, 'wrangler.toml'), 'utf8');
        const match = toml.match(/^\s*name\s*=\s*["']([^"']+)["']/m);
        if (match) return match[1];
    } catch (err) {
        // fall through to the default
    }
    return 'portfolio';
}

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

// 1) Clean staging
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

// 2) Security check
const leaked = FORBIDDEN.filter(function (f) { return fs.existsSync(path.join(DIST, f)); });
if (leaked.length) {
    console.error('SECURITY ABORT — forbidden files found in dist/: ' + leaked.join(', '));
    process.exit(1);
}
if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('ABORT — dist/index.html is missing');
    process.exit(1);
}
if (!fs.existsSync(path.join(DIST, 'functions', 'api', '[[route]].js'))) {
    console.error('ABORT — functions/api/[[route]].js is missing (the API would break)');
    process.exit(1);
}
console.log('Security check: clean');

if (CHECK_ONLY) {
    console.log('--check passed — skipping deploy.');
    process.exit(0);
}

// 3) Deploy
const args = ['wrangler', 'pages', 'deploy', 'dist',
    '--project-name', projectName(),
    '--branch', 'main',
    '--commit-dirty=true'];

console.log('$ npx ' + args.join(' '));
const res = spawnSync('npx', args, { cwd: ROOT, stdio: 'inherit', shell: true });
process.exit(res.status === null ? 1 : res.status);
