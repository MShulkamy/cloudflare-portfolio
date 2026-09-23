-- ============================================================================
--  Your Name — Portfolio Backend
--  Cloudflare D1 Database (SQLite) — Schema + Seed
--  شغّله بالأمر:
--    remote:  npx wrangler d1 execute portfolio-db --remote --file=db/schema.sql
--    local:   npx wrangler d1 execute portfolio-db --local  --file=db/schema.sql
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1) TABLES
-- ============================================================================

-- 1.1 Hero Section (صف واحد)
CREATE TABLE IF NOT EXISTS hero_section (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name_en     TEXT NOT NULL DEFAULT '',
    name_ar     TEXT NOT NULL DEFAULT '',
    bio_en      TEXT DEFAULT '',
    bio_ar      TEXT DEFAULT '',
    titles_en   TEXT NOT NULL DEFAULT '[]',   -- JSON array
    titles_ar   TEXT NOT NULL DEFAULT '[]',   -- JSON array
    image_url   TEXT DEFAULT '',
    cv_url      TEXT DEFAULT '',
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 1.2 Skills
CREATE TABLE IF NOT EXISTS skills (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name_en     TEXT NOT NULL DEFAULT '',
    name_ar     TEXT NOT NULL DEFAULT '',
    icon        TEXT DEFAULT '',
    category    TEXT NOT NULL DEFAULT 'technical'
                CHECK (category IN ('technical','soft','tool')),
    "order"     INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 1.3 Projects
CREATE TABLE IF NOT EXISTS projects (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title_en        TEXT NOT NULL DEFAULT '',
    title_ar        TEXT NOT NULL DEFAULT '',
    desc_en         TEXT DEFAULT '',
    desc_ar         TEXT DEFAULT '',
    full_desc_en    TEXT DEFAULT '',
    full_desc_ar    TEXT DEFAULT '',
    images          TEXT NOT NULL DEFAULT '[]',   -- JSON array
    tech            TEXT NOT NULL DEFAULT '[]',   -- JSON array
    status          TEXT DEFAULT 'Completed',
    demo            TEXT DEFAULT '',
    github          TEXT DEFAULT '',
    "order"         INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 1.4 Certifications
CREATE TABLE IF NOT EXISTS certifications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title_en    TEXT NOT NULL DEFAULT '',
    title_ar    TEXT NOT NULL DEFAULT '',
    issuer_en   TEXT DEFAULT '',
    issuer_ar   TEXT DEFAULT '',
    desc_en     TEXT DEFAULT '',
    desc_ar     TEXT DEFAULT '',
    image       TEXT DEFAULT '',
    link        TEXT DEFAULT '',
    date        TEXT DEFAULT '',
    "order"     INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 1.5 Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT DEFAULT '',
    company     TEXT DEFAULT '',
    role        TEXT DEFAULT '',
    rating      INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    text        TEXT NOT NULL,
    is_approved INTEGER NOT NULL DEFAULT 0,   -- 0/1
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 1.6 Social Links
CREATE TABLE IF NOT EXISTS social_links (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name_en     TEXT NOT NULL DEFAULT '',
    name_ar     TEXT NOT NULL DEFAULT '',
    icon        TEXT DEFAULT '',
    url         TEXT NOT NULL DEFAULT '',
    "order"     INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 1.7 Admins (الأدمن الوحيد بتاعك)
CREATE TABLE IF NOT EXISTS admins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt          TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 1.8 Sessions (جلسات تسجيل الدخول)
CREATE TABLE IF NOT EXISTS sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash  TEXT NOT NULL UNIQUE,
    admin_id    INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    expires_at  INTEGER NOT NULL,             -- unix ms
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 1.9 Login Attempts (حماية من التخمين)
CREATE TABLE IF NOT EXISTS login_attempts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    ip           TEXT NOT NULL,
    success      INTEGER NOT NULL DEFAULT 0,
    attempted_at INTEGER NOT NULL              -- unix ms
);

-- 1.10 Public Submissions (حماية من سبام الزوار — تقييمات وغيرها)
CREATE TABLE IF NOT EXISTS public_submissions (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    ip           TEXT NOT NULL,
    kind         TEXT NOT NULL,                -- نوع الإرسال: testimonial / message
    submitted_at INTEGER NOT NULL              -- unix ms
);

-- 1.11 Experience (الخبرات التعليمية والعملية)
CREATE TABLE IF NOT EXISTS experience (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    role_en     TEXT NOT NULL DEFAULT '',
    role_ar     TEXT NOT NULL DEFAULT '',
    company_en  TEXT DEFAULT '',
    company_ar  TEXT DEFAULT '',
    desc_en     TEXT DEFAULT '',
    desc_ar     TEXT DEFAULT '',
    start_date  TEXT DEFAULT '',                -- نص مرن: "Jan 2024"
    end_date    TEXT DEFAULT '',                -- فاضي = حتى الآن
    location    TEXT DEFAULT '',
    link        TEXT DEFAULT '',
    "order"     INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 1.12 Messages (رسائل الزوار)
CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    subject     TEXT DEFAULT '',
    text        TEXT NOT NULL,
    is_read     INTEGER NOT NULL DEFAULT 0,
    is_replied  INTEGER NOT NULL DEFAULT 0,
    reply_text  TEXT DEFAULT '',                -- نص الرد اللي اتبعت
    replied_at  TEXT DEFAULT '',                -- وقت الرد
    tg_msg_id   INTEGER NOT NULL DEFAULT 0,     -- رقم إشعار تليجرام (للرد المباشر من البوت)
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 1.13 Posts (مقالات المدونة — محتوى Markdown)
CREATE TABLE IF NOT EXISTS posts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    slug         TEXT NOT NULL UNIQUE,           -- رابط المقالة: /blog/my-post
    title_en     TEXT NOT NULL DEFAULT '',
    title_ar     TEXT DEFAULT '',
    excerpt_en   TEXT DEFAULT '',                -- وصف قصير للمعاينة
    excerpt_ar   TEXT DEFAULT '',
    body_en      TEXT DEFAULT '',                -- محتوى Markdown إنجليزي
    body_ar      TEXT DEFAULT '',                -- محتوى Markdown عربي
    cover_url    TEXT DEFAULT '',
    tags         TEXT NOT NULL DEFAULT '[]',     -- JSON array
    is_published INTEGER NOT NULL DEFAULT 0,     -- 0 مسودة / 1 منشور
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 1.14 Page Views (إحصائيات الزوار — بدون أي بيانات شخصية: لا IP ولا كوكيز)
CREATE TABLE IF NOT EXISTS page_views (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    path       TEXT NOT NULL,                    -- / أو /blog/welcome
    referrer   TEXT DEFAULT '',                  -- الموقع اللي جاء منه الزائر
    country    TEXT DEFAULT '',                  -- كود الدولة من Cloudflare (EG مثلاً)
    visitor    TEXT DEFAULT '',                  -- معرف عشوائي مجهول من المتصفح (مش IP)
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- 2) INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials (is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skills_order          ON skills ("order");
CREATE INDEX IF NOT EXISTS idx_projects_order        ON projects ("order");
CREATE INDEX IF NOT EXISTS idx_certifications_order  ON certifications ("order");
CREATE INDEX IF NOT EXISTS idx_social_links_order    ON social_links ("order");
CREATE INDEX IF NOT EXISTS idx_sessions_token        ON sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip     ON login_attempts (ip, attempted_at);
CREATE INDEX IF NOT EXISTS idx_public_submissions    ON public_submissions (ip, kind, submitted_at);
CREATE INDEX IF NOT EXISTS idx_experience_order      ON experience ("order");
CREATE INDEX IF NOT EXISTS idx_messages_unread       ON messages (is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_published       ON posts (is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pv_created            ON page_views (created_at);
CREATE INDEX IF NOT EXISTS idx_pv_visitor            ON page_views (visitor, path, created_at);

-- ============================================================================
-- 3) SEED (بيانات بداية — عدّلها من الداشبورد)
-- ============================================================================

INSERT INTO hero_section (name_en, name_ar, bio_en, bio_ar, titles_en, titles_ar, image_url, cv_url)
SELECT 'Your Name',
       'اسمك',
       'Software Engineer passionate about building modern web applications and solving problems.',
       'مهندس برمجيات شغوف ببناء تطبيقات ويب حديثة وحل المشكلات.',
       '["Software Engineer","Web Developer","Problem Solver"]',
       '["مهندس برمجيات","مطور ويب","محلل مشاكل"]',
       '/assets/avatar.svg',
       '#'
WHERE NOT EXISTS (SELECT 1 FROM hero_section);

INSERT INTO skills (name_en, name_ar, icon, category, "order")
SELECT 'HTML / CSS', 'اتش تي ام ال / سي اس اس', 'devicon-html5-plain colored', 'technical', 1
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name_en = 'HTML / CSS');

INSERT INTO skills (name_en, name_ar, icon, category, "order")
SELECT 'JavaScript', 'جافاسكريبت', 'devicon-javascript-plain colored', 'technical', 2
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name_en = 'JavaScript');

INSERT INTO social_links (name_en, name_ar, icon, url, "order")
SELECT 'GitHub', 'جيتهاب', 'devicon-github-original', 'https://github.com/', 1
WHERE NOT EXISTS (SELECT 1 FROM social_links WHERE name_en = 'GitHub');

INSERT INTO social_links (name_en, name_ar, icon, url, "order")
SELECT 'Email', 'الإيميل', 'bi-envelope-fill', 'mailto:you@email.com', 3
WHERE NOT EXISTS (SELECT 1 FROM social_links WHERE name_en = 'Email');

-- ---------------------------------------------------------------------------
--  Sample content — so a fresh install is not an empty page.
--  Everything below can be edited or deleted from the dashboard.
-- ---------------------------------------------------------------------------

INSERT INTO skills (name_en, name_ar, icon, category, "order")
SELECT 'Flutter', 'فلاتر', 'devicon-flutter-plain colored', 'technical', 3
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name_en = 'Flutter');

INSERT INTO skills (name_en, name_ar, icon, category, "order")
SELECT 'Node.js', 'نود جي إس', 'devicon-nodejs-plain colored', 'technical', 4
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name_en = 'Node.js');

INSERT INTO skills (name_en, name_ar, icon, category, "order")
SELECT 'Git & GitHub', 'جيت وجيتهاب', 'devicon-git-plain colored', 'tool', 5
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name_en = 'Git & GitHub');

INSERT INTO skills (name_en, name_ar, icon, category, "order")
SELECT 'Problem Solving', 'حل المشكلات', 'bi-lightbulb', 'soft', 6
WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name_en = 'Problem Solving');

