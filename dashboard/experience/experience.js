// dashboard/experience/experience.js
// ============================================================
//  إدارة الخبرات (شغل / تدريب / تعليم) — Timeline
// ============================================================

(async function () {
    await window.initLayout('experience');
    const ui = window.dashUi;

    window.initCrudPage({
        table: 'experience',
        title: 'Experience & Education',
        itemName: 'Experience',
        addLabel: 'Add Experience',
        sortable: true,
        columns: [
            { key: 'role_en', label: 'Role (EN)' },
            { key: 'company_en', label: 'Company' },
            {
                key: 'period', label: 'Period', render: function (r) {
                    const start = ui.escapeHtml(r.start_date || '');
                    const end = ui.escapeHtml(r.end_date || 'Present');
                    return '<span class="small text-muted">' + start + ' — ' + end + '</span>';
                }
            },
            { key: 'location', label: 'Location' },
            { key: 'order', label: 'Order' }
        ],
        fields: [
            { key: 'role_en', label: 'Role / Degree (English)', type: 'text', required: true, help: 'مثال: Software Engineer أو B.Sc. Computer Science' },
            { key: 'role_ar', label: 'Role / Degree (Arabic)', type: 'text' },
            { key: 'company_en', label: 'Company / School (English)', type: 'text' },
            { key: 'company_ar', label: 'Company / School (Arabic)', type: 'text' },
            { key: 'desc_en', label: 'Description (English)', type: 'textarea', rows: 3 },
            { key: 'desc_ar', label: 'Description (Arabic)', type: 'textarea', rows: 3 },
            { key: 'start_date', label: 'Start Date', type: 'text', help: 'نص حر: Jan 2024 أو 2021' },
            { key: 'end_date', label: 'End Date', type: 'text', help: 'سيبه فاضي لو مستمر (هيتكتب Present / حتى الآن)' },
            { key: 'location', label: 'Location', type: 'text', help: 'مثال: Cairo, Egypt أو Remote' },
            { key: 'link', label: 'Link', type: 'url', help: 'رابط الشركة أو الشهادة (اختياري)' },
            { key: 'order', label: 'Order', type: 'number', default: 0, col: 'col-md-4', help: 'الأصغر بيظهر الأول في الـ Timeline' }
        ]
    });
})();
