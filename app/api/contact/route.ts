import { NextResponse } from "next/server";

/**
 * Enquiry intake.
 *
 * Deliberately has no silent success path: if no destination is configured
 * the route says so, and the form falls back to a direct email address rather
 * than telling a visitor we received something we did not.
 *
 * Set CONTACT_WEBHOOK_URL to a CRM, inbox relay or automation endpoint.
 */

type Payload = {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  hiringFor?: unknown;
  message?: unknown;
};

const MAX_LENGTH = 4000;

function asString(value: unknown, max = 300): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let body: Payload;

  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Malformed request." },
      { status: 400 },
    );
  }

  const enquiry = {
    name: asString(body.name),
    email: asString(body.email),
    company: asString(body.company),
    hiringFor: asString(body.hiringFor),
    message: asString(body.message, MAX_LENGTH),
  };

  if (!enquiry.name || !enquiry.email) {
    return NextResponse.json(
      { ok: false, error: "Name and work email are required." },
      { status: 422 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(enquiry.email)) {
    return NextResponse.json(
      { ok: false, error: "That email address doesn't look right." },
      { status: 422 },
    );
  }

  const destination = process.env.CONTACT_WEBHOOK_URL;

  if (!destination) {
    return NextResponse.json(
      {
        ok: false,
        fallback: true,
        error: "Enquiry delivery is not configured for this deployment.",
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(destination, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...enquiry,
        source: "talyntlabs.com",
        receivedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) throw new Error(`Upstream responded ${response.status}`);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        fallback: true,
        error: "We couldn't deliver that just now.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
