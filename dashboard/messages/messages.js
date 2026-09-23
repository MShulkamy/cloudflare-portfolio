// dashboard/messages/messages.js
// ============================================================
//  صندوق الرسائل: عرض / تحديد كمقروء / رد بالإيميل / حذف
// ============================================================

(async function () {
    await window.initLayout('messages');
    const ui = window.dashUi;
    const content = document.getElementById('page-content');

    let rows = [];
    let filter = 'all';
    let viewingId = null;

    content.innerHTML =
        '<div class="dash-card">' +
        '  <div class="dash-card-header">' +
        '    <div>' +
        '      <h2 class="h5 mb-0">Messages</h2>' +
        '      <small class="text-muted" id="m-count"></small>' +
        '    </div>' +
        '    <select class="form-select form-select-sm" id="m-filter" style="width: auto;">' +
        '      <option value="all">All</option>' +
        '      <option value="unread">Unread</option>' +
        '      <option value="read">Read</option>' +
        '    </select>' +
        '  </div>' +
        '  <div class="table-responsive">' +
        '    <table class="table table-dark table-hover align-middle mb-0">' +
        '      <thead><tr>' +
        '        <th>From</th><th>Subject</th><th>Message</th><th>Date</th><th>Status</th><th class="text-end">Actions</th>' +
        '      </tr></thead>' +
        '      <tbody id="m-tbody"></tbody>' +
        '    </table>' +
        '  </div>' +
        '</div>';

    // مودال عرض الرسالة
    let modalEl = document.createElement('div');
    modalEl.id = 'viewMessageModal';
    modalEl.className = 'modal fade';
    modalEl.innerHTML =
        '<div class="modal-dialog modal-dialog-centered modal-lg">' +
        '  <div class="modal-content">' +
        '    <div class="modal-header">' +
        '      <h5 class="modal-title" id="vm-subject"></h5>' +
        '      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
        '    </div>' +
        '    <div class="modal-body">' +
        '      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">' +
        '        <div><strong id="vm-name"></strong> <span class="text-muted small" id="vm-email"></span></div>' +
        '        <span class="text-muted small" id="vm-date"></span>' +
        '      </div>' +
        '      <div style="white-space: pre-wrap;" id="vm-text" class="p-3 rounded" ></div>' +
        '    </div>' +
        '    <div class="modal-footer justify-content-between flex-wrap gap-2">' +
        '      <div class="d-flex gap-2 flex-wrap">' +
        '        <button type="button" class="btn btn-success btn-sm" id="vm-compose"><i class="bi bi-send me-1"></i>Send Email Reply</button>' +
        '        <a class="btn btn-outline-primary btn-sm" id="vm-reply" title="Open in my email app"><i class="bi bi-reply me-1"></i>My Email App</a>' +
        '        <button type="button" class="btn btn-outline-secondary btn-sm" id="vm-copy"><i class="bi bi-clipboard me-1"></i>Copy Email</button>' +
        '      </div>' +
        '      <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>' +
        '    </div>' +
        '    <div class="px-3 pb-3 pt-0">' +
        '      <small class="text-muted"><i class="bi bi-info-circle me-1"></i>The reply opens your email app and reaches the visitor\'s inbox. Clicking Reply marks this message as "Replied".</small>' +
        '    </div>' +
        '  </div>' +
        '</div>';
    document.body.appendChild(modalEl);
    const viewModal = bootstrap.Modal.getOrCreateInstance(modalEl);

    // مودال كتابة الرد المباشر (يتسجل في الداتابيز + يوصل للزائر بالإيميل)
    let composerEl = document.createElement('div');
    composerEl.id = 'composeReplyModal';
    composerEl.className = 'modal fade';
    composerEl.innerHTML =
        '<div class="modal-dialog modal-dialog-centered modal-lg">' +
        '  <div class="modal-content">' +
        '    <div class="modal-header">' +
        '      <h5 class="modal-title"><i class="bi bi-send me-2"></i>Send Email Reply</h5>' +
        '      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
        '    </div>' +
        '    <div class="modal-body">' +
        '      <div class="mb-2 text-muted small" id="cr-to"></div>' +
        '      <textarea class="form-control" id="cr-text" rows="7" placeholder="Write your reply..."></textarea>' +
        '      <div class="form-text"><i class="bi bi-info-circle me-1"></i>The visitor receives this email with the original message quoted below it.</div>' +
        '    </div>' +
        '    <div class="modal-footer">' +
        '      <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>' +
        '      <button type="button" class="btn btn-success btn-sm" id="cr-send"><i class="bi bi-send me-1"></i>Send</button>' +
        '    </div>' +
        '  </div>' +
        '</div>';
    document.body.appendChild(composerEl);
    const composeModal = bootstrap.Modal.getOrCreateInstance(composerEl);

    const tbody = document.getElementById('m-tbody');
    const countEl = document.getElementById('m-count');

    function visibleRows() {
        if (filter === 'unread') return rows.filter(function (r) { return !r.is_read; });
        if (filter === 'read') return rows.filter(function (r) { return r.is_read; });
        return rows;
    }

    function render() {
        const unread = rows.filter(function (r) { return !r.is_read; }).length;
        const replied = rows.filter(function (r) { return r.is_replied; }).length;
        countEl.textContent = rows.length + ' message' + (rows.length === 1 ? '' : 's') +
            ' — ' + unread + ' unread' + (replied ? ' — ' + replied + ' replied' : '');

        const list = visibleRows();
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-5">No messages here.</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(function (m) {
            const shortText = m.text.length > 80 ? m.text.slice(0, 80) + '…' : m.text;
            return '<tr class="' + (m.is_read ? '' : 'fw-semibold') + '">' +
                '<td>' +
                '  <div>' + ui.escapeHtml(m.name) + '</div>' +
                '  <small class="text-muted">' + ui.escapeHtml(m.email) + '</small>' +
                '</td>' +
                '<td style="max-width:180px" class="text-truncate">' + ui.escapeHtml(m.subject || '—') + '</td>' +
                '<td style="max-width:260px" class="text-truncate text-muted">' + ui.escapeHtml(shortText) + '</td>' +
                '<td class="small text-muted" style="white-space:nowrap">' + ui.fmtDate(m.created_at) + '</td>' +
                '<td>' + (m.is_read
                    ? '<span class="badge badge-soft-muted">Read</span>'
                    : '<span class="badge badge-soft-warning">Unread</span>') +
                (m.is_replied ? ' <span class="badge text-bg-success"><i class="bi bi-send-check me-1"></i>Replied</span>' : '') + '</td>' +
                '<td><div class="table-row-actions">' +
                '<button class="btn btn-outline-primary btn-sm" data-action="view" data-id="' + m.id + '" title="View"><i class="bi bi-envelope-open"></i></button>' +
                '<button class="btn btn-outline-secondary btn-sm" data-action="toggle" data-id="' + m.id + '" title="' + (m.is_read ? 'Mark unread' : 'Mark read') + '"><i class="bi ' + (m.is_read ? 'bi-envelope' : 'bi-check2') + '"></i></button>' +
                '<button class="btn btn-outline-success btn-sm" data-action="replied" data-id="' + m.id + '" title="' + (m.is_replied ? 'Mark not replied' : 'Mark replied') + '"><i class="bi bi-send-check"></i></button>' +
                '<button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="' + m.id + '" title="Delete"><i class="bi bi-trash"></i></button>' +
                '</div></td>' +
                '</tr>';
        }).join('');
    }

    async function load() {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">' +
            '<span class="spinner-border spinner-border-sm me-2"></span>Loading…</td></tr>';
        try {
            const data = await window.dashApi.list('messages');
            rows = data.results || [];
            render();
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">' + ui.escapeHtml(err.message) + '</td></tr>';
        }
    }

    async function markRead(id, read) {
        try {
            await window.dashApi.update('messages', id, { is_read: read ? 1 : 0 });
            const row = rows.find(function (r) { return r.id === id; });
            if (row) row.is_read = read ? 1 : 0;
            render();
            // تحديث شارة السايدبار
            const unread = rows.filter(function (r) { return !r.is_read; }).length;
            const badge = document.getElementById('nav-messages-badge');
            if (badge) {
                badge.textContent = unread;
                badge.classList.toggle('d-none', unread === 0);
            }
        } catch (err) {
            ui.toast(err.message, 'danger');
        }
    }

    async function markReplied(id, replied) {
        try {
            await window.dashApi.update('messages', id, { is_replied: replied ? 1 : 0 });
            const row = rows.find(function (r) { return r.id === id; });
            if (row) row.is_replied = replied ? 1 : 0;
            render();
            if (replied) ui.toast('Marked as replied');
        } catch (err) {
            ui.toast(err.message, 'danger');
        }
    }

    document.getElementById('m-filter').addEventListener('change', function () {
        filter = this.value;
        render();
    });

    tbody.addEventListener('click', async function (e) {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const id = Number(btn.dataset.id);
        const row = rows.find(function (r) { return r.id === id; });
        if (!row) return;

        if (btn.dataset.action === 'view') {
            viewingId = id;
            document.getElementById('vm-subject').textContent = row.subject || '(No subject)';
            document.getElementById('vm-name').textContent = row.name;
            document.getElementById('vm-email').textContent = '<' + row.email + '>';
            document.getElementById('vm-date').textContent = ui.fmtDate(row.created_at);
            document.getElementById('vm-text').textContent = row.text;
            document.getElementById('vm-reply').href = 'mailto:' + encodeURIComponent(row.email) +
                '?subject=' + encodeURIComponent('Re: ' + (row.subject || 'Your message'));
            viewModal.show();
            if (!row.is_read) await markRead(id, true);

        } else if (btn.dataset.action === 'toggle') {
            await markRead(id, !row.is_read);

        } else if (btn.dataset.action === 'replied') {
            await markReplied(id, !row.is_replied);

        } else if (btn.dataset.action === 'delete') {
            const ok = await ui.confirmDialog({
                title: 'Delete this message?',
                message: 'This action cannot be undone.',
                confirmText: 'Delete'
            });
            if (!ok) return;
            try {
                await window.dashApi.remove('messages', id);
                ui.toast('Message deleted');
                load();
            } catch (err) {
                ui.toast(err.message, 'danger');
            }
        }
    });

    // الرد بالإيميل من برنامج الإيميل بتاعك → علّم الرسالة "تم الرد"
    document.getElementById('vm-reply').addEventListener('click', function () {
        if (viewingId) markReplied(viewingId, true);
    });

    // فتح مودال الرد المباشر
    document.getElementById('vm-compose').addEventListener('click', function () {
        const row = rows.find(function (r) { return r.id === viewingId; });
        if (!row) return;
        document.getElementById('cr-to').innerHTML =
            'To: <strong>' + ui.escapeHtml(row.name) + '</strong> &lt;' + ui.escapeHtml(row.email) + '&gt;';
        document.getElementById('cr-text').value = '';
        composeModal.show();
    });

    // إرسال الرد المباشر
    document.getElementById('cr-send').addEventListener('click', async function () {
        const btn = this;
        const text = document.getElementById('cr-text').value.trim();
        if (!text) { ui.toast('Write your reply first', 'warning'); return; }
        if (!viewingId) return;

        ui.setLoading(btn, true, 'Sending...');
        try {
            await window.dashApi.jfetch('/admin/messages/' + viewingId + '/reply', {
                method: 'POST',
                body: { text: text }
            });
            ui.toast('Reply sent by email ✓');
            const row = rows.find(function (r) { return r.id === viewingId; });
            if (row) row.is_replied = 1;
            render();
            composeModal.hide();
        } catch (err) {
            ui.toast(err.message, err.status === 412 ? 'warning' : 'danger');
        } finally {
            ui.setLoading(btn, false);
        }
    });

    // نسخ إيميل الراسل
    document.getElementById('vm-copy').addEventListener('click', async function () {
        const email = document.getElementById('vm-email').textContent.replace(/[<>]/g, '');
        try {
            await navigator.clipboard.writeText(email);
            ui.toast('Email copied');
        } catch (e) {
            ui.toast('Copy failed — ' + (e.message || 'not allowed'), 'danger');
        }
    });

    load();
})();
