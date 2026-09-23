// js/awards.js

(async function () {

    let awardsData = [];
    let currentLang = window.appLang || 'en';

    // --- 1. جلب البيانات من الـ API ---
    async function fetchAwards() {
        try {
            const site = await window.api.site();
            awardsData = site.certifications || [];
            renderAwards();

        } catch (err) {
            console.error('Error fetching awards:', err.message);
            window.setContainerMessage('#awards-grid', 'Certifications are temporarily unavailable.', 'bi-wifi-off');
        }
    }

    // --- 2. رسم الكروت (Render — متهرّب) ---
    function renderAwards() {
        const grid = $('#awards-grid');
        grid.empty();

        if (awardsData.length === 0) {
            window.setContainerMessage('#awards-grid', 'No certifications added yet.', 'bi-award');
            return;
        }

        const btnText = currentLang === 'en' ? 'View Details' : 'عرض التفاصيل';

        awardsData.forEach(award => {
            const title = currentLang === 'en' ? award.title_en : award.title_ar;
            const issuer = currentLang === 'en' ? award.issuer_en : award.issuer_ar;

            const safeTitle = window.escapeHtml(title);
            const safeIssuer = window.escapeHtml(issuer);
            const safeDate = window.escapeHtml(award.date);

            const mainImage = award.image || '/assets/placeholder.svg';

            const html = `
                <div class="col-lg-3 col-md-6">
                    <div class="award-card" onclick="openAwardModal(${award.id})">

                        <div class="award-img-wrapper">
                            <img src="${window.escapeHtml(window.safeUrl(mainImage))}" alt="${safeTitle}" class="award-img">

                            <div class="award-overlay">
                                <button class="btn btn-sm btn-light rounded-pill px-3 fw-bold">
                                    <i class="bi bi-eye-fill me-1"></i> ${btnText}
                                </button>
                            </div>
                        </div>

                        <div class="card-body-custom p-3">
                            <h6 class="fw-bold mb-1 text-gradient" style="font-size: 0.95rem;">${safeTitle}</h6>

                            <div class="award-meta mt-2">
                                <i class="bi bi-building"></i> ${safeIssuer}
                            </div>
                            <div class="award-meta">
                                <i class="bi bi-calendar3"></i> ${safeDate}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            grid.append(html);
        });
    }

    // --- 3. منطق المودال (Popup) ---
    window.openAwardModal = function (id) {
        const award = awardsData.find(a => a.id === id);
        if (!award) return;

        const title = currentLang === 'en' ? award.title_en : award.title_ar;
        const issuer = currentLang === 'en' ? award.issuer_en : award.issuer_ar;
        const desc = currentLang === 'en' ? award.desc_en : award.desc_ar;

        // النصوص عبر .text() آمنة
        $('#awardModalLabel').text(title);
        $('#awardModalIssuer').text(issuer);
        $('#awardModalDate').text(award.date);
        $('#awardModalDesc').text(desc);

        // الروابط مؤمّنة
        $('#awardModalImg').attr('src', window.safeUrl(award.image));
        $('#awardModalLink').attr('href', window.safeUrl(award.link));

        const modal = new bootstrap.Modal(document.getElementById('awardModal'));
        modal.show();
    };

    // --- 4. الترجمة والتشغيل ---
    await fetchAwards();

    const t = {
        en: {
            sub: "CREDENTIALS", title: "Certifications",
            issued: "Issued By", date: "Date", verify: "Verify Credential"
        },
        ar: {
            sub: "الشهادات", title: "الاعتمادات",
            issued: "الجهة المانحة", date: "التاريخ", verify: "التحقق من الشهادة"
        }
    };

    $(document).on('app:languageChanged', function (e, lang) {
        currentLang = lang;

        $('[data-i18n="awardsSubtitle"]').text(t[lang].sub);
        $('[data-i18n="awardsTitle"]').text(t[lang].title);
        $('[data-i18n="issuedBy"]').text(t[lang].issued);
        $('[data-i18n="date"]').text(t[lang].date);
        $('[data-i18n="verifyBtn"]').text(t[lang].verify);

        renderAwards();
    });

})();
