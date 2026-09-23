// dashboard/core/icon-picker.js
// ============================================================
//  مكتبة الأيقونات: بحث + تصنيفات + معاينة — تفتح من زر Browse
//  التشغيل تلقائي: أي [data-iconpicker="key"] يفتح المكتبة ويحط
//  القيمة في الحقل cf-key
// ============================================================

(function () {
    let modalEl = null;
    let modal = null;
    let activeInput = null;
    let activeGroup = 'all';
    let searchTerm = '';

    function ensureModal() {
        if (modalEl) return;

        modalEl = document.createElement('div');
        modalEl.id = 'iconPickerModal';
        modalEl.className = 'modal fade';
        modalEl.innerHTML =
            '<div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">' +
            '  <div class="modal-content">' +
            '    <div class="modal-header">' +
            '      <h5 class="modal-title"><i class="bi bi-grid-3x3-gap me-2"></i>Choose an Icon</h5>' +
            '      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
            '    </div>' +
            '    <div class="modal-body pt-2">' +
            '      <input type="text" class="form-control mb-3" id="icon-search" placeholder="ابحث: react, python, docker, people..." autocomplete="off">' +
            '      <div class="icon-tabs d-flex flex-wrap gap-1 mb-3" id="icon-tabs"></div>' +
            '      <div class="icon-grid" id="icon-grid"></div>' +
            '    </div>' +
            '    <div class="modal-footer justify-content-between">' +
            '      <small class="text-muted" id="icon-count"></small>' +
            '      <div>' +
            '        <button type="button" class="btn btn-outline-danger btn-sm" id="icon-clear">Remove Icon</button>' +
            '        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>';
        document.body.appendChild(modalEl);

        modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        const searchEl = modalEl.querySelector('#icon-search');
        const tabsEl = modalEl.querySelector('#icon-tabs');
        const gridEl = modalEl.querySelector('#icon-grid');
        const countEl = modalEl.querySelector('#icon-count');

        // --- التصنيفات ---
        const groups = (window.DASH_ICONS && window.DASH_ICONS.groups) || [];

        function renderTabs() {
            const tabs = [{ key: 'all', label: 'All' }].concat(groups.map(function (g) {
                return { key: g.key, label: g.label };
            }));
            tabsEl.innerHTML = tabs.map(function (t) {
                return '<button type="button" class="btn btn-sm ' +
                    (t.key === activeGroup ? 'btn-primary' : 'btn-outline-secondary') +
                    '" data-group="' + t.key + '">' + t.label + '</button>';
            }).join('');
        }

        // --- الشبكة ---
        function currentItems() {
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const out = [];
                groups.forEach(function (g) {
                    g.items.forEach(function (it) {
                        if ((it.n + ' ' + it.c).toLowerCase().includes(term)) out.push(it);
                    });
                });
                return out;
            }
            if (activeGroup === 'all') {
                const out = [];
                groups.forEach(function (g) { g.items.forEach(function (it) { out.push(it); }); });
                return out;
            }
            const g = groups.find(function (x) { return x.key === activeGroup; });
            return g ? g.items : [];
        }

        function renderGrid() {
            const items = currentItems();
            const selected = activeInput ? activeInput.value.trim() : '';
            countEl.textContent = items.length + ' icons';

            if (!items.length) {
                gridEl.innerHTML = '<div class="text-center text-muted py-5">No icons match your search.</div>';
                return;
            }

            gridEl.innerHTML = items.map(function (it) {
                const isSelected = (selected === it.c) || (selected === it.c.replace(' colored', ''));
                const glyph = it.c.startsWith('bi-')
                    ? '<i class="' + it.c + '"></i>'
                    : '<i class="' + it.c + '"></i>';
                return '<button type="button" class="icon-cell' + (isSelected ? ' selected' : '') + '" data-cls="' + window.dashUi.escapeHtml(it.c) + '" title="' + window.dashUi.escapeHtml(it.n + ' — ' + it.c) + '">' +
                    '<span class="icon-cell-glyph">' + glyph + '</span>' +
                    '<span class="icon-cell-name">' + window.dashUi.escapeHtml(it.n) + '</span>' +
                    '</button>';
            }).join('');
        }

        // --- الأحداث ---
        tabsEl.addEventListener('click', function (e) {
            const btn = e.target.closest('button[data-group]');
            if (!btn) return;
            activeGroup = btn.dataset.group;
            searchTerm = '';
            searchEl.value = '';
            renderTabs();
            renderGrid();
        });

        searchEl.addEventListener('input', function () {
            searchTerm = this.value.trim();
            renderGrid();
        });

        gridEl.addEventListener('click', function (e) {
            const cell = e.target.closest('.icon-cell');
            if (!cell || !activeInput) return;
            activeInput.value = cell.dataset.cls;
            activeInput.dispatchEvent(new Event('input', { bubbles: true }));
            modal.hide();
        });

        modalEl.querySelector('#icon-clear').addEventListener('click', function () {
            if (!activeInput) return;
            activeInput.value = '';
            activeInput.dispatchEvent(new Event('input', { bubbles: true }));
            modal.hide();
        });

        // خزّن الدوال على المودال لإعادة الاستخدام
        modalEl._renderTabs = renderTabs;
        modalEl._renderGrid = renderGrid;
    }

    function open(inputEl) {
        ensureModal();
        activeInput = inputEl;
        searchTerm = '';
        const searchEl = modalEl.querySelector('#icon-search');
        searchEl.value = '';

        // اختر تصنيف افتراضي مناسب حسب الحقل
        const key = inputEl.id.replace(/^cf-/, '');
        activeGroup = 'all';

        modalEl._renderTabs();
        modalEl._renderGrid();
        modal.show();

        // فوكس على البحث بعد فتح المودال
        modalEl.addEventListener('shown.bs.modal', function onShown() {
            modalEl.removeEventListener('shown.bs.modal', onShown);
            searchEl.focus();
        });
    }

    window.dashIconPicker = { open: open };

    // فتح المكتبة من أي زر Browse
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-iconpicker]');
        if (!btn) return;
        const input = document.getElementById('cf-' + btn.dataset.iconpicker);
        if (input) open(input);
    });
})();
