// dashboard/core/api.js
// ============================================================
//  طبقة الاتصال بالـ API للداشبورد
//  مبني على fetch — بيستخدم الكوكيز (نفس الأصل)
// ============================================================

(function () {
    async function jfetch(path, options) {
        const opts = options || {};
        const res = await fetch('/api' + path, {
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
        try { data = await res.json(); } catch (e) { /* مش JSON */ }

        if (!res.ok) {
            const err = new Error((data && data.error) || ('Request failed (' + res.status + ')'));
            err.status = res.status;
            throw err;
        }
        return data;
    }

    window.dashApi = {
        jfetch: jfetch,

        // --- Auth ---
        status: function () { return jfetch('/auth/status'); },
        login: function (email, password) { return jfetch('/auth/login', { method: 'POST', body: { email: email, password: password } }); },
        logout: function () { return jfetch('/auth/logout', { method: 'POST' }); },
        me: function () { return jfetch('/auth/me'); },
        changePassword: function (currentPwd, newPwd) { return jfetch('/auth/password', { method: 'POST', body: { current: currentPwd, new: newPwd } }); },

        // --- CRUD ---
        list: function (table) { return jfetch('/admin/' + table); },
        get: function (table, id) { return jfetch('/admin/' + table + '/' + id); },
        create: function (table, payload) { return jfetch('/admin/' + table, { method: 'POST', body: payload }); },
        update: function (table, id, payload) { return jfetch('/admin/' + table + '/' + id, { method: 'PUT', body: payload }); },
        remove: function (table, id) { return jfetch('/admin/' + table + '/' + id, { method: 'DELETE' }); }
    };
})();
