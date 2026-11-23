# TALYNT LABS — "One click" (20-second ad)

A 20-second ad that tells TALYNT LABS's seven steps of tech-first hiring in the
black-and-lime look of the site. It comes in two shapes:

- 9:16 (1080×1920): Reels, Shorts, Status
- 1:1 (1080×1080): feed posts

It reads with the sound off (captions carry the message) and has its own sound
design: no licensed music, nothing to clear.

## Script

| Time | Step | Caption | On screen | Sound |
|---|---|---|---|---|
| 0.0–2.6 s | 01 One click | **One click.** *Your next hire, found.* | An HR lead's role brief. The cursor clicks **Find talent** and it switches to "Searching…". | click |
| 2.6–5.4 s | 02 Search everywhere | **Every source.** *At once.* | Professional networks, job boards, developer communities, portfolios & open source, referrals and the TALYNT talent pool stream into TALYNT. "10,000 profiles in the market → a handful who fit." | whoosh, soft ping |
| 5.4–8.0 s | 03 Only the most relevant | **Only the few** *who fit.* | A flood of profiles collapses. Four candidates rise, each with their reasons. | chime |
| 8.0–10.6 s | 04 Automated outreach | **Outreach,** *instantly.* | A WhatsApp message lands, is read and answered. An email shows "Sent". | pings |
| 10.6–12.8 s | 05 Relationships | **Every candidate,** *kept close.* | The relationship bar warms as five touchpoints check off. | ticks |
| 12.8–15.0 s | 06 Automated follow-ups | **Follow-ups,** *automated.* | Candidates move through the pipeline. Reminders and nudges go out. | pings |
| 15.0–17.4 s | 07 You decide | **AI finds signals.** *People understand them.* | The shortlist, ready for review. | chime |
| 17.4–20.0 s | End card | *Talent intelligence, built for hiring.* | TALYNT LABS · Tech-first hiring · **Tell us who you're looking for →** · talyntlabs.com | low hit |

A step bar along the bottom fills 01 → 07 as the ad plays. The product scenes
carry "Illustrative product visuals · fictional candidates", because the role,
candidates and messages are invented for the ad.

The copy comes from three places:

- **Approved:** the tagline, "AI finds signals. People understand them.", and the
  10,000 market figure.
- **Confirmed by TALYNT:** automated WhatsApp/email outreach and follow-ups, shown
  as real capabilities.
- **New for this ad:** everything else, which needs approval like the site's
  proposed copy.

## Files

- `ad.html` — the composition. Open `ad.html?f=v` or `ad.html?f=s` in a browser
  to watch it live.
- `audio.mjs` — the sound design, synthesised with ffmpeg.
- `render.mjs` — renders the MP4s. It pauses the page and steps every
  animation frame by frame, so output is identical on any machine.

## Render

```bash
node ads/one-click/render.mjs all ads/one-click/out   # or v / s for one shape
```

You need Playwright with Chromium, and ffmpeg. The fonts (Source Serif 4, Geist,
Geist Mono) load from Google Fonts. Output:

- `talynt-one-click-9x16.mp4` and `talynt-one-click-1x1.mp4`: H.264 at 30 fps,
  AAC at −16 LUFS
- the audio on its own, as a WAV
