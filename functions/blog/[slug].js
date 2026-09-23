// functions/blog/[slug].js
// ============================================================
//  روابط المدونة النظيفة: /blog/any-post-slug
//  بيخدم قالب المقالة (اللي في /post.html) من غير أي redirect —
//  والمقالة نفسها بتتقري بالـ slug من المسار في js/blog.js
// ============================================================

export async function onRequest(context) {
    const url = new URL(context.request.url);
    const slug = String(context.params.slug || '');

    // ملفات ثابتة جوه /blog (زي blog.css لو حبيت تضيف) تعدي عادي
    if (/\.[a-z0-9]{2,5}$/i.test(slug) && slug !== 'post.html') {
        return context.next();
    }

    // هات قالب المقالة من الأصول الثابتة (بدون .html عشان الـ pretty URLs)
    let res = await context.env.ASSETS.fetch(new URL('/post.html', url.origin));
    if (res.status === 301 || res.status === 308 || res.status === 404) {
        res = await context.env.ASSETS.fetch(new URL('/post', url.origin));
    }
    if (res.status !== 200) {
        return new Response('Template not found', { status: 500 });
    }

    const html = await res.text();
    return new Response(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=60'
        }
    });
}
