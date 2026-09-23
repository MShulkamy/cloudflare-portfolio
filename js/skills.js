// js/skills.js

(async function () {

    let allSkills = [];
    let currentLang = window.appLang || 'en';

    // --- 1. جلب البيانات من الـ API ---
    async function fetchSkills() {
        try {
            const site = await window.api.site();
            allSkills = site.skills || [];
            renderSkills();

        } catch (err) {
            console.error('Error fetching skills:', err.message);
            window.setContainerMessage('#tech-skills-container', 'Skills are temporarily unavailable.', 'bi-wifi-off');
        }
    }

    // --- 2. دالة مساعدة لتوليد كود الأيقونة (Smart Icon — بتهريب آمن) ---
    function getIconHtml(iconStr, isTool) {
        if (!iconStr) return '';

        const isImage = iconStr.includes('/') || iconStr.includes('.') || iconStr.startsWith('http');

        if (isImage) {
            const size = isTool ? '45px' : '32px';
            return `<img src="${window.escapeHtml(window.safeUrl(iconStr))}" alt="icon" style="width: ${size}; height: ${size}; object-fit: contain;">`;
        } else {
            const fontSize = isTool ? 'fs-2' : 'fs-3';
            const colorClass = (isTool || iconStr.includes('colored')) ? '' : 'text-primary';
            return `<i class="${window.escapeHtml(iconStr)} ${colorClass} ${fontSize}"></i>`;
        }
    }

    // --- 3. دالة الرسم (Render) ---
    function renderSkills() {
        const techContainer = $('#tech-skills-container').empty();
        const softContainer = $('#soft-skills-container').empty();
        const toolsContainer = $('#tools-container').empty();

        allSkills.forEach(skill => {
            const name = currentLang === 'en' ? skill.name_en : skill.name_ar;

            // أ) مهارات تقنية وشخصية
            if (skill.category === 'technical' || skill.category === 'soft') {
                const iconHtml = getIconHtml(skill.icon, false);
                const targetContainer = skill.category === 'technical' ? techContainer : softContainer;

                targetContainer.append(`
                    <div class="col-sm-6">
                        <div class="skill-card p-3 d-flex align-items-center gap-3 h-100">
                            ${iconHtml}
                            <span class="fw-medium">${window.escapeHtml(name)}</span>
                        </div>
                    </div>
                `);
            }

            // ب) أدوات (Tools)
            else if (skill.category === 'tool') {
                const iconHtml = getIconHtml(skill.icon, true);

                toolsContainer.append(`
                    <div class="tool-item text-center">
                        <div class="tool-icon">
                            ${iconHtml}
                        </div>
                        <span class="tool-name">${window.escapeHtml(name)}</span>
                    </div>
                `);
            }
        });

        // حالات فاضية لكل حاوية
        if (techContainer.children().length === 0) {
            techContainer.append('<div class="col-12 text-muted small">No technical skills added yet.</div>');
        }
        if (softContainer.children().length === 0) {
            softContainer.append('<div class="col-12 text-muted small">No soft skills added yet.</div>');
        }
        if (toolsContainer.children().length === 0) {
            toolsContainer.append('<div class="col-12 text-muted small">No tools added yet.</div>');
        }
    }

    // --- 4. نصوص الترجمة الثابتة ---
    const t = {
        en: {
            subtitle: "WHAT I BRING", title: "Skills & Tools",
            tech: "Technical Skills", soft: "Soft Skills", tools: "Tools & Technologies"
        },
        ar: {
            subtitle: "ماذا أقدم", title: "مهاراتي وأدواتي",
            tech: "مهارات تقنية", soft: "مهارات شخصية", tools: "الأدوات والتقنيات"
        }
    };

    function updateTranslations(lang) {
        $('[data-i18n="skillsSubtitle"]').text(t[lang].subtitle);
        $('[data-i18n="skillsTitle"]').text(t[lang].title);
        $('[data-i18n="techSkills"]').text(t[lang].tech);
        $('[data-i18n="softSkills"]').text(t[lang].soft);
        $('[data-i18n="toolsTitle"]').text(t[lang].tools);
    }

    // --- التشغيل ---

    await fetchSkills();

    $(document).on('app:languageChanged', function (e, lang) {
        currentLang = lang;
        updateTranslations(lang);
        renderSkills();
    });

})();
