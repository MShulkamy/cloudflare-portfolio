// js/utils.js
// أدوات مشتركة: حماية XSS + حالات العرض (فاضي / خطأ)

// --- 1. تهريب HTML (الحماية من XSS) ---
// أي بيانات جاية من المستخدمين أو من الداتابيز لازم تعدي من هنا قبل ما تتحط في HTML
window.escapeHtml = function (value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// --- 2. تأمين الروابط ---
// بس الروابط المسموحة (http/https/mailto/tel/روابط داخلية) — أي حاجة تانية تتحول لـ '#'
window.safeUrl = function (value) {
    if (!value) return '#';
    const url = String(value).trim();
    if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(url)) return url;
    return '#';
};

// --- 3. رسالة حالة (فاضي / خطأ / تحميل) جوه أي حاوية ---
window.setContainerMessage = function (selector, message, icon) {
    const iconHtml = icon
        ? `<i class="bi ${icon} fs-1 d-block mb-2 opacity-50"></i>`
        : '';
    $(selector).html(
        `<div class="col-12 text-center text-muted py-5">${iconHtml}${window.escapeHtml(message)}</div>`
    );
};

// --- 4. توست (إشعار صغير أنيق) — بديل الـ alert() ---
// الاستخدام: window.showToast('تم الإرسال', 'success') — أو danger / warning / info
window.showToast = function (message, type) {
    type = type || 'success';
    const colors = {
        success: '#22c55e',
        danger: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };

    let box = document.getElementById('app-toast-box');
    if (!box) {
        box = document.createElement('div');
        box.id = 'app-toast-box';
        box.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;' +
            'display:flex;flex-direction:column;gap:10px;align-items:center;pointer-events:none;' +
            'width:calc(100% - 32px);max-width:440px;';
        document.body.appendChild(box);
    }

    const el = document.createElement('div');
    el.style.cssText = 'pointer-events:auto;width:100%;background:#111827;color:#fff;' +
        'border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:13px 18px;font-size:.93rem;' +
        'box-shadow:0 10px 30px rgba(0,0,0,.4);display:flex;align-items:center;gap:10px;' +
        'border-inline-start:4px solid ' + (colors[type] || colors.info) + ';' +
        'opacity:0;transform:translateY(14px);transition:all .25s ease;';
    el.innerHTML = '<span style="flex:1;line-height:1.6">' + window.escapeHtml(message) + '</span>';
    box.appendChild(el);

    requestAnimationFrame(function () {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    });

    setTimeout(function () {
        el.style.opacity = '0';
        el.style.transform = 'translateY(14px)';
        setTimeout(function () { el.remove(); }, 300);
    }, 4200);
};
