// Generates dashboard/core/icons.js
// Fetches the real devicon + bootstrap-icons CSS from CDN and only emits
// icon classes that actually exist. Reports anything missing.

const fs = require('fs');
const https = require('https');

function get(url, depth) {
    depth = depth || 0;
    return new Promise((resolve, reject) => {
        if (depth > 5) return reject(new Error('too many redirects'));
        https.get(url, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return get(res.headers.location, depth + 1).then(resolve, reject);
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

const VARIANT_ORDER = ['original', 'plain', 'original-wordmark', 'plain-wordmark', 'line', 'line-wordmark'];

const DEVICON_GROUPS = [
    {
        key: 'languages', label: 'Languages', entries: [
            ['JavaScript', 'javascript'], ['TypeScript', 'typescript'], ['Python', 'python'], ['Java', 'java'],
            ['C', 'c'], ['C++', 'cplusplus'], ['C#', 'csharp'], ['PHP', 'php'], ['Ruby', 'ruby'],
            ['Go', 'go'], ['Rust', 'rust'], ['Swift', 'swift'], ['Kotlin', 'kotlin'], ['Dart', 'dart'],
            ['HTML5', 'html5'], ['CSS3', 'css3'], ['Sass', 'sass'], ['Bash', 'bash'], ['Markdown', 'markdown'],
            ['Scala', 'scala'], ['Lua', 'lua'], ['Perl', 'perl'], ['Haskell', 'haskell'], ['Elixir', 'elixir'],
            ['Objective-C', 'objectivec'], ['Clojure', 'clojure'], ['Erlang', 'erlang'], ['Fortran', 'fortran'],
            ['Crystal', 'crystal'], ['Nim', 'nim'], ['Zig', 'zig'], ['Groovy', 'groovy']
        ]
    },
    {
        key: 'frontend', label: 'Frontend', entries: [
            ['React', 'react'], ['Vue.js', 'vuejs'], ['Angular', 'angular'], ['Svelte', 'svelte'], ['Next.js', 'nextjs'],
            ['Nuxt.js', 'nuxtjs'], ['jQuery', 'jquery'], ['Bootstrap', 'bootstrap'], ['Tailwind CSS', 'tailwindcss'],
            ['Redux', 'redux'], ['Three.js', 'threejs'], ['Electron', 'electron'], ['Vite', 'vitejs'],
            ['Webpack', 'webpack'], ['Babel', 'babel'], ['Alpine.js', 'alpinejs'], ['Ember', 'ember'],
            ['Backbone.js', 'backbonejs'], ['Knockout', 'knockout'], ['Material UI', 'materialui'],
            ['Storybook', 'storybook'], ['Astro', 'astro'], ['Qwik', 'qwik'], ['Solid.js', 'solidjs']
        ]
    },
    {
        key: 'backend', label: 'Backend', entries: [
            ['Node.js', 'nodejs'], ['Express', 'express'], ['NestJS', 'nestjs'], ['Django', 'django'], ['Flask', 'flask'],
            ['FastAPI', 'fastapi'], ['Spring', 'spring'], ['.NET', ['dot-net', 'dotnetcore']], ['Laravel', 'laravel'],
            ['Ruby on Rails', 'rails'], ['Symfony', 'symfony'], ['CodeIgniter', 'codeigniter'], ['CakePHP', 'cakephp'],
            ['Phoenix', 'phoenix'], ['GraphQL', 'graphql'], ['Apollo', 'apollographql'], ['Socket.io', 'socketio'],
            ['Deno', 'denojs'], ['Bun', 'bun'], ['Ktor', 'ktor'], ['Quarkus', 'quarkus'], ['OpenAPI', 'openapi']
        ]
    },
    {
        key: 'databases', label: 'Databases', entries: [
            ['MySQL', 'mysql'], ['PostgreSQL', 'postgresql'], ['MongoDB', 'mongodb'], ['Redis', 'redis'],
            ['SQLite', 'sqlite'], ['Firebase', 'firebase'], ['SQL Server', 'microsoftsqlserver'], ['Oracle', 'oracle'],
            ['MariaDB', 'mariadb'], ['Cassandra', 'cassandra'], ['Elasticsearch', 'elasticsearch'],
            ['Neo4j', 'neo4j'], ['DynamoDB', 'dynamodb'], ['CouchDB', 'couchdb'], ['Supabase', 'supabase']
        ]
    },
    {
        key: 'mobile', label: 'Mobile', entries: [
            ['Flutter', 'flutter'], ['Android', 'android'], ['Apple', 'apple'], ['React Native', 'react'],
            ['Ionic', 'ionic'], ['Kotlin', 'kotlin'], ['Swift', 'swift'], ['Xamarin', 'xamarin'], ['Ionic', 'ionic']
        ]
    },
    {
        key: 'tools', label: 'Tools & IDEs', entries: [
            ['Git', 'git'], ['GitHub', 'github'], ['GitLab', 'gitlab'], ['Bitbucket', 'bitbucket'],
            ['Docker', 'docker'], ['Kubernetes', 'kubernetes'], ['VS Code', 'vscode'], ['Visual Studio', 'visualstudio'],
            ['IntelliJ IDEA', 'intellij'], ['PyCharm', 'pycharm'], ['WebStorm', 'webstorm'], ['PhpStorm', 'phpstorm'],
            ['Vim', 'vim'], ['Neovim', 'neovim'], ['Atom', 'atom'],
            ['Postman', 'postman'], ['Insomnia', 'insomnia'], ['npm', 'npm'], ['Yarn', 'yarn'],
            ['Gulp', 'gulp'], ['Grunt', 'grunt'], ['Gradle', 'gradle'], ['Maven', 'maven'], ['CMake', 'cmake'],
            ['Linux', 'linux'], ['Ubuntu', 'ubuntu'], ['Debian', 'debian'], ['Windows 8', 'windows8'],
            ['Jira', 'jira'], ['Trello', 'trello'], ['Slack', 'slack'], ['JetBrains', 'jetbrains'],
            ['Jest', 'jest'], ['Mocha', 'mocha'], ['Cypress', 'cypressio'], ['Selenium', 'selenium'],
            ['Jasmine', 'jasmine'], ['Karma', 'karma'], ['Pytest', 'pytest'], ['Raspberry Pi', 'raspberrypi'],
            ['Arduino', 'arduino']
        ]
    },
    {
        key: 'cloud', label: 'Cloud & DevOps', entries: [
            ['AWS', 'amazonwebservices'], ['Azure', 'azure'], ['Google Cloud', 'googlecloud'],
            ['Heroku', 'heroku'], ['DigitalOcean', 'digitalocean'], ['Cloudflare', 'cloudflare'],
            ['Netlify', 'netlify'], ['Vercel', 'vercel'], ['Firebase', 'firebase'], ['OpenStack', 'openstack'],
            ['Terraform', 'terraform'], ['Ansible', 'ansible'], ['Nginx', 'nginx'], ['Apache', 'apache']
        ]
    },
    {
        key: 'design', label: 'Design & Office', entries: [
            ['Figma', 'figma'], ['Photoshop', 'photoshop'], ['Illustrator', 'illustrator'], ['XD', 'xd'],
            ['Blender', 'blender'], ['GIMP', 'gimp'], ['Inkscape', 'inkscape'], ['Canva', 'canva'],
            ['Premiere Pro', 'premierepro'], ['After Effects', 'aftereffects'], ['WordPress', 'wordpress'],
            ['WooCommerce', 'woocommerce'], ['Magento', 'magento'], ['Drupal', 'drupal']
        ]
    }
];

const SOCIAL_ENTRIES = [
    ['GitHub', 'github'], ['GitLab', 'gitlab'], ['LinkedIn', 'linkedin'], ['Twitter / X', 'twitter'],
    ['Facebook', 'facebook'], ['Instagram', 'instagram'], ['Discord', 'discord'], ['Slack', 'slack'],
    ['Skype', 'skype'], ['Telegram', ['telegram']], ['Stack Overflow', 'stackoverflow'],
    ['Dev.to', 'devto'], ['Medium', 'medium'], ['Reddit', 'reddit'], ['TikTok', 'tiktok'],
    ['Twitch', 'twitch'], ['YouTube', 'youtube'], ['WhatsApp', ['whatsapp']], ['Mastodon', 'mastodon'],
    ['Behance', 'behance'], ['Dribbble', 'dribbble'], ['Vimeo', 'vimeo'], ['WordPress', 'wordpress']
];

// bootstrap icons for soft skills (verified against the real CSS)
const SOFT_BI = [
    ['Lightbulb', 'bi-lightbulb'], ['Lightbulb Fill', 'bi-lightbulb-fill'],
    ['People', 'bi-people'], ['People Fill', 'bi-people-fill'], ['Person Check', 'bi-person-check'],
    ['Chat Dots', 'bi-chat-dots'], ['Chat Heart', 'bi-chat-heart'], ['Chat Square Quote', 'bi-chat-square-quote'],
    ['Clock', 'bi-clock'], ['Clock History', 'bi-clock-history'], ['Calendar Check', 'bi-calendar-check'],
    ['Check Circle', 'bi-check2-circle'], ['Check All', 'bi-check2-all'], ['Check Square', 'bi-check-square'],
    ['Graph Up', 'bi-graph-up-arrow'], ['Bar Chart', 'bi-bar-chart'], ['Bar Chart Line', 'bi-bar-chart-line'],
    ['Pie Chart', 'bi-pie-chart'], ['Diagram 3', 'bi-diagram-3'], ['Bullseye', 'bi-bullseye'],
    ['Gear', 'bi-gear'], ['Gear Wide', 'bi-gear-wide-connected'], ['Tools', 'bi-tools'],
    ['Puzzle', 'bi-puzzle'], ['Puzzle Fill', 'bi-puzzle-fill'],
    ['Thumbs Up', 'bi-hand-thumbs-up'], ['Thumbs Up Fill', 'bi-hand-thumbs-up-fill'],
    ['Award', 'bi-award'], ['Award Fill', 'bi-award-fill'], ['Trophy', 'bi-trophy'], ['Trophy Fill', 'bi-trophy-fill'],
    ['Star', 'bi-star'], ['Star Fill', 'bi-star-fill'], ['Stars', 'bi-stars'],
    ['Shield Check', 'bi-shield-check'], ['Shield Fill Check', 'bi-shield-fill-check'],
    ['Search', 'bi-search'], ['Pencil Square', 'bi-pencil-square'], ['Journal Text', 'bi-journal-text'],
    ['Translate', 'bi-translate'], ['Globe', 'bi-globe'], ['Globe 2', 'bi-globe2'], ['Globe Americas', 'bi-globe-americas'],
    ['Headset', 'bi-headset'], ['Megaphone', 'bi-megaphone'], ['Arrow Repeat', 'bi-arrow-repeat'],
    ['Fire', 'bi-fire'], ['Speedometer', 'bi-speedometer2'], ['Clipboard Check', 'bi-clipboard-check'],
    ['Clipboard Data', 'bi-clipboard-data'], ['Briefcase', 'bi-briefcase'], ['Heart', 'bi-heart'], ['Heart Fill', 'bi-heart-fill'],
    ['Rocket', 'bi-rocket-takeoff'], ['Bounding Box', 'bi-bounding-box'], ['Bezier', 'bi-bezier2'],
    ['CPU', 'bi-cpu'], ['Terminal', 'bi-terminal'], ['Code Slash', 'bi-code-slash'], ['Braces', 'bi-braces'],
    ['Bug', 'bi-bug'], ['Wrench', 'bi-wrench-adjustable'], ['Rulers', 'bi-rulers'],
    ['Kanban', 'bi-kanban'], ['Layers', 'bi-layers'], ['List Check', 'bi-list-check'], ['Magic', 'bi-magic'],
    ['Palette', 'bi-palette'], ['Patch Check', 'bi-patch-check'], ['Pen', 'bi-pen'],
    ['Signpost Split', 'bi-signpost-split'], ['Table', 'bi-table'], ['Tags', 'bi-tags'],
    ['Toggles', 'bi-toggles2'], ['USB Drive', 'bi-usb-drive'], ['Vector Pen', 'bi-vector-pen'],
    ['Hourglass', 'bi-hourglass-split'], ['Filter', 'bi-filter'], ['Funnel', 'bi-funnel'],
    ['Book', 'bi-book'], ['Building', 'bi-building'], ['Cash Coin', 'bi-cash-coin'], ['Calculator', 'bi-calculator'],
    ['Display', 'bi-display'], ['File Code', 'bi-file-earmark-code'], ['Flag', 'bi-flag'],
    ['Keyboard', 'bi-keyboard'], ['Mouse', 'bi-mouse'], ['Share', 'bi-share'], ['Database', 'bi-database'],
    ['Cloud', 'bi-cloud'], ['Cloud Upload', 'bi-cloud-arrow-up'], ['Server', 'bi-hdd-network'],
    ['Eye', 'bi-eye'], ['Ear', 'bi-ear'], ['Mic', 'bi-mic'], ['Camera', 'bi-camera'], ['Image', 'bi-image']
];

const SOCIAL_BI = [
    ['WhatsApp', 'bi-whatsapp'], ['Telegram', 'bi-telegram'], ['Twitter / X', 'bi-twitter-x'],
    ['LinkedIn', 'bi-linkedin'], ['GitHub', 'bi-github'], ['Facebook', 'bi-facebook'],
    ['Instagram', 'bi-instagram'], ['YouTube', 'bi-youtube'], ['Discord', 'bi-discord'],
    ['TikTok', 'bi-tiktok'], ['Twitch', 'bi-twitch'], ['Snapchat', 'bi-snapchat'],
    ['Reddit', 'bi-reddit'], ['Pinterest', 'bi-pinterest'], ['Medium', 'bi-medium'],
    ['Stack Overflow', 'bi-stack-overflow'], ['Behance', 'bi-behance'], ['Dribbble', 'bi-dribbble'],
    ['Skype', 'bi-skype'], ['RSS', 'bi-rss'], ['Envelope (Email)', 'bi-envelope-fill'],
    ['Telephone', 'bi-telephone-fill'], ['Globe', 'bi-globe'], ['Link', 'bi-link-45deg'],
    ['Messenger', 'bi-messenger'], ['Vimeo', 'bi-vimeo'], ['Spotify', 'bi-spotify'], ['Music', 'bi-music-note-beamed']
];

(async () => {
    console.log('Fetching devicon CSS...');
    const deviconCss = await get('https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css');
    console.log('Fetching bootstrap-icons CSS...');
    const biCss = await get('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css');

    const deviconClasses = new Set();
    {
        const re = /\.devicon-([a-z0-9-]+)/g;
        let m;
        while ((m = re.exec(deviconCss)) !== null) deviconClasses.add(m[1]);
    }
    const biNames = new Set();
    {
        const re = /\.bi-([a-z0-9-]+)/g;
        let m;
        while ((m = re.exec(biCss)) !== null) biNames.add(m[1]);
    }
    console.log('devicon classes found:', deviconClasses.size);
    console.log('bootstrap icon classes found:', biNames.size);

    const missing = [];

    function findDevicon(bases) {
        for (const base of bases) {
            for (const v of VARIANT_ORDER) {
                if (deviconClasses.has(base + '-' + v)) return 'devicon-' + base + '-' + v + ' colored';
            }
        }
        return null;
    }

    const groups = [];

    for (const g of DEVICON_GROUPS) {
        const items = [];
        const seenCls = new Set();
        for (const [name, base] of g.entries) {
            const bases = Array.isArray(base) ? base : [base];
            const cls = findDevicon(bases);
            if (cls) {
                if (seenCls.has(cls)) continue; // امنع التكرار جوه نفس المجموعة
                seenCls.add(cls);
                items.push({ c: cls, n: name });
            } else {
                missing.push(g.key + ': ' + name + ' (' + bases.join(', ') + ')');
            }
        }
        if (items.length) groups.push({ key: g.key, label: g.label, items });
    }

    // social group mixed devicon + bootstrap
    {
        const items = [];
        for (const [name, base] of SOCIAL_ENTRIES) {
            const bases = Array.isArray(base) ? base : [base];
            const cls = findDevicon(bases);
            if (cls) items.push({ c: cls, n: name });
        }
        for (const [name, cls] of SOCIAL_BI) {
            const bare = cls.replace('bi-', '');
            if (biNames.has(bare)) items.push({ c: cls, n: name });
            else missing.push('social: ' + name + ' (' + cls + ')');
        }
        // dedupe by name keeping first
        const seen = new Set();
        const deduped = items.filter(it => { if (seen.has(it.n)) return false; seen.add(it.n); return true; });
        groups.push({ key: 'social', label: 'Social', items: deduped });
    }

    // soft skills (bootstrap)
    {
        const items = [];
        for (const [name, cls] of SOFT_BI) {
            const bare = cls.replace('bi-', '');
            if (biNames.has(bare)) items.push({ c: cls, n: name });
            else missing.push('soft: ' + name + ' (' + cls + ')');
        }
        const seen = new Set();
        const deduped = items.filter(it => { if (seen.has(it.n)) return false; seen.add(it.n); return true; });
        groups.push({ key: 'soft', label: 'Soft Skills', items: deduped });
    }

    const total = groups.reduce((n, g) => n + g.items.length, 0);

    const banner = [
        '// dashboard/core/icons.js',
        '// AUTO-GENERATED + VERIFIED against the real devicon & bootstrap-icons CDN CSS.',
        '// Do not hand-edit: regenerate with scripts/build-icons.js instead.',
        '// total icons: ' + total
    ].join('\n');

    fs.writeFileSync('D:/my-web-html/dashboard/core/icons.js',
        banner + '\nwindow.DASH_ICONS = ' + JSON.stringify({ groups: groups }, null, 2) + ';\n', 'utf8');

    console.log('WROTE dashboard/core/icons.js');
    groups.forEach(g => console.log('  ' + g.label + ': ' + g.items.length));
    console.log('TOTAL: ' + total);
    if (missing.length) {
        console.log('MISSING (' + missing.length + '):');
        missing.forEach(m => console.log('  - ' + m));
    } else {
        console.log('MISSING: none');
    }
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
