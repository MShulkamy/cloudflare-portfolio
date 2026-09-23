// js/contact.js

(async function () {

    let contactLinks = [];
    let currentLang = window.appLang || 'en';

    // --- 1. جلب كل البيانات (ضربة واحدة) ---
    async function fetchData() {
        try {
            const site = await window.api.site();
            contactLinks = site.social_links || [];
            window.footerNameData = site.hero || null;

            renderContact();
            updateFooterName(currentLang);

        } catch (err) {
            console.error('Error fetching contact data:', err.message);
            window.setContainerMessage('#contact-grid', 'Contact links are temporarily unavailable.', 'bi-wifi-off');
        }
    }

    // --- 2. دالة ذكية لتحديد نوع الأيقونة (صورة أم أيقونة — متهرّبة) ---
    function getContactIcon(iconStr) {
        if (!iconStr) return '';

        const isImage = iconStr.includes('/') || iconStr.includes('.') || iconStr.startsWith('http');

        if (isImage) {
            return `<img src="${window.escapeHtml(window.safeUrl(iconStr))}" alt="icon" style="width: 40px; height: 40px; object-fit: contain; margin-bottom: 0.5rem;">`;
        } else {
            return `<i class="${window.escapeHtml(iconStr)} mb-2" style="font-size: 2rem; color: #fff;"></i>`;
        }
    }

    // --- 3. رسم الكروت ---
    function renderContact() {
        const grid = $('#contact-grid').empty();

        if (contactLinks.length === 0) {
            window.setContainerMessage('#contact-grid', 'No contact links added yet.', 'bi-link-45deg');
            return;
        }

        contactLinks.forEach(item => {
            const name = currentLang === 'en' ? item.name_en : item.name_ar;
            const iconHtml = getContactIcon(item.icon);

            grid.append(`
                <div class="col-6 col-md-3">
                    <a href="${window.escapeHtml(window.safeUrl(item.url))}" target="_blank" rel="noopener" class="contact-card h-100 d-flex flex-column align-items-center justify-content-center p-4 text-decoration-none"
                       style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; transition: all 0.3s;">

                        ${iconHtml}

                        <span class="text-muted fw-bold">${window.escapeHtml(name)}</span>
                        <i class="bi bi-box-arrow-up-right small mt-2" style="opacity: 0.5;"></i>

                    </a>
                </div>
            `);
        });
    }

    // --- 4. تحديث اسم الفوتر ---
    function updateFooterName(lang) {
        if (window.footerNameData) {
            const name = lang === 'en' ? window.footerNameData.name_en : window.footerNameData.name_ar;
            if (name) $('#footer-name').text(name);
        }
    }

    // --- 5. إرسال رسالة من الزائر ---
    $(document).on('submit', '#messageForm', async function (e) {
        e.preventDefault();
        const btn = $(this).find('button[type="submit"]');
        const originalText = btn.html();
        btn.html('<span class="spinner-border spinner-border-sm"></span> Sending...').prop('disabled', true);

        const payload = {
            name: $('#m-name').val(),
            email: $('#m-email').val(),
            subject: $('#m-subject').val(),
            text: $('#m-text').val()
        };

        try {
            await window.api.submitMessage(payload);
            window.showToast(
                currentLang === 'ar'
                    ? 'تم إرسال رسالتك بنجاح، هرد عليك في أقرب وقت!'
                    : "Thank you! Your message has been sent. I'll get back to you soon.",
                'success'
            );
            $('#messageForm')[0].reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('messageModal'));
            if (modal) modal.hide();
        } catch (err) {
            window.showToast(
                currentLang === 'ar' ? 'حصلت مشكلة في الإرسال: ' + err.message : 'Error: ' + err.message,
                'danger'
            );
        } finally {
            btn.html(originalText).prop('disabled', false);
        }
    });

    // --- التشغيل ---
    $('#footer-year').text(new Date().getFullYear());
    await fetchData();

    // الترجمة
    const t = {
        en: {
            sub: "LET'S CONNECT", title: "Get In Touch",
            desc: "Feel free to reach out for collaborations, opportunities, or just a friendly hello!",
            rights: "All rights reserved.", made: "Built with passion and dedication",
            message: "Send Me a Message", messageTitle: "Send Me a Message"
        },
        ar: {
            sub: "لنتواصل", title: "تواصل معي",
            desc: "لا تتردد في التواصل من أجل التعاون، الفرص، أو حتى لإلقاء التحية!",
            rights: "جميع الحقوق محفوظة.", made: "صُنع بشغف وتفاني",
            message: "ابعتلي رسالة", messageTitle: "ابعتلي رسالة"
        }
    };

    $(document).on('app:languageChanged', function (e, lang) {
        currentLang = lang;
        $('[data-i18n="contactSubtitle"]').text(t[lang].sub);
        $('[data-i18n="contactTitle"]').text(t[lang].title);
        $('[data-i18n="contactDesc"]').text(t[lang].desc);
        $('[data-i18n="rights"]').text(t[lang].rights);
        $('[data-i18n="madeWith"]').text(t[lang].made);
        $('[data-i18n="sendMessage"]').text(t[lang].message);
        $('[data-i18n="messageTitle"]').text(t[lang].messageTitle);

        renderContact();
        updateFooterName(lang);
    });

})();
