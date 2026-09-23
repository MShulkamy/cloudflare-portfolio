// functions/api/[[route]].js
// ============================================================================
//  Portfolio Backend API — Cloudflare Pages Function
//  D1 (SQLite) + جلسات دخول آمنة + حماية من التخمين + CSRF
//  المسارات كلها تحت /api/*
// ============================================================================

const SESSION_TTL_MS  = 30 * 24 * 60 * 60 * 1000; // 30 يوم
const PBKDF2_ITERS    = 100000;                    // لو ظهر خطأ CPU limit قللها لـ 50000
const MAX_LOGIN_FAILS = 10;                        // خلال آخر 15 دقيقة
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// ============================================================================
// تعريف الجداول — المفتاح الأبيض الوحيد للتعامل مع الداتابيز
// أي عمود/جدول خارج التعريف ده مرفوض تماماً (ضد SQL injection)
// ============================================================================
const TABLES = {
  hero_section: {
    orderBy: 'id ASC',
    fields: {
      name_en:   { type: 'string', max: 200 },
      name_ar:   { type: 'string', max: 200 },
      bio_en:    { type: 'string', max: 4000 },
      bio_ar:    { type: 'string', max: 4000 },
      titles_en: { type: 'json', maxItems: 20, maxLen: 200 },
      titles_ar: { type: 'json', maxItems: 20, maxLen: 200 },
      image_url: { type: 'string', max: 1000 },
      cv_url:    { type: 'string', max: 1000 }
    }
  },
  skills: {
    orderBy: '"order" ASC, id ASC',
    fields: {
      name_en:  { type: 'string', max: 200 },
      name_ar:  { type: 'string', max: 200 },
      icon:     { type: 'string', max: 500 },
      category: { type: 'enum', values: ['technical', 'soft', 'tool'] },
      order:    { type: 'int' }
    }
  },
  projects: {
    orderBy: '"order" ASC, id ASC',
    fields: {
      title_en:     { type: 'string', max: 300 },
      title_ar:     { type: 'string', max: 300 },
      desc_en:      { type: 'string', max: 2000 },
      desc_ar:      { type: 'string', max: 2000 },
      full_desc_en: { type: 'string', max: 8000 },
      full_desc_ar: { type: 'string', max: 8000 },
      images:       { type: 'json', maxItems: 30, maxLen: 1000 },
      tech:         { type: 'json', maxItems: 30, maxLen: 100 },
      status:       { type: 'string', max: 100 },
      demo:         { type: 'string', max: 1000 },
      github:       { type: 'string', max: 1000 },
      order:        { type: 'int' }
    }
  },
  certifications: {
    orderBy: '"order" ASC, id ASC',
    fields: {
      title_en:  { type: 'string', max: 300 },
      title_ar:  { type: 'string', max: 300 },
      issuer_en: { type: 'string', max: 300 },
      issuer_ar: { type: 'string', max: 300 },
      desc_en:   { type: 'string', max: 4000 },
      desc_ar:   { type: 'string', max: 4000 },
      image:     { type: 'string', max: 1000 },
      link:      { type: 'string', max: 1000 },
      date:      { type: 'string', max: 100 },
      order:     { type: 'int' }
    }
  },
  testimonials: {
    orderBy: 'created_at DESC, id DESC',
    publicFields: ['id', 'name', 'company', 'role', 'rating', 'text', 'created_at'],
    fields: {
      name:        { type: 'string', max: 100, required: true },
      email:       { type: 'string', max: 200 },
      company:     { type: 'string', max: 200 },
      role:        { type: 'string', max: 200 },
      rating:      { type: 'int', min: 1, max: 5 },
      text:        { type: 'string', max: 2000, required: true },
      is_approved: { type: 'bool', adminOnly: true }   // الأدمن فقط يقدر يوافق
    }
  },
  social_links: {
    orderBy: '"order" ASC, id ASC',
    fields: {
      name_en: { type: 'string', max: 200 },
      name_ar: { type: 'string', max: 200 },
      icon:    { type: 'string', max: 500 },
      url:     { type: 'string', max: 1000 },
      order:   { type: 'int' }
    }
  },
  experience: {
    orderBy: '"order" ASC, id ASC',
    fields: {
      role_en:    { type: 'string', max: 200 },
      role_ar:    { type: 'string', max: 200 },
      company_en: { type: 'string', max: 200 },
      company_ar: { type: 'string', max: 200 },
      desc_en:    { type: 'string', max: 4000 },
      desc_ar:    { type: 'string', max: 4000 },
      start_date: { type: 'string', max: 50 },
      end_date:   { type: 'string', max: 50 },
      location:   { type: 'string', max: 200 },
      link:       { type: 'string', max: 1000 },
      order:      { type: 'int' }
    }
  },
  messages: {
    orderBy: 'created_at DESC, id DESC',
    fields: {
      name:       { type: 'string', max: 100 },
      email:      { type: 'string', max: 200 },
      subject:    { type: 'string', max: 200 },
      text:       { type: 'string', max: 5000 },
      is_read:    { type: 'bool' },
      is_replied: { type: 'bool' }
    }
  },
  posts: {
    orderBy: 'created_at DESC, id DESC',
    fields: {
      slug:         { type: 'string', max: 200 },
      title_en:     { type: 'string', max: 300 },
      title_ar:     { type: 'string', max: 300 },
      excerpt_en:   { type: 'string', max: 1000 },
      excerpt_ar:   { type: 'string', max: 1000 },
      body_en:      { type: 'string', max: 100000 },
      body_ar:      { type: 'string', max: 100000 },
      cover_url:    { type: 'string', max: 1000 },
      tags:         { type: 'json', maxItems: 20, maxLen: 60 },
      is_published: { type: 'bool' }
    }
  }
};

