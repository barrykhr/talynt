# TALYNT LABS — Buddy feature tour (93 seconds, with voiceover)

Buddy is TALYNT LABS's AI hiring agent. This ad walks through its 22 live
features in six chapters, in the bright "Meet Buddy" look: an off-white page,
black type, lime accents, and still tiles that animate only as they come in
and go out.

- 9:16 (1080×1920): Reels, Shorts, Status
- 1:1 (1080×1080): feed posts

The on-screen text of each feature is exactly as TALYNT supplied it. The
voiceover says one short line per feature. "Illustrative product visuals ·
fictional people" stays on screen throughout. The chapters fill along the
bottom.

## Script

| Chapter | Feature | On screen | Voiceover |
|---|---|---|---|
| — | Hook | Got a hiring problem? | Got a hiring problem? |
| — | Meet Buddy | Buddy · AI hiring agent · TALYNT LABS | Meet Buddy, the AI hiring agent by TALYNT LABS. |
| Define | Role insights | Senior Backend Engineer · Payments infrastructure · Event-driven systems · On-call ownership | Role insights turn your JD into skills, criteria, and a ready search. |
| | Must-haves | Must-have ✓ · Meets all must-haves | Mark the must-haves. Nobody is hidden. |
| | Calibration | Would meet ✓ / Wouldn't meet ✕ / Not sure → Add: Owned a Kafka migration | Your hiring manager reacts to real profiles, and Buddy sharpens the criteria. |
| | Hiring memory | Would meet: owned the Kafka migration end to end | Buddy remembers what each hiring manager wanted. |
| Find | Semantic search | Scaled payments at a startup → Role: Backend Engineer · Skill: Kafka · Location: Bangalore | Search your talent pool in plain English. |
| | Target companies | 25 similar companies · Same domain · Similar headcount | Find similar companies to source from. |
| | Always looking | Found since yesterday · 14 new people to review | Buddy looks for new people every day. |
| | Past candidates | Reached interview for Platform Engineer · worth another look | And brings back people who nearly made it. |
| | Hire for timing | 85 · Good time to reach out · +25 / +30 / +15 | Hire for timing. Know when it's a good moment to reach out. |
| Screen | Evidence screening | Matches 4 of 5 essentials · "Led the settlement migration to Kafka" | Every criterion is checked against the CV, with a quote. |
| | Review mode | 1 of 21 · Shortlist S · Hold H · Reject R | Review one candidate at a time. |
| Engage | Outreach drafts | Your payments-ledger work, and a role built around it · Approve | Personal drafts from real profile facts. You approve every one. |
| | Interest check | Would you like to hear more? → Yes, I'm interested → Confirmed interest | Candidates say yes in one click. |
| | Self-scheduling | Pick a time → You're booked | And pick their own interview slot. |
| Interview | Interview kit | A payments outage you owned · JD: ON-CALL · OPEN GAP | An interview kit, mapped to the JD and each candidate's gaps. |
| | Deep-dives | Why leave a 5,000-person company for a team of 20? → Mixed vs benchmark | Behavioural deep-dives, with follow-ups and a benchmark. |
| | Call check | Candidate matches 4 of 5 · Questions on JD 63% · Never asked: On-call ownership | Buddy checks every interview call against the JD, both ways. |
| | Risky questions | 'Are you planning to start a family?' · Avoid: protected topic | And flags questions that touch protected topics. |
| | Manager profiles | Priya S. · Questions on JD 63% · Often skips: API design | See how each hiring manager really interviews. |
| Decide | Authenticity | Near-identical CV · CV says 8 years / on the call: about 5 · Check with a person | Integrity checks flag what a person should look at. |
| | Manager review | Interested · Not a fit · Question | Hiring managers review the shortlist, with the evidence. |
| | Inbox | 3 · Needs you · Approve · Interviews | And one inbox for everything that needs you. |
| — | Closing | Buddy finds. Buddy checks. People decide. | Buddy finds. Buddy checks. People decide. |
| — | End card | TALYNT LABS · Book a demo → · talyntlabs.com | TALYNT LABS. Book a demo. |

The people (Aarav K., Priya S.), companies and numbers are illustrative.

## Render

```bash
# voiceover (from vo.json) — see ../meet-talyn/README.md for the venv and model files
.venv/bin/python ads/meet-talyn/voiceover.py <model dir> ads/buddy-tour/out/voiceover.wav ads/buddy-tour/vo.json
# music
.venv/bin/python ads/buddy-tour/music.py ads/buddy-tour/out/music.wav
# video
VOICEOVER=ads/buddy-tour/out/voiceover.wav node ads/buddy-tour/render.mjs all ads/buddy-tour/out
```

Output: `talynt-buddy-tour-9x16.mp4` and `talynt-buddy-tour-1x1.mp4` (H.264, 30 fps,
AAC at −16 LUFS; the music ducks under the voice). The voice is synthetic
(Kokoro `af_heart`, open source, run locally).
