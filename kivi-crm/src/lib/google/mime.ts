// Pure helpers for composing and parsing email headers. No I/O.

/** Removes anything that could start a new header (CRLF injection). */
export function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n\u0000]+/g, " ").trim();
}

function encodeWord(value: string): string {
  // RFC 2047 encoded-word for non-ASCII subjects / names.
  return /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function wrap76(b64: string): string {
  return b64.replace(/.{1,76}/g, (m) => `${m}\r\n`).trimEnd();
}

export interface OutgoingEmail {
  from: string;
  fromName?: string | null;
  to: string[];
  subject: string;
  body: string;
}

const SIMPLE_EMAIL = /^[^@\s<>()",;:\\]+@[^@\s<>()",;:\\]+$/;

/** Builds a base64url RFC 2822 message for the Gmail API `raw` field. */
export function buildRawMessage(msg: OutgoingEmail): string {
  for (const addr of [msg.from, ...msg.to]) {
    if (!SIMPLE_EMAIL.test(addr)) throw new Error("Invalid email address");
  }
  const name = msg.fromName ? sanitizeHeader(msg.fromName).replace(/"/g, "") : "";
  const headers = [
    `From: ${name ? `"${encodeWord(name)}" ` : ""}<${msg.from}>`,
    `To: ${msg.to.join(", ")}`,
    `Subject: ${encodeWord(sanitizeHeader(msg.subject))}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
  ];
  const body = wrap76(Buffer.from(msg.body.replace(/\r?\n/g, "\r\n"), "utf8").toString("base64"));
  return Buffer.from(`${headers.join("\r\n")}\r\n\r\n${body}\r\n`, "utf8").toString("base64url");
}

export interface Address {
  email: string;
  name: string | null;
}

/** Parses "Name <a@b.com>, c@d.com" header values into addresses. */
export function parseAddressList(value: string | null | undefined): Address[] {
  if (!value) return [];
  const out: Address[] = [];
  // Split on commas that are not inside quotes or angle brackets.
  const parts: string[] = [];
  let depth = 0, quoted = false, current = "";
  for (const ch of value) {
    if (ch === '"') quoted = !quoted;
    if (!quoted && ch === "<") depth++;
    if (!quoted && ch === ">") depth = Math.max(0, depth - 1);
    if (ch === "," && !quoted && depth === 0) {
      parts.push(current);
      current = "";
    } else current += ch;
  }
  parts.push(current);
  for (const raw of parts) {
    const part = raw.trim();
    if (!part) continue;
    const m = part.match(/^(.*?)<([^>]+)>\s*$/);
    const email = (m ? m[2] : part).trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) continue;
    const name = m ? m[1].trim().replace(/^"|"$/g, "") || null : null;
    out.push({ email, name });
  }
  return out;
}
