// js/experience.js

(async function () {

    let experienceData = [];
    let currentLang = window.appLang || 'en';

    // --- 1. جلب الخبرات من الـ API ---
    async function fetchExperience() {
        try {
            const site = await window.api.site();
            experienceData = site.experience || [];
            renderExperience();

        } catch (err) {
            console.error('Error fetching experience:', err.message);
            window.setContainerMessage('#experience-timeline', 'Experience is temporarily unavailable.', 'bi-wifi-off');
        }
    }

    // --- 2. الرسم (Timeline) ---
    function renderExperience() {
        const container = $('#experience-timeline').empty();

        if (experienceData.length === 0) {
            window.setContainerMessage('#experience-timeline', 'Experience timeline coming soon.', 'bi-briefcase');
            return;
        }

        const presentText = currentLang === 'en' ? 'Present' : 'حتى الآن';
        const e = window.escapeHtml.bind(window);

        experienceData.forEach(item => {
            const role = currentLang === 'en' ? item.role_en : item.role_ar;
            const company = currentLang === 'en' ? item.company_en : item.company_ar;
            const desc = currentLang === 'en' ? item.desc_en : item.desc_ar;

            const start = item.start_date ? e(item.start_date) : '';
            const end = item.end_date ? e(item.end_date) : e(presentText);
            const period = [start, end].filter(Boolean).join(' — ');

            let html = '<div class="timeline-item">' +
                '<div class="timeline-dot"></div>' +
                '<div class="timeline-card">' +
                '<span class="timeline-period"><i class="bi bi-calendar3 me-1"></i>' + period + '</span>' +
                '<h5 class="fw-bold mb-1 text-gradient">' + e(role) + '</h5>';

            if (company || item.location) {
                html += '<div class="text-muted small mb-2"><i class="bi bi-building me-1"></i>' + e(company);
                if (item.location) html += ' &bull; <i class="bi bi-geo-alt me-1"></i>' + e(item.location);
                html += '</div>';
            }

            if (desc) {
                html += '<p class="small text-muted mb-2">' + e(desc) + '</p>';
            }

            if (item.link) {
                html += '<a href="' + e(window.safeUrl(item.link)) + '" target="_blank" rel="noopener" class="small">' + e(item.link) + '</a>';
            }

            html += '</div></div>';
            container.append(html);
        });
    }

    // --- التشغيل ---
    await fetchExperience();

    const t = {
        en: { sub: 'JOURNEY', title: 'Experience & Education' },
        ar: { sub: 'المسيرة', title: 'الخبرات والتعليم' }
    };

    $(document).on('app:languageChanged', function (e, lang) {
        currentLang = lang;
        $('[data-i18n="expSubtitle"]').text(t[lang].sub);
        $('[data-i18n="expTitle"]').text(t[lang].title);
        renderExperience();
    });

})();