INSERT INTO social_links (name_en, name_ar, icon, url, "order")
SELECT 'LinkedIn', 'لينكدإن', 'bi-linkedin', 'https://www.linkedin.com/', 2
WHERE NOT EXISTS (SELECT 1 FROM social_links WHERE name_en = 'LinkedIn');

INSERT INTO projects (title_en, title_ar, desc_en, desc_ar, full_desc_en, full_desc_ar, images, tech, status, demo, github, "order")
SELECT 'Portfolio with Admin Dashboard',
       'بورتفوليو مع لوحة تحكم',
       'A personal portfolio site with a password-protected dashboard for managing every section.',
       'موقع شخصي مع لوحة تحكم محمية بكلمة سر لإدارة كل الأقسام.',
       'A fully serverless portfolio built on Cloudflare Pages, Functions and D1. The public site is plain HTML/CSS/JS, and the dashboard lets you manage the hero, skills, projects, certifications, experience, testimonials and blog posts — all stored in SQLite and served through a small REST API.',
       'بورتفوليو بدون سيرفر مبني على Cloudflare Pages وFunctions وD1. الموقع العام HTML/CSS/JS، ولوحة التحكم تتيح إدارة كل المحتوى: البطل، المهارات، المشاريع، الشهادات، الخبرات، التقييمات والمقالات.',
       '["/assets/placeholder.svg"]',
       '["HTML","CSS","JavaScript","Cloudflare D1"]',
       'Completed', '', '', 1
