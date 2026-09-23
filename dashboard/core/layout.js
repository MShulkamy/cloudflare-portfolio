// dashboard/core/layout.js
// ============================================================
//  الهيكل المشترك: السايدبار + التوب بار + تسجيل الخروج
//  كل صفحة بتنادي: const me = await initLayout('skills');
// ============================================================

window.initLayout = async function (activeKey) {

    // 1. حماية الصفحة (تحويل لو مش مسجل دخول)
    const me = await window.requireAuth();

    // 2. عناصر القائمة
    const nav = [
        { key: 'testimonials',   label: 'Testimonials',   icon: 'bi-chat-quote',       href: '../testimonials/testimonials.html', badgeId: 'nav-pending-badge' },
        { key: 'messages',       label: 'Messages',       icon: 'bi-envelope',         href: '../messages/messages.html', badgeId: 'nav-messages-badge' },
        { key: 'analytics',      label: 'Analytics',      icon: 'bi-bar-chart-line',   href: '../analytics/analytics.html' },
        { key: 'hero',           label: 'Hero Section',   icon: 'bi-person-badge',     href: '../hero/hero.html' },
        { key: 'skills',         label: 'Skills',         icon: 'bi-lightning-charge', href: '../skills/skills.html' },
        { key: 'projects',       label: 'Projects',       icon: 'bi-folder2-open',     href: '../projects/projects.html' },
        { key: 'experience',     label: 'Experience',     icon: 'bi-briefcase',        href: '../experience/experience.html' },
        { key: 'blog',           label: 'Blog Posts',     icon: 'bi-journal-text',     href: '../blog/blog.html' },
        { key: 'certifications', label: 'Certifications', icon: 'bi-award',            href: '../certifications/certifications.html' },
        { key: 'social-links',   label: 'Social Links',   icon: 'bi-link-45deg',       href: '../social-links/social.html' },
        { key: 'settings',       label: 'Settings',       icon: 'bi-gear',             href: '../settings/settings.html' }
    ];

    const navHtml = nav.map(function (item) {
        return '<a class="dash-nav-link ' + (item.key === activeKey ? 'active' : '') + '" href="' + item.href + '">' +
            '<i class="bi ' + item.icon + '"></i> <span>' + item.label + '</span>' +
            (item.badgeId ? '<span class="badge text-bg-warning ms-auto d-none" id="' + item.badgeId + '"></span>' : '') +
            '</a>';
    }).join('');

    // 3. السايدبار
    const sidebarRoot = document.getElementById('sidebar-root');
    if (sidebarRoot) {
        sidebarRoot.innerHTML =
            '<div class="dash-sidebar-inner">' +
            '  <div class="dash-brand">' +
            '    <i class="bi bi-grid-1x2-fill"></i>' +
            '    <div><div class="fw-bold">Dashboard</div><small class="text-muted">Portfolio</small></div>' +
            '  </div>' +
            '  <nav class="dash-nav">' + navHtml + '</nav>' +
            '  <div class="dash-sidebar-footer">' +
            '    <a href="../index.html" class="dash-nav-link" target="_blank"><i class="bi bi-box-arrow-up-right"></i> <span>View Site</span></a>' +
            '    <button type="button" class="dash-nav-link" id="dash-logout"><i class="bi bi-box-arrow-right"></i> <span>Logout</span></button>' +
            '  </div>' +
            '</div>';
    }

    // 4. التوب بار
    const topbarRoot = document.getElementById('topbar-root');
    if (topbarRoot) {
        topbarRoot.innerHTML =
            '<button class="btn btn-outline-secondary btn-sm d-lg-none me-2" id="dash-menu-btn" aria-label="Menu"><i class="bi bi-list"></i></button>' +
            '<div class="ms-auto d-flex align-items-center gap-3">' +
            '  <span class="text-muted small d-none d-sm-inline"><i class="bi bi-person-circle me-1"></i>' + window.dashUi.escapeHtml(me.email) + '</span>' +
            '  <button class="btn btn-outline-primary btn-sm d-none" id="dash-install-btn"><i class="bi bi-phone me-1"></i>Install App</button>' +
            '  <button class="btn btn-outline-danger btn-sm" id="dash-logout-top"><i class="bi bi-box-arrow-right me-1"></i>Logout</button>' +
            '</div>';
    }

    // 5. تسجيل الخروج
    async function doLogout() {
        try { await window.dashApi.logout(); } catch (e) { /* تجاهل */ }
        location.replace('../auth/login.html');
    }
    const lo1 = document.getElementById('dash-logout');
    if (lo1) lo1.addEventListener('click', doLogout);
    const lo2 = document.getElementById('dash-logout-top');
    if (lo2) lo2.addEventListener('click', doLogout);

    // 6. قائمة الموبايل
    const menuBtn = document.getElementById('dash-menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', function () { document.body.classList.toggle('sidebar-open'); });
    }

    // 7. قفل السايدبار بالضغط على أي حاجة براه (الموبايل)
    document.addEventListener('click', function (e) {
        if (!document.body.classList.contains('sidebar-open')) return;
        if (e.target.closest('#dash-menu-btn')) return;
        const sidebar = document.getElementById('sidebar-root');
        if (sidebar && !sidebar.contains(e.target)) {
            document.body.classList.remove('sidebar-open');
        }
    });

    // 7. تطبيق الويب (PWA): تسجيل السيرفس وركر + زر التثبيت
    try {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/dashboard/sw.js', { scope: '/dashboard/' }).then(function (reg) {
                try { reg.update(); } catch (e) { /* تجاهل */ }
            }).catch(function () {});
        }
        if (!document.querySelector('link[rel="manifest"]')) {
            const manifest = document.createElement('link');
            manifest.rel = 'manifest';
            manifest.href = '/dashboard/manifest.webmanifest';
            document.head.appendChild(manifest);
        }
    } catch (e) { /* تجاهل */ }

    let deferredPrompt = null;
    const installBtn = document.getElementById('dash-install-btn');
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) installBtn.classList.remove('d-none');
    });
    if (installBtn) {
        installBtn.addEventListener('click', async function () {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            try { await deferredPrompt.userChoice; } catch (e) { /* تجاهل */ }
            deferredPrompt = null;
            installBtn.classList.add('d-none');
        });
    }
    window.addEventListener('appinstalled', function () {
        if (installBtn) installBtn.classList.add('d-none');
    });

    // 8. شارات العدد (تقييمات معلقة + رسائل غير مقروءة)
    function setBadge(id, count) {
        if (count > 0) {
            const badge = document.getElementById(id);
            if (badge) { badge.textContent = count; badge.classList.remove('d-none'); }
        }
    }
    try {
        const results = await Promise.all([
            window.dashApi.list('testimonials'),
            window.dashApi.list('messages')
        ]);
        setBadge('nav-pending-badge', (results[0].results || []).filter(function (t) { return !t.is_approved; }).length);
        setBadge('nav-messages-badge', (results[1].results || []).filter(function (m) { return !m.is_read; }).length);
    } catch (e) { /* تجاهل */ }

    return me;
};
