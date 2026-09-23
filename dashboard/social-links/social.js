// dashboard/social-links/social.js
// ============================================================
//  إدارة روابط التواصل: إضافة / تعديل / حذف
// ============================================================

(async function () {
    await window.initLayout('social-links');
    const ui = window.dashUi;

    window.initCrudPage({
        table: 'social_links',
        title: 'Social Links',
        itemName: 'Social Link',
        addLabel: 'Add Link',
        sortable: true,
        columns: [
            { key: 'name_en', label: 'Name (EN)' },
            { key: 'name_ar', label: 'Name (AR)' },
            {
                key: 'icon', label: 'Icon', render: function (r) {
                    return '<code class="text-muted small">' + ui.escapeHtml(r.icon || '—') + '</code>';
                }
            },
            {
                key: 'url', label: 'URL', render: function (r) {
                    return '<a href="' + ui.escapeHtml(ui.safeUrl(r.url)) + '" target="_blank" rel="noopener" class="small text-truncate d-inline-block" style="max-width: 220px;">' + ui.escapeHtml(r.url) + '</a>';
                }
            },
            { key: 'order', label: 'Order' }
        ],
        fields: [
            { key: 'name_en', label: 'Name (English)', type: 'text', required: true, help: 'مثال: GitHub' },
            { key: 'name_ar', label: 'Name (Arabic)', type: 'text' },
            { key: 'icon', label: 'Icon', type: 'icon', help: 'اختار من مكتبة الأيقونات (فيها تابات Social / Languages / Tools) أو ارفع صورة' },
            { key: 'url', label: 'URL', type: 'url', required: true, help: 'https://... أو mailto:you@email.com' },
            { key: 'order', label: 'Order', type: 'number', default: 0, col: 'col-md-4', help: 'الأصغر بيظهر الأول' }
        ]
    });
})();
