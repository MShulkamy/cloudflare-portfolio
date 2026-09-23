// js/reviews.js

(async function () {

    let reviewsData = [];
    let currentLang = window.appLang || 'en';

    // --- 1. جلب البيانات (الموافق عليها فقط — وأعمدة آمنة بدون email) ---
    async function fetchReviews() {
        try {
            const site = await window.api.site();
            reviewsData = site.testimonials || [];
            renderReviews();

        } catch (err) {
            console.error('Error fetching reviews:', err.message);
            window.setContainerMessage('#reviews-grid', 'Reviews are temporarily unavailable.', 'bi-wifi-off');
        }
    }

    // --- 2. رسم الكروت (كل البيانات متهرّبة — anti-XSS) ---
    function renderReviews() {
        const grid = $('#reviews-grid').empty();

        if (reviewsData.length === 0) {
            window.setContainerMessage('#reviews-grid', 'No reviews yet. Be the first!', 'bi-chat-heart');
            return;
        }

        reviewsData.forEach((review, index) => {
            // النجوم
            let starsHtml = '';
            for (let i = 0; i < 5; i++) {
                starsHtml += `<i class="bi ${i < review.rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'}"></i> `;
            }

            // البيانات الشخصية (متهرّبة)
            const safeName = window.escapeHtml(review.name);
            const initials = review.name ? window.escapeHtml(review.name.substring(0, 2).toUpperCase()) : '??';
            const roleDisplay = review.role
                ? window.escapeHtml(String(review.role) + (review.company ? ' at ' + review.company : ''))
                : '';

            const delay = index * 150;

            const html = `
                <div class="col-lg-4 col-md-6 review-item" style="animation-delay: ${delay}ms;">
                    <div class="review-card">
                        <i class="bi bi-quote quote-icon"></i>

                        <div>
                            <div class="stars">${starsHtml}</div>
                            <p class="review-text">"${window.escapeHtml(review.text)}"</p>
                        </div>

                        <div class="reviewer-info">
                            <div class="avatar shadow-sm">${initials}</div>
                            <div>
                                <h6 class="reviewer-name">${safeName}</h6>
                                <span class="reviewer-job">${roleDisplay}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            grid.append(html);
        });
    }

    // --- 3. إرسال الفيدباك (للمراجعة) ---

    // رسم النجوم حسب القيمة
    function paintStars(rating) {
        $('#star-rating-container i').each(function (idx) {
            $(this).toggleClass('bi-star-fill text-warning', idx < rating);
            $(this).toggleClass('bi-star text-muted', idx >= rating);
        });
        $('#f-rating').val(rating);
    }

    // تفاعل النجوم
    $(document).on('click', '#star-rating-container i', function () {
        paintStars($(this).data('value'));
    });

    // Submit Form
    $(document).on('submit', '#feedbackForm', async function (e) {
        e.preventDefault();
        const btn = $(this).find('button[type="submit"]');
        const originalText = btn.html();
        btn.html('<span class="spinner-border spinner-border-sm"></span> Sending...').prop('disabled', true);

        const newReview = {
            name: $('#f-name').val(),
            email: $('#f-email').val() || null,
            company: $('#f-company').val() || null,
            role: $('#f-role').val() || null,
            rating: parseInt($('#f-rating').val(), 10) || 5,
            text: $('#f-text').val(),
            is_approved: false
        };

        try {
            await window.api.submitTestimonial(newReview);

            window.showToast(
                window.appLang === 'ar'
                    ? 'شكراً! تقييمك وصل وهينشر بعد المراجعة.'
                    : 'Thank you! Your feedback has been submitted for moderation.',
                'success'
            );
            $('#feedbackForm')[0].reset();
            paintStars(5); // إعادة النجوم لحالتها الأصلية
            bootstrap.Modal.getInstance(document.getElementById('feedbackModal')).hide();

        } catch (err) {
            window.showToast(
                window.appLang === 'ar' ? 'حصلت مشكلة في الإرسال: ' + err.message : 'Error: ' + err.message,
                'danger'
            );
        } finally {
            btn.html(originalText).prop('disabled', false);
        }
    });

    // --- 4. الترجمة والتشغيل ---
    await fetchReviews();

    const t = {
        en: { sub: "TESTIMONIALS", title: "What People Say", btn: "Leave Feedback" },
        ar: { sub: "آراء العملاء", title: "ماذا يقول الناس", btn: "اترك تقييماً" }
    };

    $(document).on('app:languageChanged', function (e, lang) {
        currentLang = lang;
        $('[data-i18n="reviewsSubtitle"]').text(t[lang].sub);
        $('[data-i18n="reviewsTitle"]').text(t[lang].title);
        $('[data-i18n="leaveFeedback"]').html(`<i class="bi bi-chat-left-text me-2"></i> ${t[lang].btn}`);
        renderReviews();
    });

})();
