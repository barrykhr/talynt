# Kivitronics — Diwali 2026 greeting

| File | Use |
|---|---|
| `kivitronics-diwali-600.gif` | Main GIF, 600×600, 25 fps, 6 s seamless loop (~3.8 MB) — WhatsApp, LinkedIn, email |
| `kivitronics-diwali-480.gif` | Lighter email version, 480×480, 20 fps |
| `kivitronics-diwali.html` | Self-contained source animation (fonts embedded, no network needed). Open in any browser to preview. |
| `export-gif.js` | Re-exports the GIF from the HTML |

## Re-export the GIF (after editing the HTML)

Requires Node, Playwright with Chromium (`npm i playwright && npx playwright install chromium`) and ffmpeg.

```bash
node export-gif.js            # 600px, 25 fps  -> kivitronics-diwali-600.gif
node export-gif.js 480 20     # smaller size / frame rate
```

No-install fallback: open the HTML in a browser and screen-record the card for 6 s
(e.g. with ScreenToGif or Kap), then trim to exactly one 6 s loop.

Fonts: Cormorant Garamond and Montserrat (SIL Open Font License), embedded via @fontsource.
