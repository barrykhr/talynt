# Website lead capture

`POST https://crm.kivitronicsconsulting.com/api/public/leads`

Submissions go to **Pipeline → Lead inbox**. A team member converts each one
into a company, contact and opportunity, with duplicate checks, or dismisses it
or marks it as spam. Nothing is created automatically, nothing is emailed to
the person who submitted it, and every active team member gets an in-app
notification.

## Enable [owner]

```
LEAD_CAPTURE_ENABLED=true
LEAD_CAPTURE_ALLOWED_ORIGINS=https://kivitronicsconsulting.com,https://www.kivitronicsconsulting.com
CAPTURE_IP_SALT=<random string>
TURNSTILE_SECRET_KEY=<optional Cloudflare Turnstile secret>
```

## Fields

The endpoint accepts JSON or form-encoded data.

| Field | Required |
|---|---|
| `name` | Required |
| `email` | Required, must be valid |
| `company` | Optional |
| `phone` | Optional |
| `role_needed` | Optional |
| `hiring_volume` | Optional |
| `location` | Optional |
| `message` | Optional |
| `page_url` | Optional |

Spam-control fields:

- `website_url` is a honeypot. Keep it visually hidden and empty.
- `form_started_at` is the milliseconds timestamp from when the form was
  rendered. Submissions faster than 3 seconds are dropped.
- `cf-turnstile-response` is used when Turnstile is configured.

## Example form

```html
<form id="kt-lead">
  <input name="name" required> <input name="email" type="email" required>
  <input name="company"> <input name="role_needed"> <textarea name="message"></textarea>
  <input name="website_url" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
  <input type="hidden" name="form_started_at">
  <button>Send</button>
</form>
<script>
  const f = document.getElementById("kt-lead");
  f.form_started_at.value = Date.now();
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const res = await fetch("https://crm.kivitronicsconsulting.com/api/public/leads", { method: "POST", body: new FormData(f) });
    f.innerHTML = res.ok ? "Thanks — we'll be in touch." : "Something went wrong. Please email us.";
  });
</script>
```

## Abuse protection

- **CORS:** browser posts are only accepted from the allowed origins.
- **Rate limits:** 5 submissions per IP per hour, and 300 per day overall.
- **Privacy:** IP addresses are stored only as salted hashes.
- **Spam handling:** honeypot, timing, link-stuffing and optional Turnstile
  checks. Spam gets the same `202` response as a real submission, so bots learn
  nothing.
- **Size:** request bodies are capped at 20 KB.
- **Records:** submissions keep their received timestamp and the website as
  their source.
