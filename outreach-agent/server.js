// Local outreach agent: WhatsApp (via WhatsApp Web) + Claude research/drafting + a small web UI.
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import QRCode from "qrcode";
import qrcodeTerminal from "qrcode-terminal";
import pkg from "whatsapp-web.js";
import { generateOutreach, LEVELS } from "./generate.js";

const { Client, LocalAuth } = pkg;
const here = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(here, "sent-log.jsonl");
const PORT = Number(process.env.PORT || 3030);

// ---------- WhatsApp ----------
// Off by default: you paste messages and send from your own WhatsApp.
// Set CONNECT_WHATSAPP=yes in .env to link WhatsApp (QR scan) for chat browsing and direct sending.
const CONNECT_WA = /^(yes|true|1)$/i.test(process.env.CONNECT_WHATSAPP || "");
let waState = CONNECT_WA ? "starting" : "off"; // off | starting | qr | ready | disconnected
let qrDataUrl = null;
let wa = null;

if (CONNECT_WA) {
wa = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(here, ".wwebjs_auth") }),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  },
});

wa.on("qr", async (qr) => {
  waState = "qr";
  qrDataUrl = await QRCode.toDataURL(qr);
  console.log("\nScan this QR with WhatsApp > Settings > Linked devices > Link a device:\n");
  qrcodeTerminal.generate(qr, { small: true });
});
wa.on("ready", () => {
  waState = "ready";
  qrDataUrl = null;
  console.log("WhatsApp connected.");
});
wa.on("auth_failure", (m) => {
  waState = "disconnected";
  console.error("WhatsApp auth failure:", m);
});
wa.on("disconnected", (reason) => {
  waState = "disconnected";
  console.error("WhatsApp disconnected:", reason);
});
wa.initialize();
}

function requireReady(res) {
  if (waState !== "ready") {
    res.status(409).json({
      error: CONNECT_WA
        ? "WhatsApp is not connected yet. Scan the QR code first."
        : "WhatsApp isn't linked. Use 'Open in WhatsApp' instead.",
    });
    return false;
  }
  return true;
}

// ---------- HTTP ----------
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(here, "public")));

app.get("/api/status", (_req, res) => res.json({ state: waState, qr: qrDataUrl }));

app.get("/api/chats", async (_req, res) => {
  if (!requireReady(res)) return;
  try {
    const chats = await wa.getChats();
    res.json(
      chats.slice(0, 60).map((c) => ({
        id: c.id._serialized,
        name: c.name || c.id.user,
        isGroup: c.isGroup,
        preview: c.lastMessage?.body?.slice(0, 80) || "",
      })),
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/chats/:id/messages", async (req, res) => {
  if (!requireReady(res)) return;
  try {
    const chat = await wa.getChatById(req.params.id);
    const msgs = await chat.fetchMessages({ limit: Number(req.query.limit || 50) });
    res.json(
      msgs
        .filter((m) => m.body && m.body.trim())
        .reverse()
        .map((m) => ({
          id: m.id._serialized,
          body: m.body,
          fromMe: m.fromMe,
          author: m.author || m.from,
          timestamp: m.timestamp,
        })),
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/generate", async (req, res) => {
  const b = req.body || {};
  const level = LEVELS.includes(b.level) ? b.level : "company";
  const has = (v) => typeof v === "string" && v.trim() !== "";
  if (!has(b.role) && !has(b.sourceMessage)) {
    return res.status(400).json({ error: "Enter the role, or paste the job post so the role can be picked up from it." });
  }
  if (level !== "market" && !has(b.companyName) && !has(b.linkedinUrl)) {
    return res.status(400).json({ error: "Enter a company name or paste its LinkedIn company page link." });
  }
  if (level === "person" && !has(b.personName)) {
    return res.status(400).json({ error: "Person level: enter the recipient's name." });
  }
  if (has(b.linkedinUrl) && !/^https?:\/\/([a-z]+\.)?linkedin\.com\//i.test(b.linkedinUrl.trim())) {
    return res.status(400).json({ error: "That doesn't look like a LinkedIn link (https://www.linkedin.com/company/...)." });
  }
  try {
    res.json(await generateOutreach({ ...b, level, linkedinUrl: b.linkedinUrl?.trim() }));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/log", (req, res) => {
  const { phone, message, companyName, linkedinUrl, role, level } = req.body || {};
  fs.appendFileSync(
    LOG_FILE,
    JSON.stringify({ at: new Date().toISOString(), via: "opened-in-whatsapp", level, phone, companyName, linkedinUrl, role, message }) + "\n",
  );
  res.json({ ok: true });
});

app.post("/api/send", async (req, res) => {
  if (!requireReady(res)) return;
  const { phone, message, companyName, linkedinUrl, role } = req.body || {};
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 8) {
    return res.status(400).json({ error: "Enter the number with country code, e.g. 919876543210." });
  }
  if (!message?.trim()) return res.status(400).json({ error: "Message is empty." });
  try {
    const numberId = await wa.getNumberId(digits);
    if (!numberId) return res.status(404).json({ error: `${digits} is not on WhatsApp.` });
    const sent = await wa.sendMessage(numberId._serialized, message);
    fs.appendFileSync(
      LOG_FILE,
      JSON.stringify({ at: new Date().toISOString(), phone: digits, companyName, linkedinUrl, role, message }) + "\n",
    );
    res.json({ ok: true, id: sent.id._serialized });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Only this computer can open the page; others on your Wi-Fi cannot.
const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(`Outreach agent UI: http://localhost:${PORT}`);
  console.log(`WhatsApp: ${CONNECT_WA ? "linking (scan the QR)" : "not linked - paste messages, send with 'Open in WhatsApp'"}`);
  console.log(`Drafting with: ${process.env.OPENAI_API_KEY ? "OpenAI (" + (process.env.OPENAI_MODEL || "gpt-5") + ")" : process.env.ANTHROPIC_API_KEY ? "Claude" : "NO API KEY SET - add one to .env"}`);
})
server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.error(`\nThe tool is already running (port ${PORT} is in use).`);
    console.error(`Just open http://localhost:${PORT} in your browser,`);
    console.error(`or stop the old copy with:  lsof -ti tcp:${PORT} | xargs kill   and run npm start again.\n`);
    process.exit(1);
  }
  throw e;
});

