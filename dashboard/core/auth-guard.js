// dashboard/core/auth-guard.js
// ============================================================
//  حماية الصفحات: مفيش دخول = تحويل فوري لصفحة تسجيل الدخول
// ============================================================

window.requireAuth = async function () {
    try {
        return await window.dashApi.me();
    } catch (err) {
        if (err.status === 401) {
            location.replace('../auth/login.html');
            // أوقف أي كود تابع لحد ما التحويل يتم
            await new Promise(function () {});
        }
        throw err;
    }
};