WHERE NOT EXISTS (SELECT 1 FROM projects);

INSERT INTO projects (title_en, title_ar, desc_en, desc_ar, full_desc_en, full_desc_ar, images, tech, status, demo, github, "order")
SELECT 'Expense Tracker',
       'تطبيق تتبع المصروفات',
       'An offline-first mobile app for tracking spending, budgets and monthly insights.',
       'تطبيق موبايل يعمل بدون إنترنت لتتبع المصروفات والميزانيات.',
       'A Flutter app built with Riverpod and a local SQLite database. It groups transactions by day, tracks category budgets, renders custom charts and supports full right-to-left Arabic layout.',
       'تطبيق فلاتر باستخدام Riverpod وقاعدة بيانات محلية. يجمع العمليات يوميًا، ويتابع الميزانيات، ويرسم رسومات بيانية مخصصة، ويدعم العربية بشكل كامل.',
       '["/assets/placeholder.svg"]',
       '["Flutter","Dart","SQLite","Riverpod"]',
       'Completed', '', '', 2
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title_en = 'Expense Tracker');

INSERT INTO projects (title_en, title_ar, desc_en, desc_ar, full_desc_en, full_desc_ar, images, tech, status, demo, github, "order")
SELECT 'REST API Playground',
       'ملعب واجهات REST',
       'A small toolkit for exploring and testing REST endpoints from the browser.',
       'أداة صغيرة لاستكشاف واختبار واجهات REST من المتصفح.',
       'Save reusable requests, inspect responses, and keep collections in local storage. Built with vanilla JavaScript and no build step.',
       'احفظ الطلبات، وافحص الاستجابات، واحتفظ بالمجموعات محليًا. مبني بجافاسكريبت بدون أي خطوة بناء.',
       '["/assets/placeholder.svg"]',
       '["JavaScript","REST","LocalStorage"]',
       'In progress', '', '', 3
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title_en = 'REST API Playground');

