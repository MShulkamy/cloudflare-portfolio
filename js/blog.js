// js/blog.js
// ============================================================
//  صفحة المدونة: تعمل في وضعين
//   - وضع القائمة:  عنصر #blog-list موجود
//   - وضع المقالة:  عنصر #post-root موجود
// ============================================================

(function () {

    const lang = localStorage.getItem('site-lang') || 'en';
    const isAr = lang === 'ar';

    const T = isAr ? {
        readMore: 'اقرأ المزيد',
        empty: 'مفيش مقالات منشورة لحد الآن — قريباً!',
        back: 'كل المقالات',
        notFound: 'المقالة مش موجودة أو لسه مسودة.',
        minRead: 'دقايق قراءة',
        error: 'حصلت مشكلة في التحميل — جرّب تعمل refresh.'
    } : {
        readMore: 'Read more',
        empty: 'No published posts yet — coming soon!',
        back: 'All posts',
        notFound: 'This post does not exist or is still a draft.',
        minRead: 'min read',
        error: 'Something went wrong while loading — try refreshing.'
    };

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function fmtDate(v) {
        if (!v) return '';
        let iso = String(v).replace(' ', 'T');
        if (!iso.includes('Z') && !iso.includes('+')) iso += 'Z';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return String(v);
        return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function postUrl(slug) {
        return '/blog/' + encodeURIComponent(slug);
    }

    function tagsHtml(tags) {
        if (!Array.isArray(tags) || !tags.length) return '';
        return '<div class="blog-tags">' + tags.map(function (t) {
            return '<span class="blog-tag">' + esc(t) + '</span>';
        }).join('') + '</div>';
    }

    function cardHtml(p) {
        const title = (isAr && p.title_ar) ? p.title_ar : p.title_en;
        const excerpt = (isAr && p.excerpt_ar) ? p.excerpt_ar : (p.excerpt_en || '');
        const cover = p.cover_url
            ? '<img class="blog-card-cover" src="' + esc(p.cover_url) + '" alt="' + esc(title) + '" loading="lazy" onerror="this.style.display=\'none\'">'
            : '<div class="blog-card-cover blog-card-cover-placeholder"><i class="bi bi-journal-code"></i></div>';

        return '<a class="blog-card" href="' + postUrl(p.slug) + '">' +
            cover +
            '<div class="blog-card-body">' +
            '<div class="blog-card-meta"><span><i class="bi bi-calendar3 me-1"></i>' + esc(fmtDate(p.created_at)) + '</span></div>' +
            '<h3>' + esc(title) + '</h3>' +
            (excerpt ? '<p>' + esc(excerpt) + '</p>' : '') +
            tagsHtml(p.tags) +
            '<span class="blog-card-more">' + T.readMore + ' <i class="bi bi-arrow-' + (isAr ? 'left' : 'right') + '"></i></span>' +
            '</div></a>';
    }

    // ---------- وضع القائمة ----------
    async function listMode() {
        const el = document.getElementById('blog-list');
        el.innerHTML = '<div class="blog-empty"><span class="spinner-border spinner-border-sm me-2"></span>' +
            (isAr ? 'جاري التحميل…' : 'Loading…') + '</div>';
        try {
            const res = await fetch('/api/public/posts');
            const data = await res.json();
            const posts = data.results || [];
            if (!posts.length) {
                el.innerHTML = '<div class="blog-empty"><i class="bi bi-journal-text d-block mb-2" style="font-size:2rem"></i>' + T.empty + '</div>';
                return;
            }
            el.innerHTML = posts.map(cardHtml).join('');
        } catch (e) {
            el.innerHTML = '<div class="blog-empty text-danger">' + T.error + '</div>';
        }
    }

    // ---------- وضع المقالة ----------
    async function postMode() {
        const el = document.getElementById('post-root');
        const params = new URLSearchParams(location.search);
        let slug = params.get('slug') || '';
        if (!slug) {
            const seg = location.pathname.replace(/\/+$/, '').split('/').pop();
            if (seg && seg !== 'post.html' && seg !== 'blog') slug = decodeURIComponent(seg);
        }

        if (!slug) { el.innerHTML = '<div class="blog-empty">' + T.notFound + '</div>'; return; }

        try {
            const res = await fetch('/api/public/posts/' + encodeURIComponent(slug));
            if (!res.ok) { el.innerHTML = '<div class="blog-empty">' + T.notFound + '</div>'; return; }
            const p = await res.json();

            const title = (isAr && p.title_ar) ? p.title_ar : p.title_en;
            const body = (isAr && p.body_ar) ? p.body_ar : (p.body_en || '');
            const words = body.split(/\s+/).filter(Boolean).length;
            const mins = Math.max(1, Math.round(words / 200));

            // SEO: عنوان الصفحة والوصف
            document.title = title + ' — ' + (isAr ? 'مدونة اسمك' : 'Your Name Blog');
            const desc = (isAr && p.excerpt_ar) ? p.excerpt_ar : (p.excerpt_en || '');
            setMeta('description', desc);
            setMeta('og:title', title, true);
            setMeta('og:description', desc, true);

            el.innerHTML =
                '<article class="post-article">' +
                '<header class="post-header">' +
                '<a class="post-back" href="/blog/"><i class="bi bi-arrow-' + (isAr ? 'right' : 'left') + ' me-1"></i>' + T.back + '</a>' +
                '<h1>' + esc(title) + '</h1>' +
                '<div class="post-meta">' +
                '<span><i class="bi bi-calendar3 me-1"></i>' + esc(fmtDate(p.created_at)) + '</span>' +
                '<span><i class="bi bi-clock me-1"></i>' + mins + ' ' + T.minRead + '</span>' +
                tagsHtml(p.tags) +
                '</div>' +
                (p.cover_url ? '<img class="post-cover" src="' + esc(p.cover_url) + '" alt="' + esc(title) + '" onerror="this.style.display=\'none\'">' : '') +
                '</header>' +
                '<div class="post-body">' + window.renderMarkdown(body) + '</div>' +
                '</article>';

        } catch (e) {
            el.innerHTML = '<div class="blog-empty text-danger">' + T.error + '</div>';
        }
    }

    function setMeta(name, content, isProperty) {
        if (!content) return;
        const attr = isProperty ? 'property' : 'name';
        let m = document.querySelector('meta[' + attr + '="' + name + '"]');
        if (!m) {
            m = document.createElement('meta');
            m.setAttribute(attr, name);
            document.head.appendChild(m);
        }
        m.setAttribute('content', content);
    }

    // ---------- زر تغيير اللغة ----------
    const lt = document.getElementById('blog-lang-toggle');
    if (lt) {
        lt.querySelector('span').textContent = isAr ? 'English' : 'عربي';
        lt.addEventListener('click', function () {
            localStorage.setItem('site-lang', isAr ? 'en' : 'ar');
            location.reload();
        });
    }

    // ---------- التشغيل ----------
    if (document.getElementById('blog-list')) listMode();
    if (document.getElementById('post-root')) postMode();

})();
