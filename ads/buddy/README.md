# TALYNT LABS — "Meet Buddy" (43 seconds, with voiceover)

Buddy is TALYNT LABS's AI hiring agent. Buddy is a name of its own ("an AI
hiring agent by TALYNT LABS"), so the company can add more agents later.

- 9:16 (1080×1920): Reels, Shorts, Status
- 1:1 (1080×1080): feed posts

**Look.** Bright: an off-white page, black type, lime as the accent
(highlighter swipes behind the step names, buttons, ticks). Nothing in the
background moves.

**Motion.** The ad opens on the words "Got a hiring problem?", which pop in
word by word. Then the steps, by name only. Each step's tiles spring in, stay
completely still while they're read (no pulsing or breathing), and fly out
before the next cut. Cuts land on the beat of a 120 BPM funk track
(music.py), each with a lime or black wipe.

**People.** A person appears in one step only, Relationships: Buddy keeps
every candidate warm, and a recruiter nurtures the relationship.

## Script

| Time | On screen | Voiceover |
|---|---|---|
| 0–2 s | **Got a hiring problem?** | Got a hiring problem? |
| 2–6 s | **Meet Buddy**: the Buddy tile; Intent · Context · Reasons | Meet Buddy. Your AI hiring agent, by TALYNT LABS. |
| 6–11 s | **Role Insights**: must-haves, Boolean string, adjacent titles, growth path | Share the role. Buddy reads the JD, maps the market, and builds the search. |
| 11–14.5 s | **Semantic search**: a plain-words request, three scored candidates | Ask for what you want in a candidate. Buddy finds it. |
| 14.5–18 s | **Hire for intent**: eight switch signals; "High intent" | It hires for intent. Who is open to a move, and why. |
| 18–21 s | **Outreach**: email sent; WhatsApp (opted in) | Personal outreach, on email and WhatsApp. |
| 21–26 s | **Relationships**: Buddy's touchpoints warm up, then a recruiter's tile, "On the call" | Buddy keeps every candidate warm. *(Recruiter:)* And a recruiter nurtures the relationship. |
| 26–30 s | **Authenticity**: a gap question, six checks; "Adds up" | The right questions for every profile, and a check that it all adds up. |
| 30–34.5 s | **Interview kit**: the candidate (96 · A+), questions tagged to the JD | Hiring managers get the reasons, and an interview kit built on the JD. |
| 34.5–38 s | Buddy finds → People talk | AI finds who to talk to. People do the talking. |
| 38–43 s | Logo, Buddy · AI hiring agent, **Book a demo →**, talyntlabs.com | TALYNT LABS. Talent intelligence, built for hiring. |

The lines follow the site's proposed copy, with "Buddy" in place of "Talyn",
plus the approved tagline. They need the same approval. The candidates, the
recruiter (PR) and the scores are fictional, and the ad says so on screen.

## Render

```bash
# voiceover (from vo.json) — see ../meet-talyn/README.md for the venv and model files
.venv/bin/python ads/meet-talyn/voiceover.py <model dir> ads/buddy/out/voiceover.wav ads/buddy/vo.json
# music
.venv/bin/python ads/buddy/music.py ads/buddy/out/music.wav
# video
VOICEOVER=ads/buddy/out/voiceover.wav node ads/buddy/render.mjs all ads/buddy/out
```

Output: `talynt-meet-buddy-9x16.mp4` and `talynt-meet-buddy-1x1.mp4` (H.264, 30 fps,
AAC at −16 LUFS; the music ducks under the voice). Voices are synthetic
(Kokoro, open source, run locally): `af_heart` narrates, `am_michael` is the recruiter.