// ============================================================================
// Helpers
// ============================================================================
const enc = new TextEncoder();

function j(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

async function readBody(request) {
  try { return await request.json(); } catch { return {}; }
}

function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const m = header.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function sessionCookie(token, secure, maxAgeSec) {
  return `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure ? '; Secure' : ''}`;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

async function sha256Hex(str) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(str));
  return bytesToHex(new Uint8Array(digest));
}

async function hashPassword(password, saltHex) {
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(saltHex), iterations: PBKDF2_ITERS },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

function timingSafeEqual(a, b) {
  const ab = enc.encode(a), bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

// --- slug المقالات: حروف إنجليزية صغيرة وأرقام وشُرَط فقط ---
function sanitizeSlug(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 190);
}

async function uniqueSlug(env, base, excludeId) {
  let slug = base, n = 1;
  for (;;) {
    const row = excludeId
      ? await env.DB.prepare('SELECT id FROM posts WHERE slug = ? AND id != ?').bind(slug, excludeId).first()
      : await env.DB.prepare('SELECT id FROM posts WHERE slug = ?').bind(slug).first();
    if (!row) return slug;
    n++;
    slug = base.slice(0, 180) + '-' + n;
  }
}

// ============================================================================
// إشعارات فورية عند وصول رسالة/تقييم (اختياري بالكامل)
//   NTFY_TOPIC     → إشعار push على الموبايل عبر تطبيق ntfy (مجاني)
//   RESEND_API_KEY → إيميل عبر Resend (مجاني — 100 إيميل/يوم)
//   لو المفاتيح مش متظبطة → مفيش أي إشعار وكل حاجة شغالة عادي
// ============================================================================
// Base URL of the deployed site, used to build links inside notifications.
// Set the SITE_URL variable in wrangler.toml (or the Pages dashboard).
function siteBase(env) {
  return String(env.SITE_URL || 'https://your-project.pages.dev').replace(/\/+$/, '');
}

async function notifyAdmin(env, title, body, clickUrl, tags, opts) {
  opts = opts || {};
  const jobs = [];

  if (env.NTFY_TOPIC) {
    const headers = {
      'Title': env.SITE_NAME || 'Portfolio',
      'Tags': tags || 'incoming_envelope',
      'Priority': 'high',
      'User-Agent': 'portfolio-notifier/1.0'
    };
    if (clickUrl) headers['Click'] = clickUrl;
    jobs.push((async () => {
      try {
        const r = await fetch('https://ntfy.sh/' + encodeURIComponent(env.NTFY_TOPIC), {
          method: 'POST',
          headers: headers,
          body: title + '\n' + body
        });
        console.log('[notify] ntfy response status=' + r.status);
      } catch (e) {
        console.error('[notify] ntfy fetch failed: ' + (e && e.message));
      }
    })());
  } else {
    console.log('[notify] skipped — NTFY_TOPIC secret not available');
  }

  // تليجرام — الأكثر موثوقية (مجاني وبدون حدود عملية)
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    jobs.push((async () => {
      try {
        const text = title + '\n\n' + body +
          (opts.telegramHint ? '\n\n' + opts.telegramHint : '') +
          (clickUrl ? '\n\n🔗 ' + clickUrl : '');
        const r = await fetch('https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: text,
            disable_web_page_preview: true
          })
        });
        const jr = await r.json().catch(function () { return null; });
        console.log('[notify] telegram status=' + r.status);
        // احفظ رقم الإشعار عشان الرد المباشر من تليجرام يلاقي الرسالة
        if (opts.saveTg && jr && jr.ok && jr.result && jr.result.message_id && opts.saveTg.id) {
          await env.DB.prepare('UPDATE ' + opts.saveTg.table + ' SET tg_msg_id = ? WHERE id = ?')
            .bind(jr.result.message_id, opts.saveTg.id).run();
        }
      } catch (e) {
        console.error('[notify] telegram failed: ' + (e && e.message));
      }
    })());
  }

  if (env.RESEND_API_KEY) {
    jobs.push((async () => {
      try {
        const admin = await env.DB.prepare('SELECT email FROM admins ORDER BY id ASC LIMIT 1').first();
        if (!admin || !admin.email) return;
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Portfolio <onboarding@resend.dev>',
            to: [admin.email],
            subject: title,
            text: body
          })
        });
      } catch (e) { /* صامت */ }
    })());
  }

  return Promise.all(jobs);
}

// نفّذ في الخلفية من غير ما نعطّل رد الـ API
function schedule(ctx, promise) {
  if (ctx && ctx.waitUntil) ctx.waitUntil(promise);
  else promise.catch(() => {});
}

