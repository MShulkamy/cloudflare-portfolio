// js/api.js
// ============================================================
//  طبقة الاتصال بالـ API الجديد (Cloudflare D1)
//  fetch فقط — مفيش أي مكتبة خارجية
// ============================================================

(function () {
    const BASE = '/api';

    async function jfetch(path, options) {
        const opts = options || {};
        const res = await fetch(BASE + path, {
            method: opts.method || 'GET',
            credentials: 'same-origin',
            headers: Object.assign(
                { 'X-Requested-With': 'XMLHttpRequest' },
                opts.body ? { 'Content-Type': 'application/json' } : {},
                opts.headers || {}
            ),
            body: opts.body ? JSON.stringify(opts.body) : undefined
        });

        let data = null;
        try { data = await res.json(); } catch (e) { /* body فاضي أو مش JSON */ }

        if (!res.ok) {
            const message = (data && data.error) || ('Request failed (' + res.status + ')');
            const err = new Error(message);
            err.status = res.status;
            throw err;
        }
        return data;
    }

    // كاش لبيانات الموقع العامة — طلب واحد لكل الصفحة بدل ستة
    let sitePromise = null;

    window.api = {
        jfetch: jfetch,

        // كل بيانات الموقع بضربة واحدة (hero, skills, projects, certifications, social_links, testimonials)
        site: function () {
            if (!sitePromise) {
                sitePromise = jfetch('/public/site').catch(err => {
                    sitePromise = null; // نسمح بإعادة المحاولة بعد فشل
                    throw err;
                });
            }
            return sitePromise;
        },

        // إرسال تقييم من زائر
        submitTestimonial: function (payload) {
            return jfetch('/public/testimonials', { method: 'POST', body: payload });
        },

        // إرسال رسالة من زائر
        submitMessage: function (payload) {
            return jfetch('/public/messages', { method: 'POST', body: payload });
        }
    };
})();
