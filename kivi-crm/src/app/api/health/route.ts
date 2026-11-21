import { NextResponse } from "next/server";

// Liveness probe for the host. Reveals nothing about configuration or data.
export function GET() {
  return NextResponse.json({ ok: true });
}
