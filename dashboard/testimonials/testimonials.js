// dashboard/testimonials/testimonials.js
// ============================================================
//  إدارة التقييمات: موافقة / إلغاء موافقة / حذف
//  + عرض الإيميلات (للأدمن فقط)
// ============================================================

(async function () {
    await window.initLayout('testimonials');
    const ui = window.dashUi;
    const content = document.getElementById('page-content');

    let rows = [];
    let filter = 'all';

    content.innerHTML =
        '<div class="dash-card">' +
        '  <div class="dash-card-header">' +
        '    <div>' +
        '      <h2 class="h5 mb-0">Testimonials</h2>' +
        '      <small class="text-muted" id="t-count"></small>' +
        '    </div>' +
        '    <select class="form-select form-select-sm" id="t-filter" style="width: auto;">' +
        '      <option value="all">All</option>' +
        '      <option value="pending">Pending</option>' +
        '      <option value="approved">Approved</option>' +
        '    </select>' +
        '  </div>' +
        '  <div class="table-responsive">' +
        '    <table class="table table-dark table-hover align-middle mb-0">' +
        '      <thead><tr>' +
        '        <th>Person</th><th>Rating</th><th>Message</th><th>Date</th><th>Status</th><th class="text-end">Actions</th>' +
        '      </tr></thead>' +
        '      <tbody id="t-tbody"></tbody>' +
        '    </table>' +
        '  </div>' +
        '</div>';

    const tbody = document.getElementById('t-tbody');
    const countEl = document.getElementById('t-count');

    function stars(n) {
        let s = '';
        for (let i = 0; i < 5; i++) {
            s += '<i class="bi ' + (i < n ? 'bi-star-fill text-warning' : 'bi-star text-muted') + '"></i>';
        }
        return s;
    }

    function visibleRows() {
        if (filter === 'pending') return rows.filter(function (r) { return !r.is_approved; });
        if (filter === 'approved') return rows.filter(function (r) { return r.is_approved; });
        return rows;
    }

    function render() {
        const pendingCount = rows.filter(function (r) { return !r.is_approved; }).length;
        countEl.textContent = rows.length + ' total — ' + pendingCount + ' pending approval';

        const list = visibleRows();
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-5">No testimonials here.</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(function (t) {
            const shortText = t.text.length > 90 ? t.text.slice(0, 90) + '…' : t.text;
            return '<tr>' +
                '<td>' +
                '  <div class="fw-medium">' + ui.escapeHtml(t.name) + '</div>' +
                '  <small class="text-muted">' + ui.escapeHtml(t.email || '') + '</small>' +
                (t.role || t.company ? '<div><small class="text-muted">' + ui.escapeHtml(t.role || '') + (t.company ? ' @ ' + ui.escapeHtml(t.company) : '') + '</small></div>' : '') +
                '</td>' +
                '<td style="white-space:nowrap">' + stars(t.rating) + '</td>' +
                '<td style="max-width:320px"><span title="' + ui.escapeHtml(t.text) + '">' + ui.escapeHtml(shortText) + '</span></td>' +
                '<td class="small text-muted" style="white-space:nowrap">' + ui.fmtDate(t.created_at) + '</td>' +
                '<td>' + (t.is_approved
                    ? '<span class="badge badge-soft-success">Approved</span>'
                    : '<span class="badge badge-soft-warning">Pending</span>') + '</td>' +
                '<td><div class="table-row-actions">' +
                (t.is_approved
                    ? '<button class="btn btn-outline-warning btn-sm" data-action="unapprove" data-id="' + t.id + '" title="Unapprove"><i class="bi bi-eye-slash"></i></button>'
                    : '<button class="btn btn-outline-success btn-sm" data-action="approve" data-id="' + t.id + '" title="Approve"><i class="bi bi-check-lg"></i></button>') +
                '<button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="' + t.id + '" title="Delete"><i class="bi bi-trash"></i></button>' +
                '</div></td>' +
                '</tr>';
        }).join('');
    }

    async function load() {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">' +
            '<span class="spinner-border spinner-border-sm me-2"></span>Loading…</td></tr>';
        try {
            const data = await window.dashApi.list('testimonials');
            rows = data.results || [];
            render();
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">' + ui.escapeHtml(err.message) + '</td></tr>';
        }
    }

    // --- الفلتر ---
    document.getElementById('t-filter').addEventListener('change', function () {
        filter = this.value;
        render();
    });

    // --- الأزرار ---
    tbody.addEventListener('click', async function (e) {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const id = Number(btn.dataset.id);

        if (btn.dataset.action === 'approve' || btn.dataset.action === 'unapprove') {
            const approve = btn.dataset.action === 'approve';
            try {
                await window.dashApi.update('testimonials', id, { is_approved: approve ? 1 : 0 });
                ui.toast(approve ? 'Testimonial approved — now visible on the site' : 'Testimonial hidden from site');
                load();
            } catch (err) {
                ui.toast(err.message, 'danger');
            }

        } else if (btn.dataset.action === 'delete') {
            const ok = await ui.confirmDialog({
                title: 'Delete this testimonial?',
                message: 'This action cannot be undone.',
                confirmText: 'Delete'
            });
            if (!ok) return;
            try {
                await window.dashApi.remove('testimonials', id);
                ui.toast('Testimonial deleted');
                load();
            } catch (err) {
                ui.toast(err.message, 'danger');
            }
        }
    });

    load();
})();
