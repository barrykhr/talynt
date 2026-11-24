# TALYNT LABS — "Meet Talyn" (38-second ad, with voiceover and music)

Introduces Talyn, TALYNT LABS's AI hiring agent that hires for intent, in the
black-and-lime look of the Talyn editions of the site. It opens on the site's
"Got a hiring problem?" pop-up.

- 9:16 (1080×1920): Reels, Shorts, Status
- 1:1 (1080×1080): feed posts

**The voiceover carries the words.** On screen there are only the step names:
each one slams in at the centre and lifts to the top, then the product visual
springs in under it. The cuts land on the beat of a 120 BPM track (music.py)
and are marked by a lime wipe, a flash and a camera shake. Sparks rise and the
background pumps on every beat. The voice is an American English female voice.

## Script

| Time | On screen | Voiceover | Visual |
|---|---|---|---|
| 0–2 s | (hook) | Got a hiring problem? | The site's pop-up and its four hiring problems, a giant "?" spinning behind. |
| 2–6 s | **01 Meet Talyn** (the drop) | Meet Talyn. Your AI hiring agent, from TALYNT LABS. | Talyn's orb sends out shockwaves; Intent · Context · Reasons. |
| 6–11 s | **02 Role Insights** | Share the role. Talyn reads the JD, maps the market, and builds the search. | Must-haves, a Boolean string typing, adjacent titles, the growth path. |
| 11–14.5 s | **03 Semantic search** | Ask for what you want in a candidate. Talyn finds it. | A plain-words request; three candidates with score rings counting up. |
| 14.5–18 s | **04 Hire for intent** | It hires for intent. Who is open to a move, and why. | The eight switch signals light up; "High intent" stamps on. |
| 18–21 s | **05 Outreach** | Personal outreach, on email and WhatsApp. | Email sent; WhatsApp (opted in), a reply. |
| 21–25 s | **06 Authenticity** | The right questions for every profile, and a check that it all adds up. | A gap question and answer; six checks; "Adds up" stamps on. |
| 25–29.5 s | **07 Interview kit** | Hiring managers get the reasons, and an interview kit built on the JD. | The candidate (96 · A+), and questions tagged to the JD. |
| 29.5–33 s | **08 People decide** | AI finds who to talk to. People do the talking. | Talyn hands over to a person; the call. |
| 33–38 s | End card | TALYNT LABS. Talent intelligence, built for hiring. | Logo slams in, confetti, **Book a demo →** bouncing on the beat, talyntlabs.com. |

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
- `music.py`: synthesises the music (120 BPM, risers and impacts on every cut). Nothing to license.
- `render.mjs`: renders the MP4s with the shared sound design
  (`../one-click/audio.mjs`) and mixes in the voiceover. The music and effects
  duck under the voice.

## Render

```bash
# 1. The voiceover (Kokoro, an open-source text-to-speech model, run locally)
python3 -m venv .venv && .venv/bin/pip install kokoro-onnx soundfile
#    download kokoro-v1.0.onnx and voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx releases) into <model dir>
.venv/bin/python ads/meet-talyn/voiceover.py <model dir> ads/meet-talyn/out/voiceover.wav

# 2. The music (numpy and soundfile, in the same venv)
.venv/bin/python ads/meet-talyn/music.py ads/meet-talyn/out/music.wav

# 3. The video
VOICEOVER=ads/meet-talyn/out/voiceover.wav node ads/meet-talyn/render.mjs all ads/meet-talyn/out
```

You need Playwright with Chromium, and ffmpeg. Output:

- `talynt-meet-talyn-9x16.mp4` and `talynt-meet-talyn-1x1.mp4`: H.264 at 30 fps,
  AAC at −16 LUFS; the music ducks under the voice
- the audio on its own, as a WAV

**About the voice.** The voiceover is synthetic: Kokoro's American English
female voice (af_heart). "Talyn" is spoken as "Talin" and "TALYNT LABS" as "Talent Labs". For a
studio-quality voice, record the same lines in ElevenLabs (see
`ads/voice/ELEVENLABS.md`), keeping each line's start time from `vo.json`, and
pass that file as `VOICEOVER`.
