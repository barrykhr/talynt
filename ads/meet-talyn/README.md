# TALYNT LABS — "Meet Talyn" (36-second ad, with voiceover)

Introduces Talyn, TALYNT LABS's AI hiring agent that hires for intent, in the
black-and-lime look of the Talyn editions of the site. It opens on the site's
"Got a hiring problem? Talyn is here to help." pop-up.

- 9:16 (1080×1920): Reels, Shorts, Status
- 1:1 (1080×1080): feed posts

It reads with the sound off (captions carry the message) and has a voiceover
in an Indian English female voice, over the same synthesised sound design as
"One click". There is no licensed music.

## Script

| Time | Scene | Caption | Voiceover | On screen |
|---|---|---|---|---|
| 0.0–2.1 s | Hook | **Got a hiring** *problem?* | Got a hiring problem? | The site's pop-up: "Talyn is here to help", with the four hiring problems. |
| 2.1–5.9 s | 01 Meet Talyn | **Meet Talyn.** *Your AI hiring agent.* | Meet Talyn. Your AI hiring agent, from TALYNT LABS. | Talyn's orb, its name, and Intent · Context · Reasons. |
| 5.9–10.6 s | 02 Role Insights | **Share the role.** *Talyn reads the JD.* | Share the role. Talyn reads the JD, maps the market, and builds the search. | The parsed JD: must-haves, a Boolean string typing, adjacent titles, the growth path. |
| 10.6–13.9 s | 03 Semantic search | **Ask for the person.** *Get the person.* | Ask for what you want in a candidate. Talyn finds it. | A plain-words request, and three candidates scored out of 100 (A+, A, A). |
| 13.9–17.4 s | 04 Hire for intent | **Who's open to a move.** *And why.* | It hires for intent. Who is open to a move, and why. | The eight switch-intent signals lighting up, and "High intent". |
| 17.4–20.1 s | 05 Outreach | **Personal outreach.** *Email, then WhatsApp.* | Personal outreach, on email and WhatsApp. | An email written from the candidate's profile, sent; then WhatsApp, marked "Opted in". |
| 20.1–24.2 s | 06 Questions & authenticity | **The right questions.** *Answers that add up.* | The right questions for every profile, and a check that it all adds up. | A gap question and answer, then the six authenticity checks. |
| 24.2–28.6 s | 07 For hiring managers | **Hire with reasons.** *Interview on the JD.* | Hiring managers get the reasons, and an interview kit built on the JD. | The candidate with score, intent and health; an interview kit with every question tagged to the JD. |
| 28.6–31.8 s | Hand-over | **AI finds who to talk to.** *People do the talking.* | AI finds who to talk to. People do the talking. | Talyn hands over to your recruiter. "Pay only when you hire." |
| 31.8–36.5 s | End card | *Talent intelligence, built for hiring.* | TALYNT LABS. Talent intelligence, built for hiring. | Meet Talyn · our AI hiring agent · **Book a demo →** · talyntlabs.com |

Every line is from the Talyn editions' proposed copy (`lib/contour/talyn.ts`)
or the approved tagline, and needs the same approval. The candidates, role,
messages and scores are fictional, and the ad says so on screen. WhatsApp is
shown only after the candidate has opted in, as on the site. Voice calls by
Talyn are "coming soon" on the site and are not in the ad.

## Files

- `ad.html`: the composition. Open `ad.html?f=v` or `ad.html?f=s` to watch it live.
- `vo.json`: the voiceover lines and when each one starts. The scene times in
  `ad.html` follow these.
- `voiceover.py`: generates the voiceover locally (see below).
- `render.mjs`: renders the MP4s with the shared sound design
  (`../one-click/audio.mjs`) and mixes in the voiceover. The music and effects
  duck under the voice.

## Render

```bash
# 1. The voiceover (Kokoro, an open-source text-to-speech model, run locally)
python3 -m venv .venv && .venv/bin/pip install kokoro-onnx soundfile
#    download kokoro-v1.0.onnx and voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx releases) into <model dir>
.venv/bin/python ads/meet-talyn/voiceover.py <model dir> ads/meet-talyn/out/voiceover.wav

# 2. The video
VOICEOVER=ads/meet-talyn/out/voiceover.wav node ads/meet-talyn/render.mjs all ads/meet-talyn/out
```

You need Playwright with Chromium, and ffmpeg. Output:

- `talynt-meet-talyn-9x16.mp4` and `talynt-meet-talyn-1x1.mp4`: H.264 at 30 fps,
  AAC at −16 LUFS
- the audio on its own, as a WAV

**About the voice.** The voiceover is synthetic: Kokoro's Indian English female
voice. "Talyn" is spoken as "Talin" and "TALYNT LABS" as "Talent Labs". For a
studio-quality voice, record the same lines in ElevenLabs (see
`ads/voice/ELEVENLABS.md`), keeping each line's start time from `vo.json`, and
pass that file as `VOICEOVER`.
