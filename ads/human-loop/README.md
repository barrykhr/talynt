# TALYNT LABS — "Meet Talyn", funk edit (43 seconds, with voiceover)

The "Meet Talyn" steps, recut with a funk groove, opening and closing on the
infinity loop: Talyn's lime dot and a person's white dot chasing round it.

- 9:16 (1080×1920): Reels, Shorts, Status
- 1:1 (1080×1080): feed posts

**The first frame is the loop.** Then the steps, by name only (no numbers).
A person appears in one step only, **Relationships**: Talyn keeps every
candidate warm, and a recruiter nurtures the relationship. Everything else is
Talyn. The loop returns for "AI finds who to talk to. People do the talking."

On screen there are only the step names (plus the TALYN / HUMAN tags in
Relationships); the voiceover says the rest. The music is a 120 BPM funk
groove (music.py) with a brass hit as the recruiter comes in. Cuts land on
the beat, with lime and white wipes, flashes and a camera shake; the step
names' letters hop in and bob to the groove.

## Script

| Time | On screen | Voiceover |
|---|---|---|
| 0–2 s | The infinity loop (first frame) | Got a hiring problem? |
| 2–6 s | **Meet Talyn** | Meet Talyn. Your AI hiring agent, from TALYNT LABS. |
| 6–11 s | **Role Insights** | Share the role. Talyn reads the JD, maps the market, and builds the search. |
| 11–14.5 s | **Semantic search** | Ask for what you want in a candidate. Talyn finds it. |
| 14.5–18 s | **Hire for intent** | It hires for intent. Who is open to a move, and why. |
| 18–21 s | **Outreach** | Personal outreach, on email and WhatsApp. |
| 21–26 s | **Relationships**: Talyn's touchpoints warm up, then a recruiter's card: **On the call** | Talyn keeps every candidate warm. *(Recruiter's voice:)* And a recruiter nurtures the relationship. |
| 26–30 s | **Authenticity** | The right questions for every profile, and a check that it all adds up. |
| 30–34.5 s | **Interview kit** | Hiring managers get the reasons, and an interview kit built on the JD. |
| 34.5–38 s | The infinity loop again | AI finds who to talk to. People do the talking. |
| 38–43 s | Logo, **Book a demo →**, talyntlabs.com | TALYNT LABS. Talent intelligence, built for hiring. |

Every line comes from the Talyn editions' proposed copy and the approved
tagline, and needs the same approval. The candidates, the recruiter (PR) and
the scores are fictional, and the ad says so on screen.

## Render

```bash
# voiceover (from vo.json) — see ../meet-talyn/README.md for the venv and model files
.venv/bin/python ads/meet-talyn/voiceover.py <model dir> ads/human-loop/out/voiceover.wav ads/human-loop/vo.json
# music
.venv/bin/python ads/human-loop/music.py ads/human-loop/out/music.wav
# video
VOICEOVER=ads/human-loop/out/voiceover.wav node ads/human-loop/render.mjs all ads/human-loop/out
```

Output: `talynt-human-loop-9x16.mp4` and `talynt-human-loop-1x1.mp4` (H.264, 30 fps,
AAC at −16 LUFS; the music ducks under the voice).

Voices are synthetic (Kokoro, open source, run locally): `af_heart` for the
narrator and `am_michael` for the recruiter's one line.
