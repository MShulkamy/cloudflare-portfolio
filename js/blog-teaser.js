// js/blog-teaser.js
// ============================================================
//  قسم "أحدث المقالات" في الصفحة الرئيسية — آخر 3 مقالات
// ============================================================

(async function () {

    let lang = window.appLang || 'en';
    let posts = [];

    const t = {
        en: { sub: 'WRITING', title: 'Latest Articles', viewAll: 'View All Posts', readMore: 'Read more', empty: 'Articles coming soon.' },
        ar: { sub: 'المدونة', title: 'أحدث المقالات', viewAll: 'كل المقالات', readMore: 'اقرأ المزيد', empty: 'مقالات قريباً.' }
    };

    // --- جلب المقالات ---
    try {
        const data = await window.api.jfetch('/public/posts');
        posts = (data.results || []).slice(0, 3);
    } catch (err) {
        console.error('Error fetching posts:', err.message);
        posts = [];
    }

    // --- الرسم ---
    function applyTitles() {
        $('[data-i18n="blogSubtitle"]').text(t[lang].sub);
        $('[data-i18n="blogTitle"]').text(t[lang].title);
        $('[data-i18n="blogViewAll"]').text(t[lang].viewAll);
    }

    function render() {
        applyTitles();
        const container = $('#blog-teaser-posts').empty();

        if (!posts.length) {
            window.setContainerMessage('#blog-teaser-posts', t[lang].empty, 'bi-journal-text');
            return;
        }

        const e = window.escapeHtml.bind(window);

        posts.forEach(function (p) {
            const title = (lang === 'ar' && p.title_ar) ? p.title_ar : p.title_en;
            const excerpt = (lang === 'ar' && p.excerpt_ar) ? p.excerpt_ar : (p.excerpt_en || '');
            const cover = p.cover_url
                ? '<img class="blog-card-cover" src="' + e(p.cover_url) + '" alt="' + e(title) + '" loading="lazy" onerror="this.style.display=\'none\'">'
                : '<div class="blog-card-cover blog-card-cover-placeholder"><i class="bi bi-journal-code"></i></div>';

            const card =
                '<a class="blog-card" href="/blog/' + encodeURIComponent(p.slug) + '">' +
                cover +
                '<div class="blog-card-body">' +
                '<h3>' + e(title) + '</h3>' +
                (excerpt ? '<p>' + e(excerpt) + '</p>' : '') +
                '<span class="blog-card-more">' + t[lang].readMore + ' <i class="bi bi-arrow-' + (lang === 'ar' ? 'left' : 'right') + '"></i></span>' +
                '</div></a>';

            container.append(card);
        });
    }

    render();

    $(document).on('app:languageChanged', function (e, newLang) {
        lang = newLang;
        render();
    });

})();
