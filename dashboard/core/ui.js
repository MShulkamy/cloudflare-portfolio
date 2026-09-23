// dashboard/core/ui.js
// ============================================================
//  أدوات واجهة مشتركة: تهريب HTML، toast، تأكيد، تحميل، تواريخ
// ============================================================

(function () {

    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function safeUrl(value) {
        if (!value) return '#';
        const url = String(value).trim();
        if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(url)) return url;
        return '#';
    }

    // تواريخ SQLite بتيجي 'YYYY-MM-DD HH:MM:SS' بتوقيت UTC
    function fmtDate(value) {
        if (!value) return '—';
        let iso = String(value).replace(' ', 'T');
        if (!iso.includes('Z') && !iso.includes('+')) iso += 'Z';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return String(value);
        return d.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // --- Toast ---
    let toastContainer = null;
    function toast(message, type) {
        type = type || 'success';
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '2000';
            document.body.appendChild(toastContainer);
        }
        const colors = {
            success: 'text-bg-success',
            danger: 'text-bg-danger',
            info: 'text-bg-primary',
            warning: 'text-bg-warning'
        };
        const el = document.createElement('div');
        el.className = 'toast align-items-center border-0 ' + (colors[type] || colors.info);
        el.setAttribute('role', 'alert');
        el.innerHTML =
            '<div class="d-flex">' +
            '<div class="toast-body">' + escapeHtml(message) + '</div>' +
            '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>' +
            '</div>';
        toastContainer.appendChild(el);
        const t = new bootstrap.Toast(el, { delay: 3500 });
        t.show();
        el.addEventListener('hidden.bs.toast', function () { el.remove(); });
    }

    // --- Confirm Dialog (Promise) ---
    function confirmDialog(opts) {
        opts = opts || {};
        return new Promise(function (resolve) {
            let modalEl = document.getElementById('dashConfirmModal');
            if (!modalEl) {
                modalEl = document.createElement('div');
                modalEl.id = 'dashConfirmModal';
                modalEl.className = 'modal fade';
                modalEl.innerHTML =
                    '<div class="modal-dialog modal-dialog-centered modal-sm">' +
                    '<div class="modal-content">' +
                    '<div class="modal-header border-0 pb-0">' +
                    '<h6 class="modal-title" id="dashConfirmTitle"></h6>' +
                    '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
                    '</div>' +
                    '<div class="modal-body py-3" id="dashConfirmMessage"></div>' +
                    '<div class="modal-footer border-0 pt-0">' +
                    '<button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>' +
                    '<button type="button" class="btn btn-danger btn-sm" id="dashConfirmOk">Delete</button>' +
                    '</div></div></div>';
                document.body.appendChild(modalEl);
            }

            const titleEl = modalEl.querySelector('#dashConfirmTitle');
            const msgEl = modalEl.querySelector('#dashConfirmMessage');
            const okBtn = modalEl.querySelector('#dashConfirmOk');

            titleEl.textContent = opts.title || 'Are you sure?';
            msgEl.textContent = opts.message || '';
            okBtn.textContent = opts.confirmText || 'Delete';
            okBtn.className = 'btn btn-sm ' + (opts.danger === false ? 'btn-primary' : 'btn-danger');

            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            let settled = false;

            function onOk() { settled = true; modal.hide(); resolve(true); }
            function onHidden() { cleanup(); if (!settled) resolve(false); }
            function cleanup() {
                okBtn.removeEventListener('click', onOk);
                modalEl.removeEventListener('hidden.bs.modal', onHidden);
            }

            okBtn.addEventListener('click', onOk);
            modalEl.addEventListener('hidden.bs.modal', onHidden);
            modal.show();
        });
    }

    // --- Loading state للأزرار ---
    function setLoading(btn, loading, loadingText) {
        if (loading) {
            btn.dataset.originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>' + escapeHtml(loadingText || 'Saving...');
        } else {
            btn.disabled = false;
            if (btn.dataset.originalHtml) btn.innerHTML = btn.dataset.originalHtml;
        }
    }

    // --- معاينة أيقونة/صورة (تُستخدم في الفورم وقائمة الأيقونات) ---
    function iconPreviewHtml(value, size) {
        if (!value) return '<i class="bi bi-question-circle text-muted"></i>';
        const v = String(value).trim();
        const isImage = v.includes('/') || v.includes('.') || v.startsWith('http');
        if (isImage) {
            return '<img src="' + escapeHtml(safeUrl(v)) + '" style="width:' + (size || 20) + 'px;height:' + (size || 20) + 'px;object-fit:contain;border-radius:4px;">';
        }
        return '<i class="' + escapeHtml(v) + '"></i>';
    }

    // --- بناء حقول الفورم ---
    // fields: [{ key, label, type, required, help, col, rows, options, default }]
    // types: text | url | number | textarea | select | tags | lines | icon | image
    function buildFormFields(container, fields, row) {
        container.innerHTML = fields.map(function (f) {
            const colClass = f.col || 'col-md-6';
            let val = '';
            if (row && row[f.key] !== undefined && row[f.key] !== null) {
                val = row[f.key];
            } else if (f.default !== undefined) {
                val = f.default;
            }
            // تحويل المصفوفات لعرض نصي
            if ((f.type === 'tags' || f.type === 'lines') && Array.isArray(val)) {
                val = val.join(f.type === 'tags' ? ', ' : '\n');
            }

            let inputHtml = '';

            if (f.type === 'icon' || f.type === 'image' || f.type === 'file') {
                const isIcon = f.type === 'icon';
                const isPdf = String(val).toLowerCase().endsWith('.pdf');
                const preview = (f.type === 'file' && isPdf)
                    ? '<i class="bi bi-file-earmark-pdf text-danger"></i>'
                    : iconPreviewHtml(val);

                let buttons = '';
                if (isIcon) {
                    buttons = '<button type="button" class="btn btn-outline-secondary" data-iconpicker="' + f.key + '" title="اختر من مكتبة الأيقونات"><i class="bi bi-grid-3x3-gap"></i></button>' +
                              '<button type="button" class="btn btn-outline-secondary" data-upload="' + f.key + '" title="ارفع صورة"><i class="bi bi-upload"></i></button>';
                } else if (f.type === 'file') {
                    buttons = '<button type="button" class="btn btn-outline-secondary" data-upload="' + f.key + '" data-accept=".pdf,application/pdf"><i class="bi bi-upload me-1"></i>Upload PDF</button>';
                } else {
                    buttons = '<button type="button" class="btn btn-outline-secondary" data-upload="' + f.key + '"><i class="bi bi-upload me-1"></i>Upload</button>';
                }

                inputHtml =
                    '<div class="input-group">' +
                    '<span class="input-group-text icon-preview" id="ip-' + f.key + '">' + preview + '</span>' +
                    '<input type="text" class="form-control icon-field-input" id="cf-' + f.key + '" value="' + escapeHtml(val) + '" placeholder="' + (isIcon ? 'devicon-react-original colored' : 'https://...') + '">' +
                    buttons +
                    '</div>';

            } else if (f.type === 'textarea' || f.type === 'lines') {
                inputHtml = '<textarea class="form-control icon-field-input" rows="' + (f.rows || 3) + '" id="cf-' + f.key + '">' + escapeHtml(val) + '</textarea>';
                if (f.upload) {
                    inputHtml += '<div class="mt-1"><button type="button" class="btn btn-outline-secondary btn-sm" data-upload="' + f.key + '"><i class="bi bi-upload me-1"></i>Upload Image</button></div>';
                }

            } else if (f.type === 'checkbox') {
                const checked = (val === true || val === 1 || val === '1');
                inputHtml = '<div class="form-check form-switch pt-2">' +
                    '<input class="form-check-input" type="checkbox" id="cf-' + f.key + '" style="cursor:pointer"' + (checked ? ' checked' : '') + '>' +
                    '</div>';

            } else if (f.type === 'select') {
                inputHtml = '<select class="form-select" id="cf-' + f.key + '">' +
                    (f.options || []).map(function (o) {
                        return '<option value="' + escapeHtml(o[0]) + '"' + (String(val) === String(o[0]) ? ' selected' : '') + '>' + escapeHtml(o[1]) + '</option>';
                    }).join('') + '</select>';

            } else if (f.type === 'number') {
                inputHtml = '<input type="number" class="form-control" id="cf-' + f.key + '" value="' + escapeHtml(val) + '">';

            } else {
                inputHtml = '<input type="' + (f.type === 'url' ? 'url' : 'text') + '" class="form-control" id="cf-' + f.key + '" value="' + escapeHtml(val) + '">';
            }

            return '<div class="' + colClass + '">' +
                '<label class="form-label" for="cf-' + f.key + '">' + escapeHtml(f.label) + (f.required ? ' *' : '') + '</label>' +
                inputHtml +
                (f.help ? '<div class="form-text">' + escapeHtml(f.help) + '</div>' : '') +
                '</div>';
        }).join('');
    }

    // --- قراءة قيم الفورم ---
    function readFormFields(fields) {
        const payload = {};
        fields.forEach(function (f) {
            const el = document.getElementById('cf-' + f.key);
            if (!el) return;
            let v = el.value;
            if (f.type === 'number') v = v === '' ? 0 : Number(v);
            else if (f.type === 'checkbox') v = el.checked ? 1 : 0;
            else if (f.type === 'tags') v = v.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
            else if (f.type === 'lines') v = v.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
            payload[f.key] = v;
        });
        return payload;
    }

    // --- معاينة حية لأي حقل أيقونة/صورة أثناء الكتابة ---
    document.addEventListener('input', function (e) {
        const el = e.target;
        if (!el.classList || !el.classList.contains('icon-field-input') || el.tagName === 'TEXTAREA') return;
        const preview = document.getElementById('ip-' + el.id.replace(/^cf-/, ''));
        if (!preview) return;
        const v = String(el.value).toLowerCase();
        preview.innerHTML = v.endsWith('.pdf')
            ? '<i class="bi bi-file-earmark-pdf text-danger"></i>'
            : iconPreviewHtml(el.value);
    });

    window.dashUi = {
        escapeHtml: escapeHtml,
        safeUrl: safeUrl,
        fmtDate: fmtDate,
        toast: toast,
        confirmDialog: confirmDialog,
        setLoading: setLoading,
        buildFormFields: buildFormFields,
        readFormFields: readFormFields,
        iconPreviewHtml: iconPreviewHtml
    };
})();
