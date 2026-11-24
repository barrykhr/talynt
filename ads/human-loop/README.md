# TALYNT LABS — "Human in the loop" (47-second funk ad, two voices)

A funkier companion to "Meet Talyn": the same black-and-lime look, with white
as the colour of people. Every step of hiring is a hand-off. Talyn (lime, a
female voice) does the work, then a person (white, a male voice) checks,
approves, calls or decides.

- 9:16 (1080×1920): Reels, Shorts, Status
- 1:1 (1080×1080): feed posts

On screen there are only the step names, two-word stamps and the TALYN / HUMAN
tags; the voices say the rest. The music is a 120 BPM funk groove
(music.py), with a brass hit every time the human voice comes in. Cuts land on
the beat.

## Where the human is

These are the checkpoints the site already describes (`lib/contour/talyn.ts`:
"Human in the loop", authenticity, hiring managers):

| Step | Talyn | The person |
|---|---|---|
| 01 Brief | Reads your JD | The hiring manager signs off the must-haves |
| 02 Shortlist | Searches and scores every profile | A recruiter reviews every pick |
| 03 Outreach | Drafts a personal message | A recruiter checks it before it goes |
| 04 First call | Keeps every candidate warm | A recruiter makes the first call |
| 05 Checks | Flags anything that doesn't add up | A person takes a look; no auto-rejects |
| 06 Interview | Builds the interview kit | The hiring manager runs it |
| 07 Decision | Lays out the reasons | You make the call |

## Script

| Time | Voice | Line | On screen |
|---|---|---|---|
| 0.3 s | Talyn | Hiring with AI? Keep humans in the loop. | An infinity loop; Talyn's lime dot and a person's white dot chase round it. |
| 3.2 s | Talyn | Meet Talyn, from TALYNT LABS. | **Meet Talyn**: Talyn's orb flies in. |
| 5.1 s | Human | It does the work. We make the calls. | A person flies in from the other side: high five. TALYN · PEOPLE. |
| 7.7 / 9.3 s | Talyn / Human | Talyn reads your JD. / Your hiring manager signs off. | **01 Brief** · must-haves → **Signed off** |
| 11.7 / 14.2 s | | Talyn searches and scores every profile. / A recruiter reviews every pick. | **02 Shortlist** · three scored candidates → **Reviewed** |
| 16.7 / 18.6 s | | Talyn drafts a personal message. / A recruiter checks it before it goes. | **03 Outreach** · a message drafting → **Approved** |
| 21.2 / 23.2 s | | Talyn keeps every candidate warm. / A recruiter makes the first call. | **04 First call** · engagement warming → **On the call** |
| 25.7 / 28.0 s | | Talyn flags anything that doesn't add up. / A person takes a look. No auto-rejects. | **05 Checks** · six checks, one flagged → **Taking a look** |
| 31.2 / 33.0 s | | Talyn builds the interview kit. / Your hiring manager runs it. | **06 Interview** · questions tagged to the JD → **Interviewing** |
| 35.7 / 37.4 s | | Talyn lays out the reasons. / And you make the call. | **07 Decision** · the reasons and a 96 → **Your call** |
| 39.2 / 41.0 s | | AI finds who to talk to. / People do the talking. | The loop again; the person's dot pulses. |
| 42.7 s | Talyn | TALYNT LABS. Talent intelligence, built for hiring. | Talyn + person, the logo, **Book a demo →**, talyntlabs.com, confetti. |

The lines are drawn from the Talyn editions' proposed copy and the approved
tagline, and need the same approval. The people (DV, PR), candidates and scores
are fictional, and the ad says so on screen.

## Render

```bash
# voiceover (two voices, from vo.json) — see ../meet-talyn/README.md for the venv and model files
.venv/bin/python ads/meet-talyn/voiceover.py <model dir> ads/human-loop/out/voiceover.wav ads/human-loop/vo.json
# music
.venv/bin/python ads/human-loop/music.py ads/human-loop/out/music.wav
# video
VOICEOVER=ads/human-loop/out/voiceover.wav node ads/human-loop/render.mjs all ads/human-loop/out
```

Output: `talynt-human-loop-9x16.mp4` and `talynt-human-loop-1x1.mp4` (H.264, 30 fps,
AAC at −16 LUFS; the music ducks under the voices).

The voices are synthetic (Kokoro, open source, run locally): `af_heart` for
Talyn and `am_michael` for the human. "Talyn" is spoken "Talin", "TALYNT LABS"
"Talent Labs".