// ============================================================================
// إرسال رد بالإيميل للزائر — بيستخدم Resend (لو متظبط) أو Gmail Webhook
// بيرجّع { sent, provider: 'resend'|'gmail'|null, detail }
// ============================================================================
async function sendReplyEmail(env, msgRow, text) {
  const admin = await env.DB.prepare('SELECT email FROM admins ORDER BY id ASC LIMIT 1').first();
  const subject = 'Re: ' + (msgRow.subject || 'Your message');
  const fullText = text +
    '\n\n—\n' + (env.SITE_NAME || 'Your Name') + '\n' + siteBase(env) +
    '\n\n--------\nYour original message (' + (msgRow.created_at || '') + '):\n' +
    String(msgRow.text || '').split('\n').map(function (l) { return '> ' + l; }).join('\n');

  // 1) Resend (الأفضل — لما يبقى في دومين خاص)
  if (env.RESEND_API_KEY && env.RESEND_FROM) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to: [msgRow.email],
        reply_to: admin ? admin.email : undefined,
        subject: subject,
        text: fullText
      })
    });
    if (res.ok) return { sent: true, provider: 'resend' };
    return { sent: false, provider: 'resend', detail: 'Resend ' + res.status + ': ' + (await res.text()).slice(0, 200) };
  }

  // 2) Gmail Webhook (شغال من غير دومين — من جيميلك مباشرة)
  if (env.GMAIL_WEBHOOK_URL) {
    const res = await fetch(env.GMAIL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.GMAIL_WEBHOOK_SECRET || '',
        to: msgRow.email,
        subject: subject,
        text: fullText
      })
    });
    if (!res.ok) return { sent: false, provider: 'gmail', detail: 'Webhook ' + res.status + ': ' + (await res.text()).slice(0, 200) };
    try {
      const b = await res.json();
      if (b && b.ok === false) return { sent: false, provider: 'gmail', detail: b.error || 'webhook error' };
    } catch (e) { /* نجاح بدون JSON صريح */ }
    return { sent: true, provider: 'gmail' };
  }

  return { sent: false, provider: null, detail: 'not configured' };
}

// ============================================================================
// Telegram Webhook — بيستقبل ردودك المباشرة من البوت على الإشعارات
// (لما تعمل Reply على إشعار رسالة وتكتب ردك → يوصل للزائر بالإيميل فوراً)
// ============================================================================
async function handleTelegram(parts, request, env) {
  if (parts[0] !== 'webhook') return new Response('Not found', { status: 404 });
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // التحقق إن الطلب جاي من تليجرام فعلاً (Secret Token متسجل مع setWebhook)
  const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token') || '';
  if (!env.TELEGRAM_WEBHOOK_SECRET || !timingSafeEqual(secret, env.TELEGRAM_WEBHOOK_SECRET)) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const update = await request.json();
    const msg = update && update.message;
    if (!msg || !msg.text) return j({ ok: true });

    // بس من شات الأدمن
    const chatId = String((msg.chat && msg.chat.id) || '');
    if (!env.TELEGRAM_CHAT_ID || chatId !== String(env.TELEGRAM_CHAT_ID)) return j({ ok: true });

    async function replyInChat(text) {
      await fetch('https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text, disable_web_page_preview: true })
      }).catch(function () {});
    }

    const repliedTo = msg.reply_to_message;
    if (repliedTo && repliedTo.message_id) {
      // الرد على إشعار → دوّر على الرسالة المرتبطة
      const row = await env.DB.prepare('SELECT * FROM messages WHERE tg_msg_id = ? ORDER BY id DESC LIMIT 1')
        .bind(Number(repliedTo.message_id)).first();

      if (!row) {
        await replyInChat('⚠️ مش لاقي الرسالة المرتبطة بالإشعار ده.\nيمكن تكون اتمسحت من الداشبورد.');
        return j({ ok: true });
      }

      const text = String(msg.text).trim().slice(0, 4000);
      const result = await sendReplyEmail(env, row, text);

      if (result.sent) {
        await env.DB.prepare("UPDATE messages SET is_replied = 1, reply_text = ?, replied_at = datetime('now') WHERE id = ?")
          .bind(text, row.id).run();
        await replyInChat('✅ تم إرسال ردك بالإيميل إلى:\n' + row.name + ' <' + row.email + '>');
      } else if (result.provider === null) {
        await replyInChat('⚠️ إرسال الإيميلات لسه مش مفعّل.\nخلّص خطوة Google Apps Script (الـ 3 دقايق) وبعدها الردود من هنا هتشتغل فوراً.');
      } else {
        await replyInChat('❌ فشل الإرسال:\n' + (result.detail || 'خطأ غير معروف') + '\n\nجرّب تاني بعد شوية.');
      }
      return j({ ok: true });
    }

    // رسالة عادية (مش رد) → إرشادات
    await replyInChat(
      '🪄 إزاي ترد على زائر من هنا:\n\n' +
      '1️⃣ استنى إشعار "New portfolio message"\n' +
      '2️⃣ اعمل Long-press عليه واختار ↩️ Reply\n' +
      '3️⃣ اكتب ردك وابعته — هيوصل للزائر على إيميله فوراً\n\n' +
      'أو من الداشبورد:\n🔗 ' + siteBase(env) + '/dashboard/messages/messages.html'
    );
    return j({ ok: true });

  } catch (err) {
    console.error('telegram webhook error:', (err && err.message) || err);
    return j({ ok: true }); // نرجّع 200 عشان تليجرام مايعيدش المحاولة في حلقة
  }
}

// دفاع CSRF: أي طلب معدِّل لازم يجي من fetch تبع نفس الموقع
function requireJson(request) {
  return (request.headers.get('X-Requested-With') || '') === 'XMLHttpRequest';
}

