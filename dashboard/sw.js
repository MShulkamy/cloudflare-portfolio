// dashboard/sw.js
// ============================================================
//  Service Worker — يخلي الداشبورد يتثبت كتطبيق (PWA)
//  * صفحة التنقل: Network أولاً (عشان التحديثات) مع fallback للكاش
//  * ملفات ثابتة: Cache أولاً (فتح أسرع بكتير)
//  * /api: خارج الكاش تماماً (بيانات حية)
// ============================================================

const CACHE_NAME = 'dash-pwa-v4';

const CORE_ASSETS = [
    '/dashboard/core/layout.css',
    '/dashboard/core/layout.js',
    '/dashboard/core/ui.js',
    '/dashboard/core/api.js',
    '/dashboard/core/auth-guard.js',
    '/dashboard/core/crud-page.js',
    '/vendor/bootstrap-icons/bootstrap-icons.css',
    '/vendor/bootstrap-icons/fonts/bootstrap-icons-subset.woff2',
    '/vendor/devicon/devicon.min.css',
    '/vendor/devicon/fonts/devicon-subset.woff2',
    '/assets/icon-192.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => Promise.all(CORE_ASSETS.map((url) =>
                cache.add(url).catch(() => { /* تجاهل أي ملف مش موجود */ })
            )))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // طلبات غير GET أو خارج الموقع أو API → شبكة فقط
    if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;

    // التنقل بين الصفحات: الشبكة أولاً
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
                    return res;
                })
                .catch(() => caches.match(req))
        );
        return;
    }

    // ملفات ثابتة: "اعرض الكاش وحدّثه في الخلفية" (stale-while-revalidate)
    // كده الفتح سريع جداً والتحديثات بتوصل من أول ما تفتح المرة اللي بعدها
    event.respondWith(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.match(req).then(function (cached) {
                const network = fetch(req).then(function (res) {
                    if (res && res.ok) cache.put(req, res.clone()).catch(function () {});
                    return res;
                }).catch(function () { return null; });
                return cached || network.then(function (res) {
                    return res || new Response('Offline', { status: 503 });
                });
            });
        })
    );
});
