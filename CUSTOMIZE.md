# Making this template yours

Everything below is optional but the first two steps take under five minutes and make the biggest difference.

---

## 1. Your name and URL

Edit `wrangler.toml`:

```toml
[vars]
SITE_NAME = "Your Name"
SITE_URL  = "https://your-project.pages.dev"
```

`SITE_URL` is used to build dashboard links inside notifications and in the email reply signature.

While you are there, set the project name:

```toml
name = "your-project"
```

---

## 2. Your content

You do **not** need to touch the database by hand. Open `/dashboard` in the browser and edit:

| Screen | What you change |
|---|---|
| **Hero** | Your name (English + Arabic), bio, rotating titles, profile photo, CV link |
| **Skills** | Skills with icons and a category (technical / soft / tool) |
| **Projects** | Title, description, full case study, images, tech tags, demo + repo links |
| **Experience** | Roles, companies, dates and descriptions |
| **Certifications** | Name, issuer, image and verification link |
| **Social Links** | GitHub, LinkedIn, email, X — anything you like |
| **Blog Posts** | Markdown articles with cover images and tags |
| **Testimonials** | Approve, reject or delete visitor reviews |
| **Settings** | Account and site settings |

Delete the sample rows that ship with `db/schema.sql` (or just edit them in place).

### Profile photo and project images

- Paste any public image URL, **or**
- Create an R2 bucket (`npx wrangler r2 bucket create portfolio-images`) and upload files from the dashboard.

---

## 3. Branding

### Colors

Open `css/style.css` and change the theme variables at the top of the file:

```css
:root {
    --primary-color: #3b82f6;                                /* accent used for buttons and links */
    --gradient-text: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);  /* gradient headline */
}
```

### Logo and icons

Replace the files in `assets/`:

| File | Used for |
|---|---|
| `logo.svg`, `logo.png` | Navbar logo |
| `favicon.svg`, `favicon-32.png` | Browser tab |
| `icon-192.png`, `icon-512.png` | PWA / Android home screen |
| `icon-maskable-512.png` | Android adaptive icon |
| `apple-touch-icon.png` | iOS home screen |
| `og-cover.jpg` | Link previews on WhatsApp, X, LinkedIn |

The navbar wordmark is in `sections/navbar.html`, and the footer text is in `sections/footer.html`.

### Site title and meta tags

Update `<title>`, the description and the Open Graph tags in:

- `index.html`
- `blog/index.html`
- `post.html`
- `robots.txt` and `sitemap.xml` (replace `your-project.pages.dev` with your domain)

---

## 4. Optional integrations

Copy `.env.example` to see every supported variable, then set them as secrets:

```bash
npx wrangler pages secret put TELEGRAM_BOT_TOKEN
```

| Feature | What you need |
|---|---|
| Telegram alerts + replying to visitors from the chat | A bot from [@BotFather](https://t.me/BotFather), plus `setWebhook` pointing at `/api/telegram/webhook` |
| Push notifications | A topic name on [ntfy.sh](https://ntfy.sh) |
| Email replies from your own domain | A [Resend](https://resend.com) account |
| Email replies without a domain | A Google Apps Script webhook |

If you configure none of these, everything still works — you simply read messages in the dashboard.

---

## 5. Removing the sample content

The sample rows are inserted by `db/schema.sql`. To ship an empty site instead, delete the section marked **"Sample content"** in that file before running `npm run db:remote`.

To wipe everything on a database you already deployed:

```bash
npx wrangler d1 execute portfolio-db --remote --command "DELETE FROM projects; DELETE FROM experience; DELETE FROM certifications; DELETE FROM testimonials; DELETE FROM posts;"
```
