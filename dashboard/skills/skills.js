// dashboard/skills/skills.js
// ============================================================
//  إدارة المهارات: إضافة / تعديل / حذف
// ============================================================

(async function () {
    await window.initLayout('skills');
    const ui = window.dashUi;

    const categoryBadges = {
        technical: 'badge-soft-info',
        soft: 'badge-soft-success',
        tool: 'badge-soft-warning'
    };

    window.initCrudPage({
        table: 'skills',
        title: 'Skills',
        itemName: 'Skill',
        addLabel: 'Add Skill',
        sortable: true,
        columns: [
            { key: 'name_en', label: 'Name (EN)' },
            { key: 'name_ar', label: 'Name (AR)' },
            {
                key: 'category', label: 'Category', render: function (r) {
                    return '<span class="badge ' + (categoryBadges[r.category] || 'badge-soft-muted') + '">' + ui.escapeHtml(r.category) + '</span>';
                }
            },
            {
                key: 'icon', label: 'Icon', render: function (r) {
                    return '<code class="text-muted small">' + ui.escapeHtml(r.icon || '—') + '</code>';
                }
            },
            { key: 'order', label: 'Order' }
        ],
        fields: [
            { key: 'name_en', label: 'Name (English)', type: 'text', required: true },
            { key: 'name_ar', label: 'Name (Arabic)', type: 'text' },
            { key: 'icon', label: 'Icon', type: 'icon', help: 'اضغط 🟦 Browse واختار من 300+ أيقونة جاهزة — أو ارفع صورة من جهازك' },
            {
                key: 'category', label: 'Category', type: 'select', required: true, default: 'technical',
                options: [['technical', 'Technical (مهارة تقنية)'], ['soft', 'Soft (مهارة شخصية)'], ['tool', 'Tool (أداة)']]
            },
            { key: 'order', label: 'Order', type: 'number', default: 0, col: 'col-md-4', help: 'الأصغر بيظهر الأول' }
        ]
    });
})();
