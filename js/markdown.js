// js/markdown.js
// ============================================================
//  محرك Markdown مصغّر وآمن (بدون أي مكتبة خارجية)
//  بيهرب أي HTML الأول — يعني حتى لو حد كتب <script> في مقالة
//  مش هيتنفذ. بيدعم: عناوين، عريض/مائل، أكواد، لينكات، صور،
//  قوايم، اقتباسات، فواصل.
//  الاستخدام:  el.innerHTML = window.renderMarkdown(text)
// ============================================================

(function () {

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // الروابط المسموح بها فقط (ضد javascript:)
    function safeUrl(u) {
        const url = String(u || '').trim();
        if (/^https?:\/\//i.test(url)) return url;
        if (/^mailto:/i.test(url)) return url;
        if (url.startsWith('/')) return url;
        return '#';
    }

    // عناصر السطر الواحد (اللي جوه الفقرة)
    function inline(text) {
        let out = text;

        // صور ![alt](url)
        out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (m, alt, url) {
            return '<img src="' + safeUrl(url) + '" alt="' + alt + '" loading="lazy">';
        });

        // لينكات [text](url)
        out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, label, url) {
            return '<a href="' + safeUrl(url) + '" target="_blank" rel="noopener">' + label + '</a>';
        });

        // كود داخلي `code`
        out = out.replace(/`([^`]+)`/g, '<code>$1</code>');

        // عريض **bold** ثم مائل *italic*
        out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

        return out;
    }

    function render(md) {
        let src = String(md || '').replace(/\r\n?/g, '\n');

        // 1) اعزل بلوكات الكود الأول (عشان مفيش أي تحويل جواها)
        const codeBlocks = [];
        src = src.replace(/```(\w*)\n([\s\S]*?)(?:```|$)/g, function (m, lang, code) {
            const cls = lang ? ' class="language-' + escapeHtml(lang) + '"' : '';
            codeBlocks.push('<pre><code' + cls + '>' + escapeHtml(code.replace(/\n$/, '')) + '</code></pre>');
            return '\u0000CODE' + (codeBlocks.length - 1) + '\u0000';
        });

        // 2) هرب كل HTML الباقي
        src = escapeHtml(src);

        // 3) تحليل سطر بسطر
        const lines = src.split('\n');
        let html = '';
        let listType = null;
        let inQuote = false;

        function closeList() { if (listType) { html += '</' + listType + '>'; listType = null; } }
        function closeQuote() { if (inQuote) { html += '</blockquote>'; inQuote = false; } }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // بلوك كود معزول
            const codeRef = trimmed.match(/^\u0000CODE(\d+)\u0000$/);
            if (codeRef) {
                closeList(); closeQuote();
                html += codeBlocks[Number(codeRef[1])] || '';
                continue;
            }

            // سطر فاضي → اقفل البلوكات
            if (!trimmed) { closeList(); closeQuote(); continue; }

            // فاصل ---
            if (/^-{3,}$/.test(trimmed)) { closeList(); closeQuote(); html += '<hr>'; continue; }

            // عناوين # ## ###
            const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
            if (h) {
                closeList(); closeQuote();
                const lvl = h[1].length;
                html += '<h' + lvl + '>' + inline(h[2].trim()) + '</h' + lvl + '>';
                continue;
            }

            // اقتباس > (بعد الهروب بتبقى &gt;)
            const q = trimmed.match(/^&gt;\s?(.*)$/);
            if (q) {
                closeList();
                if (!inQuote) { html += '<blockquote>'; inQuote = true; }
                html += '<p>' + inline(q[1]) + '</p>';
                continue;
            }
            closeQuote();

            // قائمة نقط
            const ul = trimmed.match(/^[-*]\s+(.*)$/);
            if (ul) {
                if (listType !== 'ul') { closeList(); html += '<ul>'; listType = 'ul'; }
                html += '<li>' + inline(ul[1]) + '</li>';
                continue;
            }

            // قائمة أرقام
            const ol = trimmed.match(/^\d+[.)]\s+(.*)$/);
            if (ol) {
                if (listType !== 'ol') { closeList(); html += '<ol>'; listType = 'ol'; }
                html += '<li>' + inline(ol[1]) + '</li>';
                continue;
            }

            // فقرة عادية
            closeList();
            html += '<p>' + inline(trimmed) + '</p>';
        }

        closeList(); closeQuote();
        return html;
    }

    window.renderMarkdown = render;
})();