async function getAuth(env, request) {
  const token = getCookie(request, 'session');
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    `SELECT s.id AS session_id, s.expires_at, a.email
     FROM sessions s JOIN admins a ON a.id = s.admin_id
     WHERE s.token_hash = ?`
  ).bind(tokenHash).first();
  if (!row) return null;
  if (Number(row.expires_at) < Date.now()) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(row.session_id).run();
    return null;
  }
  return row;
}

// ============================================================================
// التحقق من المدخلات (whitelist) — ضد أي حقول غريبة
// ============================================================================
function validate(table, body, opts) {
  opts = opts || {};
  const isPublic = !!opts.public;
  const partial = !!opts.partial;
  const def = TABLES[table];
  const out = {};
  const errors = [];

  for (const key of Object.keys(body || {})) {
    const spec = def.fields[key];
    if (!spec) continue;                       // حقل غير معروف → تجاهل
    if (isPublic && spec.adminOnly) continue;  // is_approved ممنوع على الزوار

    let v = body[key];
    switch (spec.type) {
      case 'string': {
        if (v === null || v === undefined) v = '';
        v = String(v).trim();
        if (v.length > spec.max) { errors.push('"' + key + '" too long (max ' + spec.max + ')'); continue; }
        break;
      }
      case 'enum': {
        v = String(v);
        if (!spec.values.includes(v)) { errors.push('"' + key + '" must be one of: ' + spec.values.join(', ')); continue; }
        break;
      }
      case 'int': {
        v = Number.parseInt(v, 10);
        if (Number.isNaN(v)) { errors.push('"' + key + '" must be a number'); continue; }
        if (spec.min !== undefined && v < spec.min) v = spec.min;
        if (spec.max !== undefined && v > spec.max) v = spec.max;
        break;
      }
      case 'bool': { v = v ? 1 : 0; break; }
      case 'json': {
        if (typeof v === 'string') {
          try { v = JSON.parse(v); } catch { errors.push('"' + key + '" must be a valid JSON array'); continue; }
        }
        if (!Array.isArray(v)) { errors.push('"' + key + '" must be an array'); continue; }
        v = JSON.stringify(v.slice(0, spec.maxItems).map(x => String(x).slice(0, spec.maxLen)));
        break;
      }
    }
    out[key] = v;
  }

  if (!partial) {
    for (const [key, spec] of Object.entries(def.fields)) {
      if (spec.required && (out[key] === undefined || out[key] === '')) {
        errors.push('"' + key + '" is required');
      }
    }
  }
  return { out: out, errors: errors };
}

function serialize(table, row, isPublic) {
  const def = TABLES[table];
  const restrict = (isPublic && def.publicFields) ? new Set(def.publicFields) : null;
  const out = {};
  for (const [key, value] of Object.entries(row || {})) {
    if (restrict && !restrict.has(key)) continue;
    const spec = def.fields[key];
    if (spec && spec.type === 'json') {
      try { out[key] = JSON.parse(value || '[]'); } catch { out[key] = []; }
    } else {
      out[key] = value;
    }
  }
  return out;
}

// ============================================================================
// Public API — للزوار (بدون تسجيل دخول)
// ============================================================================
async function buildSite(env) {
  const [hero, skills, projects, certifications, social, testimonials, experience] = await Promise.all([
    env.DB.prepare(`SELECT * FROM hero_section ORDER BY id ASC LIMIT 1`).first(),
    env.DB.prepare(`SELECT * FROM skills ORDER BY "order" ASC, id ASC`).all(),
    env.DB.prepare(`SELECT * FROM projects ORDER BY "order" ASC, id ASC`).all(),
    env.DB.prepare(`SELECT * FROM certifications ORDER BY "order" ASC, id ASC`).all(),
    env.DB.prepare(`SELECT * FROM social_links ORDER BY "order" ASC, id ASC`).all(),
    env.DB.prepare(`SELECT * FROM testimonials WHERE is_approved = 1 ORDER BY created_at DESC, id DESC`).all(),
    env.DB.prepare(`SELECT * FROM experience ORDER BY "order" ASC, id ASC`).all()
  ]);
  return {
    hero: hero ? serialize('hero_section', hero, true) : null,
    skills: (skills.results || []).map(r => serialize('skills', r, true)),
    projects: (projects.results || []).map(r => serialize('projects', r, true)),
    certifications: (certifications.results || []).map(r => serialize('certifications', r, true)),
    social_links: (social.results || []).map(r => serialize('social_links', r, true)),
    testimonials: (testimonials.results || []).map(r => serialize('testimonials', r, true)),
    experience: (experience.results || []).map(r => serialize('experience', r, true))
  };
}

