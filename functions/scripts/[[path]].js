// functions/scripts/[[path]].js
// مسار حراسة: ملفات بناء/أدوات لا تُنشر أبداً (410 Gone نهائي)
export function onRequest() {
    return new Response('Gone', {
        status: 410,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
    });
}
