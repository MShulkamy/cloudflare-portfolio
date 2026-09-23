// dashboard/blog/blog.js
// ============================================================
//  إدارة مقالات المدونة: كتابة / تعديل / نشر / حذف
// ============================================================

(async function () {
    await window.initLayout('blog');
    const ui = window.dashUi;

    window.initCrudPage({
        table: 'posts',
        title: 'Blog Posts',
        itemName: 'Post',
        addLabel: 'Write Post',

        columns: [
            {
                label: 'Title',
                render: function (r) {
                    return '<div class="fw-semibold">' + ui.escapeHtml(r.title_en || '(no title)') + '</div>' +
                        '<small class="text-muted">/blog/' + ui.escapeHtml(r.slug) + '</small>';
                }
            },
            {
                label: 'Status',
                render: function (r) {
                    return r.is_published
                        ? '<span class="badge text-bg-success">Published</span>'
                        : '<span class="badge text-bg-secondary">Draft</span>';
                }
            },
            {
                label: 'Tags',
                render: function (r) {
                    const tags = r.tags || [];
                    if (!tags.length) return '<span class="text-muted">—</span>';
                    return tags.map(function (t) {
                        return '<span class="badge text-bg-info me-1">' + ui.escapeHtml(t) + '</span>';
                    }).join('');
                }
            },
            {
                label: 'Created',
                render: function (r) {
                    return '<span class="text-muted small">' + ui.fmtDate(r.created_at) + '</span>';
                }
            }
        ],

        fields: [
            { key: 'title_en', label: 'Title (English)', type: 'text', required: true, col: 'col-12' },
            { key: 'title_ar', label: 'Title (Arabic)', type: 'text', col: 'col-12' },
            { key: 'slug', label: 'URL Slug', type: 'text', col: 'col-md-8', help: 'اتركه فاضي ويتولّد تلقائياً من العنوان الإنجليزي — مثال: my-first-post' },
            { key: 'is_published', label: 'Published', type: 'checkbox', col: 'col-md-4', help: 'المقال مش هيظهر في الموقع غير لما تفعّل ده' },
            { key: 'excerpt_en', label: 'Excerpt (English)', type: 'textarea', rows: 2, col: 'col-12', help: 'وصف قصير يظهر في كارت المقالة' },
            { key: 'excerpt_ar', label: 'Excerpt (Arabic)', type: 'textarea', rows: 2, col: 'col-12' },
            { key: 'body_en', label: 'Content EN — Markdown', type: 'textarea', rows: 12, col: 'col-12', help: '## عنوان • **عريض** • *مائل* • - قائمة • [رابط](url) • كود بـ ``` • > اقتباس' },
            { key: 'body_ar', label: 'Content AR — Markdown', type: 'textarea', rows: 12, col: 'col-12' },
            { key: 'cover_url', label: 'Cover Image', type: 'image', col: 'col-md-8' },
            { key: 'tags', label: 'Tags', type: 'tags', col: 'col-md-4', help: 'افصل بفاصلة: Flutter, Dart' }
        ]
    });
})();
