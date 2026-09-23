// dashboard/core/upload.js
// ============================================================
//  رفع الصور: من جهازك مباشرة إلى Cloudflare R2
//  التشغيل تلقائي: أي [data-upload="key"] يفتح اختيار ملف ويرفع
//  والنتيجة تتحط في الحقل cf-key (أو تُضاف سطر جديد لو textarea)
// ============================================================

(function () {

    function pickFile(callback, accept) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept || 'image/*';
        input.addEventListener('change', function () {
            if (input.files && input.files[0]) callback(input.files[0]);
        });
        input.click();
    }

    async function uploadFile(file) {
        const fd = new FormData();
        fd.append('file', file);

        const res = await fetch('/api/admin/upload', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            body: fd
        });

        let data = null;
        try { data = await res.json(); } catch (e) { /* ignore */ }

        if (!res.ok) {
            const err = new Error((data && data.error) || ('Upload failed (' + res.status + ')'));
            err.status = res.status;
            throw err;
        }
        return data.url;
    }

    document.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-upload]');
        if (!btn) return;

        const key = btn.dataset.upload;
        const field = document.getElementById('cf-' + key);
        if (!field) return;

        pickFile(async function (file) {
            const originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Uploading...';

            try {
                const url = await uploadFile(file);

                if (field.tagName === 'TEXTAREA') {
                    // أضف سطر جديد للصور المتعددة
                    const existing = field.value.trim();
                    field.value = existing ? (existing + '\n' + url) : url;
                } else {
                    field.value = url;
                }
                field.dispatchEvent(new Event('input', { bubbles: true }));
                window.dashUi.toast('File uploaded');
            } catch (err) {
                window.dashUi.toast(err.message, 'danger');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        }, btn.dataset.accept || 'image/*');
    });

    window.dashUpload = { uploadFile: uploadFile, pickFile: pickFile };
})();
