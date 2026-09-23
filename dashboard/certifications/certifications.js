// dashboard/certifications/certifications.js
// ============================================================
//  إدارة الشهادات: إضافة / تعديل / حذف
// ============================================================

(async function () {
    await window.initLayout('certifications');
    const ui = window.dashUi;

    window.initCrudPage({
        table: 'certifications',
        title: 'Certifications',
        itemName: 'Certification',
        addLabel: 'Add Certification',
        sortable: true,
        columns: [
            { key: 'title_en', label: 'Title (EN)' },
            { key: 'issuer_en', label: 'Issuer' },
            { key: 'date', label: 'Date' },
            {
                key: 'link', label: 'Link', render: function (r) {
                    if (!r.link) return '<span class="text-muted">—</span>';
                    return '<a href="' + ui.escapeHtml(ui.safeUrl(r.link)) + '" target="_blank" rel="noopener" class="small">Open <i class="bi bi-box-arrow-up-right"></i></a>';
                }
            },
            { key: 'order', label: 'Order' }
        ],
        fields: [
            { key: 'title_en', label: 'Title (English)', type: 'text', required: true },
            { key: 'title_ar', label: 'Title (Arabic)', type: 'text' },
            { key: 'issuer_en', label: 'Issuer (English)', type: 'text', help: 'الجهة المانحة' },
            { key: 'issuer_ar', label: 'Issuer (Arabic)', type: 'text' },
            { key: 'desc_en', label: 'Description (EN)', type: 'textarea', rows: 3 },
            { key: 'desc_ar', label: 'Description (AR)', type: 'textarea', rows: 3 },
            { key: 'image', label: 'Image', type: 'image', help: 'ارفع صورة الشهادة من جهازك مباشرة' },
            { key: 'link', label: 'Verification Link', type: 'url', help: 'رابط التحقق من الشهادة' },
            { key: 'date', label: 'Date', type: 'text', help: 'مثال: 2025 أو March 2025' },
            { key: 'order', label: 'Order', type: 'number', default: 0, col: 'col-md-4' }
        ]
    });
})();