async function handlePublic(parts, request, env, ctx) {
  const method = request.method;
  const table = parts[0];

  // POST /api/public/testimonials — إرسال تقييم من زائر
  if (method === 'POST' && table === 'testimonials') {
    if (!requireJson(request)) return j({ error: 'Bad request' }, 400);

    // حماية من السبام: 3 إرسالات كحد أقصى في الساعة من نفس الجهاز
    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const now = Date.now();
    const recent = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM public_submissions WHERE ip = ? AND kind = ? AND submitted_at > ?'
    ).bind(ip, 'testimonial', now - 60 * 60 * 1000).first();
    if (recent.n >= 3) {
      return j({ error: 'Too many submissions from this device. Please try again in an hour.' }, 429);
    }

    const body = await readBody(request);
    const { out, errors } = validate('testimonials', body, { public: true, partial: false });
    if (errors.length) return j({ error: errors.join('; ') }, 400);
    if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) return j({ error: 'Invalid email' }, 400);

    out.is_approved = 0; // إجباري — الموافقة قرار الأدمن فقط
    const cols = Object.keys(out);
    const sql = `INSERT INTO testimonials (${cols.map(c => '"' + c + '"').join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
    await env.DB.prepare(sql).bind(...cols.map(c => out[c])).run();

    // سجّل الإرسال + نظّف السجلات القديمة
    await env.DB.prepare('INSERT INTO public_submissions (ip, kind, submitted_at) VALUES (?, ?, ?)')
      .bind(ip, 'testimonial', now).run();
    await env.DB.prepare('DELETE FROM public_submissions WHERE submitted_at < ?')
      .bind(now - 24 * 60 * 60 * 1000).run();

    // إشعار فوري (لو المفاتيح متظبطة)
    schedule(ctx, notifyAdmin(env, 'New testimonial (pending review)',
      'From: ' + out.name + ' — ' + (out.rating || 5) + '/5 stars\n\n' + out.text,
      siteBase(env) + '/dashboard/testimonials/testimonials.html',
      'star'));

    return j({ ok: true }, 201);
  }

  // POST /api/public/messages — رسالة من زائر
  if (method === 'POST' && table === 'messages') {
    if (!requireJson(request)) return j({ error: 'Bad request' }, 400);

    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const now = Date.now();
    const recent = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM public_submissions WHERE ip = ? AND kind = ? AND submitted_at > ?'
    ).bind(ip, 'message', now - 60 * 60 * 1000).first();
    if (recent.n >= 3) {
      return j({ error: 'Too many messages from this device. Please try again in an hour.' }, 429);
    }

    const body = await readBody(request);
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const subject = String(body.subject || '').trim();
    const text = String(body.text || '').trim();

    if (!name || name.length > 100) return j({ error: '"name" is required (max 100)' }, 400);
    if (!email || email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return j({ error: 'A valid "email" is required' }, 400);
    if (subject.length > 200) return j({ error: '"subject" is too long (max 200)' }, 400);
    if (!text || text.length > 5000) return j({ error: '"text" is required (max 5000)' }, 400);

    const ins = await env.DB.prepare('INSERT INTO messages (name, email, subject, text, is_read) VALUES (?, ?, ?, ?, 0)')
      .bind(name, email, subject, text).run();
    const newMsgId = (ins.meta && ins.meta.last_row_id) || null;

    await env.DB.prepare('INSERT INTO public_submissions (ip, kind, submitted_at) VALUES (?, ?, ?)')
      .bind(ip, 'message', now).run();
    await env.DB.prepare('DELETE FROM public_submissions WHERE submitted_at < ?')
      .bind(now - 24 * 60 * 60 * 1000).run();

    // إشعار فوري (لو المفاتيح متظبطة) — من غير ما يعطّل الرد
    schedule(ctx, notifyAdmin(env, 'New portfolio message',
      'From: ' + name + ' <' + email + '>\nSubject: ' + (subject || '(no subject)') + '\n\n' + text,
      siteBase(env) + '/dashboard/messages/messages.html',
      'incoming_envelope',
      {
        telegramHint: '↩️ اعمل Reply على الرسالة دي واكتب ردك — هيوصل للزائر بالإيميل فوراً',
        saveTg: { table: 'messages', id: newMsgId }
      }));

    return j({ ok: true }, 201);
  }

  // POST /api/public/track — عدّاد زوار مجهول الهوية (بدون IP أو كوكيز)
  if (method === 'POST' && table === 'track') {
    if (!requireJson(request)) return j({ error: 'Bad request' }, 400);

    const body = await readBody(request);
    const path = String(body.path || '').slice(0, 300);
    const referrer = String(body.referrer || '').slice(0, 300);
    const visitor = String(body.visitor || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40);
    if (!path || path[0] !== '/') return j({ error: 'Bad path' }, 400);

    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const now = Date.now();

    // منع تكرار نفس الزائر لنفس الصفحة خلال دقيقة (refresh spam)
    const dup = await env.DB.prepare(
      `SELECT id FROM page_views WHERE visitor = ? AND path = ? AND created_at >= datetime('now','-60 seconds') LIMIT 1`
    ).bind(visitor, path).first();
    if (dup) return j({ ok: true, skipped: 'duplicate' });

    // حد أقصى 120 مشاهدة في الساعة من نفس الجهاز
    const recent = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM public_submissions WHERE ip = ? AND kind = ? AND submitted_at > ?'
    ).bind(ip, 'track', now - 60 * 60 * 1000).first();
    if (recent.n >= 120) return j({ ok: true, skipped: 'rate_limited' });

    const country = (request.cf && request.cf.country) || '';
    await env.DB.prepare('INSERT INTO page_views (path, referrer, country, visitor) VALUES (?, ?, ?, ?)')
      .bind(path, referrer, country, visitor).run();
    await env.DB.prepare('INSERT INTO public_submissions (ip, kind, submitted_at) VALUES (?, ?, ?)')
      .bind(ip, 'track', now).run();

    // تنظيف نادر: احذف الأقدم من 90 يوم
    if (Math.random() < 0.05) {
      await env.DB.prepare(`DELETE FROM page_views WHERE created_at < datetime('now','-90 days')`).run();
      await env.DB.prepare('DELETE FROM public_submissions WHERE submitted_at < ?')
        .bind(now - 24 * 60 * 60 * 1000).run();
    }
    return j({ ok: true }, 201);
  }

  if (method !== 'GET') return j({ error: 'Method not allowed' }, 405);

  // GET /api/public/site — كل بيانات الصفحة بضربة واحدة
  if (!table || table === 'site') {
    return j(await buildSite(env));
  }

  // GET /api/public/posts — قائمة المقالات المنشورة (بدون المحتوى الكامل)
  // GET /api/public/posts/:slug — مقالة واحدة كاملة
  if (table === 'posts') {
    const slug = parts[1];
    if (slug) {
      const row = await env.DB.prepare(`SELECT * FROM posts WHERE slug = ? AND is_published = 1`).bind(slug).first();
      if (!row) return j({ error: 'Not found' }, 404);
      return j(serialize('posts', row, false));
    }
    const { results } = await env.DB.prepare(
      `SELECT id, slug, title_en, title_ar, excerpt_en, excerpt_ar, cover_url, tags, created_at
       FROM posts WHERE is_published = 1 ORDER BY created_at DESC, id DESC LIMIT 100`
    ).all();
    return j({ results: (results || []).map(r => serialize('posts', r, false)) });
  }

  const def = TABLES[table];
  if (!def) return j({ error: 'Not found' }, 404);

  if (table === 'testimonials') {
    const { results } = await env.DB.prepare(
      `SELECT * FROM testimonials WHERE is_approved = 1 ORDER BY created_at DESC, id DESC`
    ).all();
    return j({ results: (results || []).map(r => serialize('testimonials', r, true)) });
  }

  const { results } = await env.DB.prepare(`SELECT * FROM ${table} ORDER BY ${def.orderBy}`).all();
  return j({ results: (results || []).map(r => serialize(table, r, true)) });
}

// ============================================================================
// Auth API — تسجيل الدخول والجلسات
// ============================================================================
async function handleAuth(parts, request, env) {
  const action = parts[0] || '';
  const method = request.method;

  // POST /api/auth/setup — التهيئة الأولى فقط (لو مفيش أدمن)
  if (action === 'setup' && method === 'POST') {
    if (!requireJson(request)) return j({ error: 'Bad request' }, 400);
    const adminCount = await env.DB.prepare('SELECT COUNT(*) AS n FROM admins').first();
    if (adminCount.n > 0) return j({ error: 'Setup already completed' }, 403);

    const body = await readBody(request);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return j({ error: 'Invalid email' }, 400);
    if (password.length < 8) return j({ error: 'Password must be at least 8 characters' }, 400);

    const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
    const hash = await hashPassword(password, salt);
    await env.DB.prepare('INSERT INTO admins (email, password_hash, salt) VALUES (?, ?, ?)')
      .bind(email, hash, salt).run();
    return j({ ok: true });
  }

  // POST /api/auth/login
  if (action === 'login' && method === 'POST') {
    if (!requireJson(request)) return j({ error: 'Bad request' }, 400);
    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const now = Date.now();

    const fails = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND success = 0 AND attempted_at > ?'
    ).bind(ip, now - LOGIN_WINDOW_MS).first();
    if (fails.n >= MAX_LOGIN_FAILS) return j({ error: 'Too many attempts. Try again later.' }, 429);

    const body = await readBody(request);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    const admin = await env.DB.prepare('SELECT * FROM admins WHERE email = ?').bind(email).first();
    let ok = false;
    if (admin) {
      const hash = await hashPassword(password, admin.salt);
      ok = timingSafeEqual(hash, admin.password_hash);
    }

    await env.DB.prepare('INSERT INTO login_attempts (ip, success, attempted_at) VALUES (?, ?, ?)')
      .bind(ip, ok ? 1 : 0, now).run();
    // تنظيف المحاولات الأقدم من 24 ساعة
    await env.DB.prepare('DELETE FROM login_attempts WHERE attempted_at < ?')
      .bind(now - 24 * 60 * 60 * 1000).run();

    if (!ok) return j({ error: 'Invalid email or password' }, 401);

    const token = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare('INSERT INTO sessions (token_hash, admin_id, expires_at) VALUES (?, ?, ?)')
      .bind(tokenHash, admin.id, now + SESSION_TTL_MS).run();

    const secure = new URL(request.url).protocol === 'https:';
    return new Response(JSON.stringify({ ok: true, email: admin.email }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Set-Cookie': sessionCookie(token, secure, Math.floor(SESSION_TTL_MS / 1000))
      }
    });
  }

  // POST /api/auth/logout
  if (action === 'logout' && method === 'POST') {
    const token = getCookie(request, 'session');
    if (token) {
      const tokenHash = await sha256Hex(token);
      await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Set-Cookie': 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
      }
    });
  }

  // GET /api/auth/me
  if (action === 'me' && method === 'GET') {
    const auth = await getAuth(env, request);
    if (!auth) return j({ error: 'Unauthorized' }, 401);
    return j({ email: auth.email });
  }

  // GET /api/auth/status — حالة النظام (للتهيئة الأولى وصفحة الدخول)
  if (action === 'status' && method === 'GET') {
    const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM admins').first();
    const auth = await getAuth(env, request);
    return j({
      needs_setup: count.n === 0,
      authenticated: !!auth,
      email: auth ? auth.email : null
    });
  }

  // POST /api/auth/password — تغيير كلمة السر
  if (action === 'password' && method === 'POST') {
    if (!requireJson(request)) return j({ error: 'Bad request' }, 400);
    const auth = await getAuth(env, request);
    if (!auth) return j({ error: 'Unauthorized' }, 401);

    const body = await readBody(request);
    const current = String(body.current || '');
    const next = String(body.new || '');
    if (next.length < 8) return j({ error: 'New password must be at least 8 characters' }, 400);

    const admin = await env.DB.prepare('SELECT * FROM admins WHERE email = ?').bind(auth.email).first();
    const hash = await hashPassword(current, admin.salt);
    if (!timingSafeEqual(hash, admin.password_hash)) return j({ error: 'Current password is incorrect' }, 401);

    const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
    const newHash = await hashPassword(next, salt);
    await env.DB.prepare('UPDATE admins SET password_hash = ?, salt = ? WHERE id = ?')
      .bind(newHash, salt, admin.id).run();
    // إنهاء كل الجلسات القديمة وإجبار تسجيل دخول جديد
    await env.DB.prepare('DELETE FROM sessions WHERE admin_id = ?').bind(admin.id).run();
    return j({ ok: true });
  }

  return j({ error: 'Not found' }, 404);
}

// ============================================================================
// Admin API — CRUD كامل (لازم جلسة صحيحة)
// ============================================================================
async function handleAdmin(parts, request, env) {
  const auth = await getAuth(env, request);
  if (!auth) return j({ error: 'Unauthorized' }, 401);

  const table = parts[0];
  const id = parts[1];
  const method = request.method;

  // POST /api/admin/upload — رفع صورة إلى R2
  if (table === 'upload') {
    if (method !== 'POST') return j({ error: 'Method not allowed' }, 405);
    if (!env.IMAGES) return j({ error: 'Image storage is not configured on the server' }, 500);

    let form;
    try { form = await request.formData(); } catch (e) { return j({ error: 'Invalid form data' }, 400); }

    const file = form.get('file');
    if (!file || typeof file === 'string') return j({ error: 'No file provided' }, 400);

    const type = file.type || '';
    const extMap = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
      'image/svg+xml': 'svg', 'image/avif': 'avif', 'image/x-icon': 'ico',
      'application/pdf': 'pdf'
    };
    if (!extMap[type]) {
      return j({ error: 'Unsupported file type: ' + (type || 'unknown') + ' — allowed: images + pdf' }, 400);
    }

    const maxSize = type === 'application/pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) return j({ error: 'File too large (max ' + (maxSize / 1024 / 1024) + 'MB)' }, 400);

    const filename = Date.now().toString(36) + '-' + bytesToHex(crypto.getRandomValues(new Uint8Array(4))) + '.' + extMap[type];
    const key = 'img/' + filename;
    const buf = await file.arrayBuffer();
    await env.IMAGES.put(key, buf, { httpMetadata: { contentType: type } });
    return j({ ok: true, url: '/api/img/' + filename }, 201);
  }

  // GET /api/admin/analytics — إحصائيات الزوار
  if (table === 'analytics') {
    if (method !== 'GET') return j({ error: 'Method not allowed' }, 405);
    const [total, last7, today, uniq7, daily, pages, refs, countries] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) AS n FROM page_views`).first(),
      env.DB.prepare(`SELECT COUNT(*) AS n FROM page_views WHERE created_at >= datetime('now','-7 days')`).first(),
      env.DB.prepare(`SELECT COUNT(*) AS n FROM page_views WHERE created_at >= date('now')`).first(),
      env.DB.prepare(`SELECT COUNT(DISTINCT visitor) AS n FROM page_views WHERE created_at >= datetime('now','-7 days') AND visitor != ''`).first(),
      env.DB.prepare(`SELECT substr(created_at, 1, 10) AS d, COUNT(*) AS n FROM page_views WHERE created_at >= datetime('now','-13 days') GROUP BY d ORDER BY d ASC`).all(),
      env.DB.prepare(`SELECT path, COUNT(*) AS n FROM page_views WHERE created_at >= datetime('now','-30 days') GROUP BY path ORDER BY n DESC LIMIT 10`).all(),
      env.DB.prepare(`SELECT referrer, COUNT(*) AS n FROM page_views WHERE created_at >= datetime('now','-30 days') AND referrer != '' GROUP BY referrer ORDER BY n DESC LIMIT 10`).all(),
      env.DB.prepare(`SELECT country, COUNT(*) AS n FROM page_views WHERE created_at >= datetime('now','-30 days') AND country != '' GROUP BY country ORDER BY n DESC LIMIT 10`).all()
    ]);
    return j({
      totals: { all: total.n, last7: last7.n, today: today.n, unique_visitors_7d: uniq7.n },
      daily: daily.results || [],
      top_pages: pages.results || [],
      top_referrers: refs.results || [],
      top_countries: countries.results || []
    });
  }

  // GET /api/admin/export — نسخة احتياطية كاملة من المحتوى (JSON)
  if (table === 'export') {
    if (method !== 'GET') return j({ error: 'Method not allowed' }, 405);
    const exportTables = ['hero_section', 'skills', 'projects', 'certifications', 'social_links', 'experience', 'testimonials', 'messages', 'posts'];
    const out = { exported_at: new Date().toISOString(), tables: {} };
    for (const t of exportTables) {
      const { results } = await env.DB.prepare(`SELECT * FROM ${t} ORDER BY id ASC`).all();
      out.tables[t] = (results || []).map(r => serialize(t, r, false));
    }
    return j(out);
  }

  // POST /api/admin/messages/:id/reply — رد مباشر بالإيميل على رسالة الزائر
  if (table === 'messages' && id && parts[2] === 'reply') {
    if (method !== 'POST') return j({ error: 'Method not allowed' }, 405);
    if (!requireJson(request)) return j({ error: 'Bad request' }, 400);

    const body = await readBody(request);
    const text = String(body.text || '').trim();
    if (!text || text.length > 4000) return j({ error: 'Reply text is required (max 4000 characters)' }, 400);

    const msg = await env.DB.prepare('SELECT * FROM messages WHERE id = ?').bind(Number(id)).first();
    if (!msg) return j({ error: 'Message not found' }, 404);

    const result = await sendReplyEmail(env, msg, text);
    if (result.provider === null) {
      return j({
        error: 'Direct email replies are not configured yet.',
        hint: 'Set GMAIL_WEBHOOK_URL (works today) or RESEND_API_KEY + RESEND_FROM (with your own domain).'
      }, 412);
    }
    if (!result.sent) return j({ error: 'Email sending failed', detail: result.detail }, 502);

    await env.DB.prepare("UPDATE messages SET is_replied = 1, reply_text = ?, replied_at = datetime('now') WHERE id = ?")
      .bind(text.slice(0, 4000), Number(id)).run();

    return j({ ok: true, provider: result.provider });
  }

  const def = TABLES[table];
  if (!def) return j({ error: 'Not found' }, 404);

  const q = c => '"' + c + '"';

  if (method === 'GET') {
    if (id) {
      const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(Number(id)).first();
      if (!row) return j({ error: 'Not found' }, 404);
      return j(serialize(table, row, false));
    }
    const { results } = await env.DB.prepare(`SELECT * FROM ${table} ORDER BY ${def.orderBy}`).all();
    return j({ results: (results || []).map(r => serialize(table, r, false)) });
  }

  if (method === 'POST' || method === 'PUT') {
    if (!requireJson(request)) return j({ error: 'Bad request' }, 400);
    const body = await readBody(request);
    const v = validate(table, body, { partial: method === 'PUT' });
    if (v.errors.length) return j({ error: v.errors.join('; ') }, 400);

    // المقالات: تنظيف الـ slug + ضمان إنه فريد
    if (table === 'posts' && (method === 'POST' || v.out.slug !== undefined)) {
      const base = sanitizeSlug(v.out.slug || v.out.title_en || '') || ('post-' + Date.now().toString(36));
      v.out.slug = await uniqueSlug(env, base, method === 'PUT' ? Number(id) : null);
    }

    const cols = Object.keys(v.out);
    if (!cols.length) return j({ error: 'No valid fields provided' }, 400);

    if (method === 'POST') {
      const sql = `INSERT INTO ${table} (${cols.map(q).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
      const res = await env.DB.prepare(sql).bind(...cols.map(c => v.out[c])).run();
      const newId = res.meta ? res.meta.last_row_id : null;
      const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(newId).first();
      return j(serialize(table, row, false), 201);
    }

    // PUT — تعديل جزئي
    if (!id) return j({ error: 'id required' }, 400);
    const extra = (table === 'hero_section' || table === 'posts') ? ", updated_at = datetime('now')" : '';
    const sql = `UPDATE ${table} SET ${cols.map(c => q(c) + ' = ?').join(', ')}${extra} WHERE id = ?`;
    const res = await env.DB.prepare(sql).bind(...cols.map(c => v.out[c]), Number(id)).run();
    if (res.meta && res.meta.changes === 0) return j({ error: 'Not found' }, 404);
    const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(Number(id)).first();
    return j(serialize(table, row, false));
  }

  if (method === 'DELETE') {
    if (!id) return j({ error: 'id required' }, 400);
    const res = await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(Number(id)).run();
    if (res.meta && res.meta.changes === 0) return j({ error: 'Not found' }, 404);
    return j({ ok: true });
  }

  return j({ error: 'Method not allowed' }, 405);
}

// ============================================================================
// Image serving — عرض الصور المخزنة في R2
// ============================================================================
async function handleImg(parts, request, env) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (!env.IMAGES) return new Response('Storage not configured', { status: 500 });

  const key = 'img/' + parts.join('/');
  if (!/^img\/[A-Za-z0-9._-]+$/.test(key)) return new Response('Not found', { status: 404 });

  const obj = await env.IMAGES.get(key);
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  headers.set('Content-Type', (obj.httpMetadata && obj.httpMetadata.contentType) || 'application/octet-stream');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  if (obj.httpEtag) headers.set('ETag', obj.httpEtag);
  return new Response(obj.body, { headers });
}

// ============================================================================
// Router
// ============================================================================
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);

  try {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204 });

    if (parts[0] === 'health') return j({ ok: true, time: Date.now() });
    if (parts[0] === 'img')    return await handleImg(parts.slice(1), request, env);
    if (parts[0] === 'public') return await handlePublic(parts.slice(1), request, env, context);
    if (parts[0] === 'telegram') return await handleTelegram(parts.slice(1), request, env);
    if (parts[0] === 'auth')   return await handleAuth(parts.slice(1), request, env);
    if (parts[0] === 'admin')  return await handleAdmin(parts.slice(1), request, env);

    return j({ error: 'Not found' }, 404);
  } catch (err) {
    console.error('API error:', (err && err.stack) || err);
    return j({ error: 'Internal server error' }, 500);
  }
}
