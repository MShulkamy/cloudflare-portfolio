// js/hero.js

(async function () {

    let heroData = null;
    let typeInterval;
    let currentLang = window.appLang || 'en';

    // مصفوفات العناوين (قيم افتراضية)
    let titlesEn = ["Software Engineer"];
    let titlesAr = ["مهندس برمجيات"];
    let currentTitles = titlesEn;

    // --- 1. جلب البيانات من الـ API ---
    async function fetchHeroData() {
        try {
            const site = await window.api.site();

            if (site.hero) {
                heroData = site.hero;

                // تحديث العناصر التي لا تعتمد على اللغة فوراً (روابط مؤمّنة)
                if (heroData.image_url) $('#hero-img').attr('src', window.safeUrl(heroData.image_url));
                if (heroData.cv_url) $('#hero-cv').attr('href', window.safeUrl(heroData.cv_url));

                // مصفوفات التايب رايتر
                titlesEn = Array.isArray(heroData.titles_en) ? heroData.titles_en : titlesEn;
                titlesAr = Array.isArray(heroData.titles_ar) ? heroData.titles_ar : titlesAr;

                updateContent(currentLang);
            } else {
                // مفيش بيانات — نخلي الأنيميشن يشتغل بالقيم الافتراضية
                updateContent(currentLang);
            }

        } catch (err) {
            console.error('Error fetching hero data:', err.message);
            // في حالة الفشل: نعرض نسخة افتراضية مقبولة بدل ما نقعد على "Loading..."
            $('#hero-firstname').text('Your');
            $('#hero-lastname').text('Name');
            updateContent(currentLang);
        }
    }

    // --- 2. تحديث المحتوى وتقسيم الاسم ---
    function updateContent(lang) {
        // 1. تحديد النصوص حسب اللغة
        const fullName = heroData ? (lang === 'en' ? heroData.name_en : heroData.name_ar) : null;
        const bio = heroData ? (lang === 'en' ? heroData.bio_en : heroData.bio_ar) : null;

        // 2. منطق تقسيم الاسم (Split Name)
        if (fullName) {
            const nameParts = fullName.trim().split(' ');

            if (nameParts.length > 0) {
                $('#hero-firstname').text(nameParts[0]);
                const restOfName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                $('#hero-lastname').text(restOfName);
            }
        }

        // 3. تحديث الوصف
        if (bio) $('#hero-bio').text(bio);

        // 4. تحديث التايب رايتر
        currentTitles = (lang === 'en') ? titlesEn : titlesAr;
        if (!currentTitles || currentTitles.length === 0) currentTitles = [' '];
        initTypewriter();
    }

    // --- 3. منطق الأنيميشن (Typewriter) ---
    function initTypewriter() {
        const textElement = document.getElementById('typewriter-text');
        if (!textElement) return;

        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        if (typeInterval) clearTimeout(typeInterval);

        function type() {
            const currentWord = currentTitles[wordIndex] || '';

            if (isDeleting) {
                textElement.textContent = currentWord.substring(0, charIndex - 1);
                charIndex--;
            } else {
                textElement.textContent = currentWord.substring(0, charIndex + 1);
                charIndex++;
            }

            let typeSpeed = isDeleting ? 30 : 60;

            if (!isDeleting && charIndex === currentWord.length) {
                typeSpeed = 2000;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % currentTitles.length;
                typeSpeed = 500;
            }

            typeInterval = setTimeout(type, typeSpeed);
        }
        type();
    }

    // --- التشغيل ---
    await fetchHeroData();

    // الاستماع لتغيير اللغة
    $(document).on('app:languageChanged', function (e, lang) {
        currentLang = lang;
        updateContent(lang);
    });

})();
