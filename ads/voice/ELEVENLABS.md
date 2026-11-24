# Voice AI for TALYNT LABS — ElevenLabs

Three uses, each switched on separately.

| | What | Status |
|---|---|---|
| **(a)** | Talyn calls candidates who go quiet after a recruiter's call | Product feature — shown on the site as **Coming soon** |
| **(b)** | A voice assistant on the website (“Talk to us”) | Ready in code — needs an ElevenLabs agent id |
| **(c)** | Voiceover for the ads | "Meet Talyn" has a locally generated voiceover; a studio recording can replace it |

No API key is ever put into the website. (b) uses the agent's **public id**;
the key stays in your ElevenLabs account.

---

## (b) The website voice assistant

1. In ElevenLabs, open **Conversational AI → Agents → New agent** (blank).
2. **Voice:** open the Voice Library and filter for *English · Indian accent ·
   Female*; pick a calm, warm, professional voice. Use the same voice for (c).
3. **First message:**
   > Hi, I'm the TALYNT LABS assistant. Tell me about the role you're hiring for, or ask me how Talyn works.
4. **System prompt:** paste the prompt below.
5. **Knowledge base:** upload `talyn-knowledge.md` (in this folder).
6. **Security → Allowlist:** add the domains the site will run on.
7. Copy the **agent id**, then build the site with it:

```bash
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=<agent id> \
NEXT_PUBLIC_CT_VARIANT=mono NEXT_PUBLIC_CT_EDITION=product npm run build
# or for the static copy:
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=<agent id> node scripts/export-static-site.mjs . /tmp/w /tmp/site product
```

The floating voice button appears on every page (`components/contour/talyn/VoiceAgent.tsx`).
With no id set, nothing renders.

### System prompt

```
You are the voice assistant for TALYNT LABS, an AI-native hiring agency in India.
TALYNT's AI hiring agent is called Talyn. Speak in warm, concise, professional
Indian English. Keep answers under three sentences unless asked for more.

What you can do:
- Explain how Talyn works and what TALYNT offers, using only the knowledge base.
- Take a short role brief: the role, seniority, location, must-haves, timeline.
- Offer to book a demo; collect name, work email and company, and say the team will call them.

Rules:
- Never invent numbers, clients, results or features. If something isn't in the
  knowledge base, say you'll have the team follow up.
- Voice calls to candidates and salary benchmarks are coming soon — say so if asked.
- Pricing: a percentage of CTC, charged only when they hire. Don't quote a figure.
- Never ask for or discuss a candidate's personal characteristics.
```

---

## (c) Voiceover for the ad

Generate it in **ElevenLabs → Text to Speech** with the same voice (Stability ~50,
Similarity ~75, Style ~20), download the MP3, then render the ad with it mixed in —
the music and effects duck under the voice automatically:

```bash
VOICEOVER=/path/to/voiceover.mp3 node ads/one-click/render.mjs all ads/one-click/out
```

### Voiceover script — "One click" (20 s, ~48 words)

| Time | Line |
|---|---|
| 0.3 s | One click. Your next hire — found. |
| 2.8 s | Talyn searches every source at once… |
| 5.6 s | …and brings you only the few who fit. |
| 8.2 s | Outreach goes out instantly. |
| 10.8 s | Every candidate, kept close. |
| 13.0 s | Every follow-up, automated. |
| 15.2 s | AI finds signals. People understand them. |
| 17.8 s | TALYNT LABS. Talent intelligence, built for hiring. |

Record it as one take with short pauses between lines; if it runs long, trim pauses
rather than speeding the voice up.

### Voiceover script — "Meet Talyn" (36 s)

The lines and their start times are in `ads/meet-talyn/vo.json`. A locally
generated voiceover (open-source Kokoro, Indian English female voice) is the
default; see `ads/meet-talyn/README.md`. To use an ElevenLabs voice instead,
record each line, place it at its start time, and render with
`VOICEOVER=<file> node ads/meet-talyn/render.mjs all ads/meet-talyn/out`.
