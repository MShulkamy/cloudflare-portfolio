// dashboard/auth/login.js
// ============================================================
//  صفحة الدخول — وفيها وضع "التهيئة الأولى" لو مفيش أدمن
// ============================================================

(async function () {

    const alertBox = document.getElementById('login-alert');
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const confirmInput = document.getElementById('login-confirm');
    const submitBtn = document.getElementById('login-submit');

    let mode = 'login'; // أو 'setup'

    function showAlert(message, type) {
        alertBox.className = 'alert alert-' + (type || 'danger') + ' py-2 small';
        alertBox.textContent = message;
    }
    function hideAlert() {
        alertBox.className = 'alert d-none py-2 small';
    }

    // --- 1. تحديد الوضع (دخول عادي / تهيئة أولى) ---
    try {
        const status = await window.dashApi.status();

        if (status.authenticated) {
            location.replace('../testimonials/testimonials.html');
            return;
        }

        if (status.needs_setup) {
            mode = 'setup';
            document.getElementById('login-title').textContent = 'First Time Setup';
            document.getElementById('login-subtitle').textContent = 'Create your admin account — مرة واحدة بس';
            document.getElementById('confirm-group').classList.remove('d-none');
            submitBtn.textContent = 'Create Admin Account';
        }
    } catch (err) {
        showAlert('Cannot reach the server. Make sure it is running.');
    }

    // --- 2. الإرسال ---
    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        hideAlert();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) return showAlert('Please fill in all fields.');
        if (password.length < 8) return showAlert('Password must be at least 8 characters.');

        if (mode === 'setup') {
            const confirm = confirmInput.value;
            if (password !== confirm) return showAlert('Passwords do not match.');
        }

        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Please wait...';

        try {
            if (mode === 'setup') {
                await window.dashApi.jfetch('/auth/setup', { method: 'POST', body: { email: email, password: password } });
            }
            await window.dashApi.login(email, password);
            location.replace('../testimonials/testimonials.html');

        } catch (err) {
            showAlert(err.message);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

})();
