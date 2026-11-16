# Outreach Agent (WhatsApp + Claude)

Pick a message from a WhatsApp chat (usually a job post), type the company name,
and the agent finds the role, researches the company on the web, and drafts a short
personal WhatsApp message about how you can help. You edit it, enter a number, and send.

Nothing is sent without you clicking **Send** and confirming.

## Setup (about 10 minutes)

You need Node.js 18+ and an API key from either OpenAI (platform.openai.com → API keys)
or Anthropic (console.anthropic.com → API Keys). Put one of them in `.env`; if both are
set, OpenAI is used.

```bash
cd outreach-agent
npm install
cp .env.example .env      # then add your API key and your SENDER_* pitch
npm start
```

Open http://localhost:3030.

By default WhatsApp is **not linked** (safest). You paste the job post yourself, and the
**Open in WhatsApp** button opens a chat with the number and your message typed in; you
press send in WhatsApp. To let the tool read your chats and send directly instead, set
`CONNECT_WHATSAPP=yes` in `.env`, restart, and scan the QR code (WhatsApp → Settings →
Linked devices → Link a device).

## Using it

1. Paste the job post from WhatsApp into the first box.
2. Enter the **role** to pitch for (or leave it empty to pick it up from the post), and a
   location if relevant.
3. Choose a **personalisation level**:
   - **Market**: how hard this role is to hire right now (postings, pay, scarce skills,
     competing employers). Company is optional. Good when you know little about the company.
   - **Company**: their current team and hiring (growth, open roles, funding, long-open
     roles), and one question about their talent challenge for this role. The default.
   - **Person**: written to the hiring manager by name, using what you paste from their
     LinkedIn plus public info. Best for key accounts.
4. Enter the **company name** and/or its **LinkedIn company page link**. LinkedIn often
   blocks automated reading, so paste the page's About section into Notes for best results.
5. Click **Research & draft**, then check the role, research and sources, and edit the draft.
6. Enter the number with country code (e.g. `919876543210`) and click **Open in WhatsApp**,
   then press send in WhatsApp. Or click **Copy message**.

Every message you open or send is logged to `sent-log.jsonl`.

## Files

- `server.js`: WhatsApp connection (whatsapp-web.js) and the local API
- `generate.js`: the Claude call (web search, then a JSON draft); edit the prompt here
- `public/index.html`: the UI

## Keep your number safe

This links your account the same way WhatsApp Web does. It is not the official Business
API, and WhatsApp bans numbers that send unsolicited messages in bulk. Send one message
at a time, personalise it, space messages out, stop when someone asks you to, and expect
that heavy use can get the number restricted. For volume, move to the WhatsApp Business
Cloud API with approved templates.
