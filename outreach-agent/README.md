# Outreach Agent (WhatsApp + Claude)

Pick a message from a WhatsApp chat (usually a job post), type the company name,
and the agent finds the role, researches the company on the web, and drafts a short
personal WhatsApp message about how you can help. You edit it, enter a number, and send.

Nothing is sent without you clicking **Send** and confirming.

## Setup (about 10 minutes)

You need Node.js 18+ and Google Chrome on your laptop, and an Anthropic API key
(console.anthropic.com → API Keys).

```bash
cd outreach-agent
npm install
cp .env.example .env      # then fill in ANTHROPIC_API_KEY and your SENDER_* pitch
npm start
```

Open http://localhost:3030, then on your phone go to WhatsApp → Settings → Linked devices
→ Link a device and scan the QR code. The login is saved in `.wwebjs_auth/`, so you only
scan once.

If Chrome isn't found, set `CHROME_PATH` in `.env` to your Chrome binary, for example
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` on a Mac.

## Using it

1. **Chats**: click a chat (group or direct) on the left.
2. **Pick the message**: click the job post. It fills "Selected message" (you can also paste).
3. Type the **company name** and any notes, then click **Research & draft**.
4. **Review**: check the role, the research summary and sources, and edit the draft.
5. Enter the number with country code (e.g. `919876543210`) and click **Send on WhatsApp**.

Every send is logged to `sent-log.jsonl`.

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
