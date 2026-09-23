// js/projects.js
// عرض المشاريع: كروت + صفحة تفصيلية كاملة (كل الصور + الوصف + التقنيات + الروابط)

(function () {
    'use strict';

    let projectsData = [];
    let currentLang = window.appLang || 'en';
    let currentProjectId = null;

    let galleryImages = [];   // صور المشروع المفتوح حاليًا
    let lightboxIndex = 0;

    // --- النصوص ---
    const t = {
        en: {
            sub: "MY WORK", title: "Featured Projects",
            live: "Live Demo", code: "Source Code",
            back: "Back", gallery: "Screenshots",
            view: "View project", images: "images", fullPage: "Full page",
            noProjects: "No projects yet. Stay tuned!",
            unavailable: "Projects are temporarily unavailable."
        },
        ar: {
            sub: "أعمالي", title: "أحدث المشاريع",
            live: "معاينة حية", code: "كود المشروع",
            back: "رجوع", gallery: "صور المشروع",
            view: "عرض المشروع", images: "صورة", fullPage: "صفحة كاملة",
            noProjects: "لا توجد مشاريع بعد. ترقّبوا الجديد!",
            unavailable: "المشاريع غير متاحة مؤقتًا."
        }
    };
    function L() { return t[currentLang] || t.en; }

    // ============================================================
    // 1) جلب البيانات
    // ============================================================
    function fetchProjects() {
        return window.api.site()
            .then(function (site) {
                projectsData = (site && site.projects) || [];
                renderProjects();
            })
            .catch(function (err) {
                console.error('Error fetching projects:', err && err.message);
                window.setContainerMessage('#projects-grid', L().unavailable, 'bi-wifi-off');
            });
    }

    // ============================================================
    // 2) رسم الكروت
    // ============================================================
    function renderProjects() {
        const grid = $('#projects-grid');
        grid.empty();

        if (!projectsData.length) {
            window.setContainerMessage('#projects-grid', L().noProjects, 'bi-folder2-open');
            return;
        }

        const btnText = { live: L().live, code: L().code };

        projectsData.forEach(function (project) {
            const title = currentLang === 'en' ? project.title_en : project.title_ar;
            const desc = currentLang === 'en' ? project.desc_en : project.desc_ar;

            const safeTitle = window.escapeHtml(title);
            const safeDesc = window.escapeHtml(desc);
            const safeStatus = window.escapeHtml(project.status);

            const images = (project.images || []).map(function (u) { return window.safeUrl(u); });
            const cover = images.length ? images[0] : '';
            const coverEsc = window.escapeHtml(cover);
            const count = images.length;

            const demoUrl = window.safeUrl(project.demo);
            const githubUrl = window.safeUrl(project.github);

            // الأزرار بتظهر بس لو في لينك فعلي (منع الأزرار الميتة)
            const liveBtn = (demoUrl && demoUrl !== '#')
                ? `<a href="${window.escapeHtml(demoUrl)}" target="_blank" rel="noopener" class="overlay-btn btn-live"><i class="bi bi-box-arrow-up-right"></i> ${window.escapeHtml(btnText.live)}</a>`
                : '';
            const codeBtn = (githubUrl && githubUrl !== '#')
                ? `<a href="${window.escapeHtml(githubUrl)}" target="_blank" rel="noopener" class="overlay-btn btn-code"><i class="devicon-github-original"></i> ${window.escapeHtml(btnText.code)}</a>`
                : '';

            let techTags = '';
            (project.tech || []).forEach(function (tag) {
                techTags += `<span class="tech-badge">${window.escapeHtml(tag)}</span>`;
            });

            const countBadge = count
                ? `<span class="img-count"><i class="bi bi-images"></i> ${count}</span>`
                : '';

            const coverImg = cover
                ? `<img class="project-img-bg" src="${coverEsc}" alt="" aria-hidden="true" loading="lazy" decoding="async">
                   <img class="project-img" src="${coverEsc}" alt="${safeTitle}" loading="lazy" decoding="async">`
                : `<div class="project-img-fallback"><i class="bi bi-image"></i></div>`;

            const html = `
                <div class="col-lg-4 col-md-6">
                    <article class="project-card" data-project-id="${project.id}" role="button" tabindex="0" aria-label="${safeTitle}">

                        <div class="img-wrapper">
                            ${coverImg}
                            ${countBadge}
                            <div class="project-overlay">
                                ${liveBtn}${codeBtn}
                            </div>
                        </div>

                        <div class="card-body-custom">
                            <div class="card-top">
                                <h5 class="fw-bold mb-0 text-gradient">${safeTitle}</h5>
                                <span class="status-badge">${safeStatus}</span>
                            </div>
                            <p class="card-desc text-muted small mb-3">${safeDesc}</p>
                            <div class="tech-tags">${techTags}</div>
                            <div class="card-open-hint">
                                <span>${window.escapeHtml(L().view)}</span>
                                <i class="bi bi-arrow-right"></i>
                            </div>
                        </div>

                    </article>
                </div>
            `;
            grid.append(html);
        });
    }

    // ============================================================
    // 3) صفحة التفاصيل (كامل الشاشة)
    // ============================================================
    function applyDetailLabels() {
        $('#pdBackText').text(L().back);
        $('#pdGalleryText').text(L().gallery);
        $('#pdCodeText').text(L().code);
        $('#pdDemoText').text(L().live);

        const n = galleryImages.length;
        if (n) {
            $('#pdCount').text(n + ' ' + L().images).show();
        } else {
            $('#pdCount').hide();
        }
    }

    function renderGallery() {
        const wrap = $('#pdGallery').empty();

        galleryImages.forEach(function (src, i) {
            const fig = $('<figure class="pd-shot">').attr('data-index', i);
            const img = $('<img>').attr({ src: src, alt: '', loading: 'lazy', decoding: 'async' });

            fig.append(img);
            fig.append('<span class="pd-shot__zoom"><i class="bi bi-arrows-fullscreen"></i></span>');
            wrap.append(fig);

            // صورة طويلة جدًا (صفحة كاملة) → نحدّد ارتفاعها في الجاليري
            const node = img[0];
            const mark = function () {
                if (node.naturalWidth && (node.naturalHeight / node.naturalWidth) > 2.6) {
                    fig.addClass('is-tall');
                    if (!fig.find('.pd-shot__tall').length) {
                        fig.append('<span class="pd-shot__tall"><i class="bi bi-arrows-vertical"></i> ' +
                            window.escapeHtml(L().fullPage) + '</span>');
                    }
                }
            };
            if (node.complete) mark();
            else node.addEventListener('load', mark);
        });
    }

    function openProjectDetail(id) {
        const project = projectsData.find(function (p) { return String(p.id) === String(id); });
        if (!project) return;

        currentProjectId = project.id;

        const title = currentLang === 'en' ? project.title_en : project.title_ar;
        const tagline = currentLang === 'en' ? project.desc_en : project.desc_ar;
        const fullDesc = currentLang === 'en' ? project.full_desc_en : project.full_desc_ar;

        $('#pdTitle').text(title || '');
        $('#pdTagline').text(tagline || '').toggle(!!tagline);
        $('#pdStatus').text(project.status || '').toggle(!!project.status);

        // التقنيات
        let techHtml = '';
        (project.tech || []).forEach(function (tag) {
            techHtml += `<span class="pd-tech-badge">${window.escapeHtml(tag)}</span>`;
        });
        $('#pdTech').html(techHtml);

        // الوصف الكامل (فقرات آمنة)
        const descEl = $('#pdDesc').empty();
        const text = String(fullDesc || tagline || '');
        text.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (par) {
            descEl.append($('<p>').text(par));
        });

        // الروابط (نخفي أي زر مالوش لينك)
        const githubUrl = window.safeUrl(project.github);
        const demoUrl = window.safeUrl(project.demo);
        $('#btn-github').attr('href', githubUrl).toggle(!!githubUrl && githubUrl !== '#');
        $('#btn-demo').attr('href', demoUrl).toggle(!!demoUrl && demoUrl !== '#');

        // الجاليري
        galleryImages = (project.images || []).map(function (u) { return window.safeUrl(u); }).filter(Boolean);
        renderGallery();
        applyDetailLabels();

        // إظهار
        const el = document.getElementById('projectDetail');
        el.classList.add('is-open');
        el.setAttribute('aria-hidden', 'false');
        document.body.classList.add('pd-open');

        const scroller = document.getElementById('pdScroll');
        if (scroller) scroller.scrollTop = 0;

        setTimeout(function () { $('#pdClose').trigger('focus'); }, 60);
    }

    function closeProjectDetail() {
        const el = document.getElementById('projectDetail');
        el.classList.remove('is-open');
        el.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('pd-open');
        currentProjectId = null;
    }

    // ============================================================
    // 4) الـ Lightbox
    // ============================================================
    function openLightbox(i) {
        if (!galleryImages.length) return;

        lightboxIndex = ((i % galleryImages.length) + galleryImages.length) % galleryImages.length;

        $('#pdLbImg').attr('src', galleryImages[lightboxIndex]);
        $('#pdLbCounter').text((lightboxIndex + 1) + ' / ' + galleryImages.length);

        const el = document.getElementById('pdLightbox');
        el.classList.add('is-open');
        el.setAttribute('aria-hidden', 'false');
        document.body.classList.add('pdlb-open');
    }

    function stepLightbox(dir) {
        if (!galleryImages.length) return;
        openLightbox(lightboxIndex + dir);
    }

    function closeLightbox() {
        const el = document.getElementById('pdLightbox');
        el.classList.remove('is-open');
        el.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('pdlb-open');
    }

    // ============================================================
    // 5) الأحداث
    // ============================================================
    // فتح المشروع من الكارت (مع تجاهل الضغط على أزرار الروابط)
    $(document).on('click', '.project-card', function (e) {
        if ($(e.target).closest('a').length) return;
        openProjectDetail($(this).data('project-id'));
    });

    $(document).on('keydown', '.project-card', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openProjectDetail($(this).data('project-id'));
        }
    });

    // فتح صورة في الـ Lightbox
    $(document).on('click', '.pd-shot', function () {
        openLightbox(parseInt($(this).attr('data-index'), 10) || 0);
    });

    $(document).on('click', '#pdClose', closeProjectDetail);
    $(document).on('click', '#pdLbClose', closeLightbox);
    $(document).on('click', '#pdLbPrev', function (e) { e.stopPropagation(); stepLightbox(-1); });
    $(document).on('click', '#pdLbNext', function (e) { e.stopPropagation(); stepLightbox(1); });

    // الضغط على خلفية الـ Lightbox يقفلها
    $(document).on('click', '#pdLightbox', function (e) {
        if (e.target === this) closeLightbox();
    });

    // لوحة المفاتيح
    $(document).on('keydown.pd', function (e) {
        const lb = document.getElementById('pdLightbox');
        if (lb && lb.classList.contains('is-open')) {
            if (e.key === 'Escape') { closeLightbox(); }
            else if (e.key === 'ArrowLeft') { stepLightbox(-1); }
            else if (e.key === 'ArrowRight') { stepLightbox(1); }
            return;
        }
        const pd = document.getElementById('projectDetail');
        if (pd && pd.classList.contains('is-open') && e.key === 'Escape') {
            closeProjectDetail();
        }
    });

    // سحب (Swipe) على الموبايل
    let touchX = null;
    $(document).on('touchstart', '#pdLbStage', function (e) {
        touchX = e.originalEvent.touches[0].clientX;
    });
    $(document).on('touchend', '#pdLbStage', function (e) {
        if (touchX === null) return;
        const dx = e.originalEvent.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 45) stepLightbox(dx > 0 ? -1 : 1);
        touchX = null;
    });

    // واجهة عامة (للتوافق مع أي كود قديم)
    window.openProjectDetail = openProjectDetail;
    window.openProjectModal = openProjectDetail;

    // ============================================================
    // 6) الترجمة والتشغيل
    // ============================================================
    function applySectionLabels() {
        $('[data-i18n="projectsSubtitle"]').text(L().sub);
        $('[data-i18n="projectsTitle"]').text(L().title);
    }

    $(document).on('app:languageChanged', function (e, lang) {
        currentLang = lang;
        applySectionLabels();
        renderProjects();

        const pd = document.getElementById('projectDetail');
        if (currentProjectId !== null && pd && pd.classList.contains('is-open')) {
            openProjectDetail(currentProjectId);
        }
    });

    applySectionLabels();
    fetchProjects();

})();
