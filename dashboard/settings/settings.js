// dashboard/settings/settings.js
// ============================================================
//  إعدادات الحساب: تغيير كلمة السر
// ============================================================

(async function () {
    const me = await window.initLayout('settings');
    const ui = window.dashUi;
    const content = document.getElementById('page-content');

    content.innerHTML =
        '<div class="dash-card" style="max-width: 560px;">' +
        '  <div class="dash-card-header">' +
        '    <div>' +
        '      <h2 class="h5 mb-0">Account Settings</h2>' +
        '      <small class="text-muted">Logged in as ' + ui.escapeHtml(me.email) + '</small>' +
        '    </div>' +
        '  </div>' +
        '  <div class="dash-card-body">' +
        '    <h3 class="h6 mb-3"><i class="bi bi-shield-lock me-1"></i>Change Password</h3>' +
        '    <div class="mb-3">' +
        '      <label class="form-label" for="pw-current">Current Password</label>' +
        '      <input type="password" class="form-control" id="pw-current" autocomplete="current-password">' +
        '    </div>' +
        '    <div class="mb-3">' +
        '      <label class="form-label" for="pw-new">New Password</label>' +
        '      <input type="password" class="form-control" id="pw-new" autocomplete="new-password" minlength="8">' +
        '      <div class="form-text">8 حروف على الأقل — وبعد التغيير هتتسجّل خروجك من كل الأجهزة</div>' +
        '    </div>' +
        '    <div class="mb-4">' +
        '      <label class="form-label" for="pw-confirm">Confirm New Password</label>' +
        '      <input type="password" class="form-control" id="pw-confirm" autocomplete="new-password">' +
        '    </div>' +
        '    <button class="btn btn-primary" id="pw-save"><i class="bi bi-check-lg me-1"></i>Change Password</button>' +
        '  </div>' +
        '</div>' +
        '<div class="dash-card mt-4" style="max-width: 560px;">' +
        '  <div class="dash-card-header">' +
        '    <div>' +
        '      <h2 class="h5 mb-0">Backup</h2>' +
        '      <small class="text-muted">نسخة كاملة من محتوى الموقع</small>' +
        '    </div>' +
        '  </div>' +
        '  <div class="dash-card-body">' +
        '    <p class="text-muted small mb-3">حمّل ملف JSON فيه كل المحتوى: المهارات، المشاريع، الخبرات، الشهادات، التقييمات، الرسائل وروابط التواصل — احتفظ بيه كنسخة احتياطية في أي وقت.</p>' +
        '    <button class="btn btn-outline-primary" id="backup-btn"><i class="bi bi-download me-1"></i>Download Backup (JSON)</button>' +
        '  </div>' +
        '</div>';

    // --- النسخة الاحتياطية ---
    document.getElementById('backup-btn').addEventListener('click', async function () {
        const btn = this;
        ui.setLoading(btn, true, 'Preparing...');
        try {
            const data = await window.dashApi.jfetch('/admin/export');
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'portfolio-backup-' + new Date().toISOString().slice(0, 10) + '.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            ui.toast('Backup downloaded');
        } catch (err) {
            ui.toast(err.message, 'danger');
        } finally {
            ui.setLoading(btn, false);
        }
    });

    document.getElementById('pw-save').addEventListener('click', async function () {
        const btn = this;
        const current = document.getElementById('pw-current').value;
        const next = document.getElementById('pw-new').value;
        const confirm = document.getElementById('pw-confirm').value;

        if (!current) return ui.toast('Enter your current password', 'warning');
        if (next.length < 8) return ui.toast('New password must be at least 8 characters', 'warning');
        if (next !== confirm) return ui.toast('Passwords do not match', 'warning');

        ui.setLoading(btn, true, 'Changing...');
        try {
            await window.dashApi.changePassword(current, next);
            ui.toast('Password changed — logging you out...');
            setTimeout(function () { location.replace('../auth/login.html'); }, 1500);
        } catch (err) {
            ui.toast(err.message, 'danger');
            ui.setLoading(btn, false);
        }
    });
})();
