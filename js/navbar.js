// js/navbar.js

(function () {

    // تعريف النصوص
    const navTranslations = {
        en: {
            home: "Home", skills: "Skills", projects: "Projects", blog: "Blog", contact: "Contact",
            contactBtn: "Contact Me", downloadCv: "Download CV",
            langBtnText: "عربي"
        },
        ar: {
            home: "الرئيسية", skills: "مهاراتي", projects: "المشاريع", blog: "المدونة", contact: "تواصل معي",
            contactBtn: "راسلني", downloadCv: "تحميل السيرة الذاتية",
            langBtnText: "English"
        }
    };

    // اللغة الحالية — متاحة لباقي الملفات (بيقرأها وهي بتحمّل)
    window.appLang = localStorage.getItem('site-lang') || 'en';

    // --- تطبيق اللغة ---
    function applyLang(lang) {
        window.appLang = lang;
        const t = navTranslations[lang];

        // 1. تحديث نصوص الناف بار
        $('[data-i18n]').each(function () {
            const key = $(this).data('i18n');
            if (t[key]) $(this).text(t[key]);
        });

        // 2. الزر والاتجاه
        $('#lang-text').text(t.langBtnText);
        if (lang === 'ar') {
            $('html').attr('dir', 'rtl').attr('lang', 'ar');
            $('.bi-send, .bi-download').addClass('ms-2').removeClass('me-2');
        } else {
            $('html').attr('dir', 'ltr').attr('lang', 'en');
            $('.bi-send, .bi-download').addClass('me-2').removeClass('ms-2');
        }

        // 3. حفظ الاختيار
        localStorage.setItem('site-lang', lang);

        // 4. إعلام باقي الملفات
        $(document).trigger('app:languageChanged', [lang]);
    }

    // --- تطبيق الثيم ---
    function applyTheme(theme) {
        const icon = $('#theme-icon');
        $('html').attr('data-bs-theme', theme);
        localStorage.setItem('site-theme', theme);

        if (theme === 'light') {
            icon.removeClass('bi-sun-fill').addClass('bi-moon-stars-fill');
            $('#theme-toggle').removeClass('btn-outline-light').addClass('btn-outline-dark');
        } else {
            icon.removeClass('bi-moon-stars-fill').addClass('bi-sun-fill');
            $('#theme-toggle').removeClass('btn-outline-dark').addClass('btn-outline-light');
        }
    }

    // --- الأزرار ---
    $(document).on('click', '#lang-toggle', function () {
        applyLang(window.appLang === 'en' ? 'ar' : 'en');
    });

    $(document).on('click', '#theme-toggle', function () {
        const current = $('html').attr('data-bs-theme') === 'dark' ? 'dark' : 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    // الثيم المحفوظ يتطبق فوراً (مفيش أي اعتماديات)
    const savedTheme = localStorage.getItem('site-theme');
    if (savedTheme) applyTheme(savedTheme);

    // اللغة المحفوظة — بينادي عليها main.js بعد تحميل كل الملفات
    window.applySavedPreferences = function () {
        if (window.appLang === 'ar') {
            applyLang('ar');
        }
    };

})();
