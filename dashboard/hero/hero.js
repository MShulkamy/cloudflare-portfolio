// dashboard/hero/hero.js
// ============================================================
//  تعديل الـ Hero Section (صف واحد — الاسم، الوصف، العناوين، الصورة، CV)
// ============================================================

(async function () {
    await window.initLayout('hero');
    const ui = window.dashUi;
    const content = document.getElementById('page-content');

    const fields = [
        { key: 'name_en', label: 'Name (English)', type: 'text', required: true },
        { key: 'name_ar', label: 'Name (Arabic)', type: 'text', required: true },
        { key: 'bio_en', label: 'Bio (English)', type: 'textarea', rows: 3 },
        { key: 'bio_ar', label: 'Bio (Arabic)', type: 'textarea', rows: 3 },
        { key: 'titles_en', label: 'Typewriter Titles (English)', type: 'lines', rows: 3, help: 'كل سطر عنوان — بيظهروا واحد ورا التاني في الأنيميشن' },
        { key: 'titles_ar', label: 'Typewriter Titles (Arabic)', type: 'lines', rows: 3, help: 'كل سطر عنوان' },
        { key: 'image_url', label: 'Profile Image', type: 'image', help: 'ارفع صورة من جهازك مباشرة' },
        { key: 'cv_url', label: 'CV (PDF)', type: 'file', help: 'ارفع ملف الـ CV بصيغة PDF — أو الصق رابط خارجي' }
    ];

    content.innerHTML =
        '<div class="dash-card" style="max-width: 960px;">' +
        '  <div class="dash-card-header">' +
        '    <div>' +
        '      <h2 class="h5 mb-0">Hero Section</h2>' +
        '      <small class="text-muted" id="hero-updated"></small>' +
        '    </div>' +
        '    <button class="btn btn-primary btn-sm" id="hero-save"><i class="bi bi-check-lg me-1"></i>Save Changes</button>' +
        '  </div>' +
        '  <div class="dash-card-body">' +
        '    <div class="row g-3" id="hero-form"></div>' +
        '  </div>' +
        '</div>';

    let heroRow = null;
    const formEl = document.getElementById('hero-form');
    const saveBtn = document.getElementById('hero-save');
    const updatedEl = document.getElementById('hero-updated');

    async function load() {
        try {
            const data = await window.dashApi.list('hero_section');
            heroRow = (data.results || [])[0] || null;
            ui.buildFormFields(formEl, fields, heroRow);
            updatedEl.textContent = (heroRow && heroRow.updated_at)
                ? 'Last updated: ' + ui.fmtDate(heroRow.updated_at)
                : 'No data yet — fill the form and hit Save';
        } catch (err) {
            ui.toast(err.message, 'danger');
        }
    }

    saveBtn.addEventListener('click', async function () {
        // الحقول المطلوبة
        const required = ['name_en', 'name_ar'];
        for (let i = 0; i < required.length; i++) {
            const el = document.getElementById('cf-' + required[i]);
            if (el && !el.value.trim()) {
                ui.toast('Both names are required', 'warning');
                el.focus();
                return;
            }
        }

        const payload = ui.readFormFields(fields);
        ui.setLoading(saveBtn, true, 'Saving...');
        try {
            if (heroRow) {
                await window.dashApi.update('hero_section', heroRow.id, payload);
            } else {
                await window.dashApi.create('hero_section', payload);
            }
            ui.toast('Hero section saved');
            await load(); // إعادة التحميل لتحديث وقت آخر تعديل
        } catch (err) {
            ui.toast(err.message, 'danger');
        } finally {
            ui.setLoading(saveBtn, false);
        }
    });

    load();
})();
