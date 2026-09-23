// dashboard/core/crud-page.js
// ============================================================
//  محرك CRUD عام — جدول + مودال إضافة/تعديل + حذف بتأكيد
//  الاستخدام: initCrudPage({ table, title, itemName, columns, fields })
// ============================================================

window.initCrudPage = function (config) {
    const ui = window.dashUi;
    const table = config.table;
    const itemName = config.itemName || 'Item';
    const state = { rows: [], editingId: null };

    const container = document.getElementById('page-content');
    if (!container) return;

    // ---- هيكل الصفحة ----
    container.innerHTML =
        '<div class="dash-card">' +
        '  <div class="dash-card-header">' +
        '    <div>' +
        '      <h2 class="h5 mb-0">' + ui.escapeHtml(config.title) + '</h2>' +
        '      <small class="text-muted" id="crud-count"></small>' +
        '    </div>' +
        '    <button class="btn btn-primary btn-sm" id="crud-add"><i class="bi bi-plus-lg me-1"></i>' + ui.escapeHtml(config.addLabel || ('Add ' + itemName)) + '</button>' +
        '  </div>' +
        '  <div class="table-responsive">' +
        '    <table class="table table-dark table-hover align-middle mb-0">' +
        '      <thead><tr>' +
        config.columns.map(function (c) { return '<th>' + ui.escapeHtml(c.label) + '</th>'; }).join('') +
        '      <th class="text-end">Actions</th>' +
        '      </tr></thead>' +
        '      <tbody id="crud-tbody"></tbody>' +
        '    </table>' +
        '  </div>' +
        '</div>';

    const tbody = document.getElementById('crud-tbody');
    const countEl = document.getElementById('crud-count');

    // ---- المودال ----
    let modalEl = document.getElementById('crudModal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'crudModal';
        modalEl.className = 'modal fade';
        modalEl.innerHTML =
            '<div class="modal-dialog modal-dialog-centered modal-lg">' +
            '  <div class="modal-content">' +
            '    <div class="modal-header">' +
            '      <h5 class="modal-title" id="crud-modal-title"></h5>' +
            '      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
            '    </div>' +
            '    <div class="modal-body"><div class="row g-3" id="crud-form-fields"></div></div>' +
            '    <div class="modal-footer">' +
            '      <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>' +
            '      <button type="button" class="btn btn-primary" id="crud-save">Save</button>' +
            '    </div>' +
            '  </div>' +
            '</div>';
        document.body.appendChild(modalEl);
    }
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const formFields = document.getElementById('crud-form-fields');
    const modalTitle = document.getElementById('crud-modal-title');
    const saveBtn = document.getElementById('crud-save');

    // ---- الرسم ----
    function renderRows() {
        if (!state.rows.length) {
            tbody.innerHTML = '<tr><td colspan="' + (config.columns.length + 1) + '" class="text-center text-muted py-5">' +
                'Nothing here yet. Click "' + ui.escapeHtml(config.addLabel || ('Add ' + itemName)) + '" to create the first one.' +
                '</td></tr>';
            return;
        }
        tbody.innerHTML = state.rows.map(function (row, index) {
            const cells = config.columns.map(function (c) {
                const rendered = c.render ? c.render(row) : ui.escapeHtml(row[c.key]);
                return '<td>' + rendered + '</td>';
            }).join('');

            const sortBtns = config.sortable
                ? '<button class="btn btn-outline-secondary btn-sm" data-action="up" data-id="' + row.id + '" title="Move up"' + (index === 0 ? ' disabled' : '') + '><i class="bi bi-arrow-up"></i></button>' +
                  '<button class="btn btn-outline-secondary btn-sm" data-action="down" data-id="' + row.id + '" title="Move down"' + (index === state.rows.length - 1 ? ' disabled' : '') + '><i class="bi bi-arrow-down"></i></button>'
                : '';

            return '<tr>' + cells +
                '<td><div class="table-row-actions">' +
                sortBtns +
                '<button class="btn btn-outline-secondary btn-sm" data-action="edit" data-id="' + row.id + '" title="Edit"><i class="bi bi-pencil"></i></button>' +
                '<button class="btn btn-outline-danger btn-sm" data-action="delete" data-id="' + row.id + '" title="Delete"><i class="bi bi-trash"></i></button>' +
                '</div></td></tr>';
        }).join('');
    }

    // ---- التحميل ----
    async function load() {
        tbody.innerHTML = '<tr><td colspan="' + (config.columns.length + 1) + '" class="text-center text-muted py-4">' +
            '<span class="spinner-border spinner-border-sm me-2"></span>Loading…</td></tr>';
        try {
            const data = await window.dashApi.list(table);
            state.rows = data.results || [];
            countEl.textContent = state.rows.length + ' item' + (state.rows.length === 1 ? '' : 's');
            renderRows();
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="' + (config.columns.length + 1) + '" class="text-center text-danger py-4">' +
                ui.escapeHtml(err.message) + '</td></tr>';
        }
    }

    // ---- الأحداث ----
    document.getElementById('crud-add').addEventListener('click', function () {
        state.editingId = null;
        modalTitle.textContent = 'Add ' + itemName;
        ui.buildFormFields(formFields, config.fields, null);
        modal.show();
    });

    tbody.addEventListener('click', async function (e) {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const id = Number(btn.dataset.id);
        const row = state.rows.find(function (r) { return r.id === id; });
        if (!row) return;

        // ترتيب ▲▼ — تبديل مكان الصف مع اللي فوقه/تحته وإعادة ترقيم order
        if (btn.dataset.action === 'up' || btn.dataset.action === 'down') {
            const idx = state.rows.findIndex(function (r) { return r.id === id; });
            const swapIdx = btn.dataset.action === 'up' ? idx - 1 : idx + 1;
            if (idx < 0 || swapIdx < 0 || swapIdx >= state.rows.length) return;

            const arr = state.rows.slice();
            const tmp = arr[idx]; arr[idx] = arr[swapIdx]; arr[swapIdx] = tmp;

            try {
                const updates = [];
                arr.forEach(function (r, i) {
                    const newOrder = (i + 1) * 10;
                    if (Number(r.order) !== newOrder) updates.push(window.dashApi.update(table, r.id, { order: newOrder }));
                });
                await Promise.all(updates);
                load();
            } catch (err) {
                ui.toast(err.message, 'danger');
            }
            return;
        }

        if (btn.dataset.action === 'edit') {
            state.editingId = id;
            modalTitle.textContent = 'Edit ' + itemName;
            ui.buildFormFields(formFields, config.fields, row);
            modal.show();

        } else if (btn.dataset.action === 'delete') {
            const ok = await ui.confirmDialog({
                title: 'Delete ' + itemName + '?',
                message: 'This action cannot be undone.',
                confirmText: 'Delete'
            });
            if (!ok) return;
            try {
                await window.dashApi.remove(table, id);
                ui.toast(itemName + ' deleted');
                load();
            } catch (err) {
                ui.toast(err.message, 'danger');
            }
        }
    });

    saveBtn.addEventListener('click', async function () {
        // تحقق بسيط من الحقول المطلوبة
        for (let i = 0; i < config.fields.length; i++) {
            const f = config.fields[i];
            const el = document.getElementById('cf-' + f.key);
            if (f.required && el && !String(el.value).trim()) {
                ui.toast(f.label + ' is required', 'warning');
                el.focus();
                return;
            }
        }

        const payload = ui.readFormFields(config.fields);
        ui.setLoading(saveBtn, true, 'Saving...');
        try {
            if (state.editingId) {
                await window.dashApi.update(table, state.editingId, payload);
            } else {
                await window.dashApi.create(table, payload);
            }
            ui.toast(itemName + ' saved');
            modal.hide();
            state.editingId = null;
            load();
        } catch (err) {
            ui.toast(err.message, 'danger');
        } finally {
            ui.setLoading(saveBtn, false);
        }
    });

    // ---- ابدأ ----
    load();
};
