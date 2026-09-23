// dashboard/analytics/analytics.js
// ============================================================
//  إحصائيات الزوار: إجمالي المشاهدات + رسم آخر 14 يوم +
//  أهم الصفحات ومصادر الزيارات والدول
// ============================================================

(async function () {
    await window.initLayout('analytics');
    const ui = window.dashUi;
    const content = document.getElementById('page-content');

    content.innerHTML =
        '<div class="row g-3 mb-4" id="an-cards"></div>' +
        '<div class="dash-card mb-4">' +
        '  <div class="dash-card-header">' +
        '    <div><h2 class="h5 mb-0">Page Views — Last 14 Days</h2>' +
        '    <small class="text-muted">عدد المشاهدات يوم بيوم</small></div>' +
        '    <button class="btn btn-outline-secondary btn-sm" id="an-refresh"><i class="bi bi-arrow-clockwise me-1"></i>Refresh</button>' +
        '  </div>' +
        '  <div class="dash-card-body">' +
        '    <div class="an-chart" id="an-chart"></div>' +
        '    <div class="an-bar-labels" id="an-chart-labels"></div>' +
        '  </div>' +
        '</div>' +
        '<div class="row g-4">' +
        '  <div class="col-lg-4">' +
        '    <div class="dash-card h-100">' +
        '      <div class="dash-card-header"><h2 class="h6 mb-0"><i class="bi bi-file-earmark-text me-1"></i>Top Pages</h2></div>' +
        '      <div class="dash-card-body p-0"><ul class="an-list" id="an-pages"></ul></div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="col-lg-4">' +
        '    <div class="dash-card h-100">' +
        '      <div class="dash-card-header"><h2 class="h6 mb-0"><i class="bi bi-share me-1"></i>Top Referrers</h2></div>' +
        '      <div class="dash-card-body p-0"><ul class="an-list" id="an-refs"></ul></div>' +
        '    </div>' +
        '  </div>' +
        '  <div class="col-lg-4">' +
        '    <div class="dash-card h-100">' +
        '      <div class="dash-card-header"><h2 class="h6 mb-0"><i class="bi bi-globe2 me-1"></i>Countries</h2></div>' +
        '      <div class="dash-card-body p-0"><ul class="an-list" id="an-countries"></ul></div>' +
        '    </div>' +
        '  </div>' +
        '</div>';

    function statCard(label, value, icon) {
        return '<div class="col-6 col-lg-3">' +
            '<div class="dash-card h-100"><div class="dash-card-body d-flex align-items-center gap-3">' +
            '<div class="an-icon"><i class="bi ' + icon + '"></i></div>' +
            '<div><div class="an-num">' + ui.escapeHtml(String(value)) + '</div>' +
            '<div class="text-muted small">' + label + '</div></div>' +
            '</div></div></div>';
    }

    // علم الدولة من كودها (EG → 🇪🇬)
    function flag(cc) {
        if (!cc || cc.length !== 2) return '🌐';
        try {
            return String.fromCodePoint(
                cc.toUpperCase().charCodeAt(0) + 127397,
                cc.toUpperCase().charCodeAt(1) + 127397
            );
        } catch (e) { return '🌐'; }
    }

    function hostOf(url) {
        try { return new URL(url).hostname.replace(/^www\./, ''); }
        catch (e) { return url; }
    }

    function listItems(el, items, render) {
        if (!items || !items.length) {
            el.innerHTML = '<li class="an-empty">No data yet</li>';
            return;
        }
        el.innerHTML = items.map(render).join('');
    }

    async function load() {
        try {
            const d = await window.dashApi.jfetch('/admin/analytics');
            const t = d.totals || {};

            // الكروت
            document.getElementById('an-cards').innerHTML =
                statCard('Total Views', t.all || 0, 'bi-eye') +
                statCard('Last 7 Days', t.last7 || 0, 'bi-calendar-week') +
                statCard('Today', t.today || 0, 'bi-calendar-day') +
                statCard('Unique Visitors (7d)', t.unique_visitors_7d || 0, 'bi-people');

            // الرسم: آخر 14 يوم (نكمّل الأيام الفاضية بأصفار)
            const byDay = {};
            (d.daily || []).forEach(function (r) { byDay[r.d] = r.n; });
            const days = [];
            for (let i = 13; i >= 0; i--) {
                const dstr = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
                days.push({ d: dstr, n: byDay[dstr] || 0 });
            }
            const max = Math.max.apply(null, days.map(function (x) { return x.n; }).concat([1]));

            document.getElementById('an-chart').innerHTML = days.map(function (x) {
                const h = x.n === 0 ? 3 : Math.max(6, Math.round(x.n / max * 100));
                return '<div class="an-bar" style="height:' + h + '%" title="' + x.d + ': ' + x.n + ' views"></div>';
            }).join('');
            document.getElementById('an-chart-labels').innerHTML = days.map(function (x) {
                return '<span>' + x.d.slice(8, 10) + '/' + x.d.slice(5, 7) + '</span>';
            }).join('');

            // القوايم
            listItems(document.getElementById('an-pages'), d.top_pages, function (r) {
                return '<li><span class="text-truncate">' + ui.escapeHtml(r.path) + '</span><span class="an-val">' + r.n + '</span></li>';
            });
            listItems(document.getElementById('an-refs'), d.top_referrers, function (r) {
                return '<li><span class="text-truncate">' + ui.escapeHtml(hostOf(r.referrer)) + '</span><span class="an-val">' + r.n + '</span></li>';
            });
            listItems(document.getElementById('an-countries'), d.top_countries, function (r) {
                return '<li><span>' + flag(r.country) + ' ' + ui.escapeHtml(r.country) + '</span><span class="an-val">' + r.n + '</span></li>';
            });

        } catch (err) {
            ui.toast(err.message, 'danger');
        }
    }

    document.getElementById('an-refresh').addEventListener('click', load);
    load();
})();