INSERT INTO experience (role_en, role_ar, company_en, company_ar, desc_en, desc_ar, start_date, end_date, location, link, "order")
SELECT 'Front-End Developer', 'مطور واجهات أمامية', 'Freelance', 'عمل حر',
       'Building responsive websites and dashboards for small businesses.',
       'بناء مواقع ولوحات تحكم متجاوبة لشركات صغيرة.',
       'Jan 2024', '', 'Remote', '', 1
WHERE NOT EXISTS (SELECT 1 FROM experience);

INSERT INTO experience (role_en, role_ar, company_en, company_ar, desc_en, desc_ar, start_date, end_date, location, link, "order")
SELECT 'Computer Science Student', 'طالب علوم حاسب', 'University', 'الجامعة',
       'Studying algorithms, data structures and software engineering.',
       'دراسة الخوارزميات وهياكل البيانات وهندسة البرمجيات.',
       'Sep 2021', 'Jun 2025', 'Cairo, Egypt', '', 2
WHERE NOT EXISTS (SELECT 1 FROM experience WHERE role_en = 'Computer Science Student');

INSERT INTO certifications (title_en, title_ar, issuer_en, issuer_ar, desc_en, desc_ar, image, link, date, "order")
SELECT 'Responsive Web Design', 'تصميم مواقع متجاوبة', 'freeCodeCamp', 'freeCodeCamp',
       'HTML, CSS, flexbox, grid and accessibility fundamentals.',
       'أساسيات HTML وCSS وFlexbox وGrid وإمكانية الوصول.',
       '/assets/placeholder.svg', 'https://freecodecamp.org', '2024', 1
WHERE NOT EXISTS (SELECT 1 FROM certifications);

INSERT INTO testimonials (name, email, company, role, rating, text, is_approved)
SELECT 'Sara Ahmed', 'sara@example.com', 'Nile Digital', 'Product Manager', 5,
       'Delivered the project ahead of schedule and the dashboard made content updates effortless.',
       1
WHERE NOT EXISTS (SELECT 1 FROM testimonials);

INSERT INTO testimonials (name, email, company, role, rating, text, is_approved)
SELECT 'Omar Khaled', 'omar@example.com', 'Cairo Labs', 'Team Lead', 5,
       'Clean code, clear communication and a real eye for detail. Would work with again.',
       1
WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE name = 'Omar Khaled');

-- أول مقالة ترحيبية (عدّلها أو امسحها من الداشبورد)
INSERT INTO posts (slug, title_en, title_ar, excerpt_en, excerpt_ar, body_en, body_ar, tags, is_published)
SELECT 'welcome',
       'Welcome to My Blog',
       'أهلاً بيكم في مدونتي',
       'A quick look at what I write about: Flutter, mobile development, and my journey as a CS student.',
       'جولة سريعة في اللي هكتب عنه: فلاتر، تطوير الموبايل، ورحلتي كطالب حاسبات.',
       '## Hello! 👋

This is my first post. I write about **Flutter**, mobile development, and my journey as a computer science student.

### What you will find here

- Flutter tips and tricks
- Notes from my learning journey
- Projects I am building

> Writing is the best way to learn — so I am starting today.

```dart
void main() {
  runApp(const MyApp());
}
```

Stay tuned!',
       '## أهلاً بيكم! 👋

دي أول مقالة ليا. هكتب هنا عن **فلاتر** وتطوير الموبايل، ورحلتي كطالب حاسبات ومعلومات.

### هتلاقي إيه هنا؟

- نصائح وحيل فلاتر
- ملاحظات من رحلة التعلم
- المشاريع اللي بشتغل عليها

> الكتابة أحسن طريقة للتعلم — فقررت أبدأ من النهاردة.

```dart
void main() {
  runApp(const MyApp());
}
```

تابعوني!',
       '["Flutter","Career"]',
       1
WHERE NOT EXISTS (SELECT 1 FROM posts);

-- ============================================================================
-- تم ✅
-- ملاحظة: حساب الأدمن مش بيتعمل من هنا — أول مرة تفتح الداشبورد هيعمل
-- "تهيئة أولى" (Setup) وتحدد الإيميل والباسورد بتوعك.
-- ============================================================================
