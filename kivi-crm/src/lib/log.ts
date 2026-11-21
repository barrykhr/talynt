// Structured operational logging that never writes secrets or email content.

type Level = "info" | "warn" | "error";

const SENSITIVE_KEY = /token|secret|password|authorization|cookie|api[_-]?key|refresh|code_verifier|^code$|body|raw|snippet|content/i;
const SENSITIVE_VALUE = /(ya29\.[\w-]+|1\/\/[\w-]{20,}|eyJ[\w-]+\.[\w-]+\.[\w-]+|sb_secret_[\w-]+)/g;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[depth]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.replace(SENSITIVE_VALUE, "[redacted]").slice(0, 500);
  if (typeof value !== "object") return value;
  if (value instanceof Error) return { name: value.name, message: redact(value.message, depth + 1) };
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEY.test(k) ? "[redacted]" : redact(v, depth + 1);
  }
  return out;
}

function write(level: Level, event: string, data?: Record<string, unknown>) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...(redact(data ?? {}) as object) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const log = {
  info: (event: string, data?: Record<string, unknown>) => write("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) => write("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) => write("error", event, data),
};
