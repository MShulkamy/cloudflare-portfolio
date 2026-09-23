// dashboard/projects/projects.js
// ============================================================
//  إدارة المشاريع: إضافة / تعديل / حذف
// ============================================================

(async function () {
    await window.initLayout('projects');
    const ui = window.dashUi;

    window.initCrudPage({
        table: 'projects',
        title: 'Projects',
        itemName: 'Project',
        addLabel: 'Add Project',
        sortable: true,
        columns: [
            { key: 'title_en', label: 'Title (EN)' },
            {
                key: 'status', label: 'Status', render: function (r) {
                    return '<span class="badge badge-soft-info">' + ui.escapeHtml(r.status || '—') + '</span>';
                }
            },
            {
                key: 'tech', label: 'Tech', render: function (r) {
                    if (!Array.isArray(r.tech) || !r.tech.length) return '<span class="text-muted">—</span>';
                    return r.tech.slice(0, 4).map(function (t) {
                        return '<span class="badge badge-soft-muted me-1">' + ui.escapeHtml(t) + '</span>';
                    }).join('') + (r.tech.length > 4 ? '<span class="text-muted small">+' + (r.tech.length - 4) + '</span>' : '');
                }
            },
            {
                key: 'images', label: 'Images', render: function (r) {
                    return '<span class="text-muted">' + ((r.images && r.images.length) || 0) + '</span>';
                }
            },
            { key: 'order', label: 'Order' }
        ],
        fields: [
            { key: 'title_en', label: 'Title (English)', type: 'text', required: true },
            { key: 'title_ar', label: 'Title (Arabic)', type: 'text' },
            { key: 'desc_en', label: 'Short Description (EN)', type: 'textarea', rows: 2 },
            { key: 'desc_ar', label: 'Short Description (AR)', type: 'textarea', rows: 2 },
            { key: 'full_desc_en', label: 'Full Description (EN)', type: 'textarea', rows: 4 },
            { key: 'full_desc_ar', label: 'Full Description (AR)', type: 'textarea', rows: 4 },
            { key: 'tech', label: 'Tech Stack', type: 'tags', help: 'افصل بفاصلة: React, Node.js, MongoDB' },
            { key: 'images', label: 'Images', type: 'lines', rows: 3, upload: true, help: 'ارفع صور من جهازك أو الصق روابط — أول صورة هي الرئيسية' },
            { key: 'status', label: 'Status', type: 'text', default: 'Completed', help: 'مثال: Completed أو In Progress' },
            { key: 'demo', label: 'Live Demo URL', type: 'url' },
            { key: 'github', label: 'GitHub URL', type: 'url' },
            { key: 'order', label: 'Order', type: 'number', default: 0, col: 'col-md-4', help: 'الأصغر بيظهر الأول' }
        ]
    });
})();
