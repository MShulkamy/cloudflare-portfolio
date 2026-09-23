// js/track.js
// ============================================================
//  عدّاد الزوار — مجهول الهوية تماماً (بدون IP، بدون كوكيز)
//  بيعمل معرف عشوائي في المتصفح بس، وبيبعت زيارة واحدة لكل صفحة.
// ============================================================

(function () {
    try {
        // معرف عشوائي للزائر (يتولد مرة ويتخزن محليًا)
        let vid = localStorage.getItem('site-visitor');
        if (!vid) {
            vid = (window.crypto && crypto.randomUUID)
                ? crypto.randomUUID().replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
                : (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)).replace(/[^a-zA-Z0-9]/g, '');
            localStorage.setItem('site-visitor', vid);
        }

        fetch('/api/public/track', {
            method: 'POST',
            keepalive: true,
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
                path: location.pathname,
                referrer: document.referrer || '',
                visitor: vid
            })
        }).catch(function () { /* صامت — مش مشكلة لو فشل */ });
    } catch (e) { /* صامت */ }
})();
