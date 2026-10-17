import { NextResponse } from "next/server";
import { ROLES } from "@/lib/candidate/roles";
import { verifySubmission } from "@/lib/assessment/submission";

/**
 * Candidate application intake.
 *
 * Mirrors the enquiry route deliberately, including the part that matters most:
 * there is no silent success path. If no destination is configured, the route
 * says so and the UI hands the person a direct email address rather than
 * telling them an application arrived somewhere it did not.
 *
 * Set CANDIDATE_WEBHOOK_URL (or CONTACT_WEBHOOK_URL as a fallback) to an ATS,
 * inbox relay or automation endpoint.
 *
 * Optional, additive fields from the profile-and-assessment flow:
 * `applicationId` and `profileId` (random ids created on the candidate's device,
 * so a downstream system can de-duplicate one person's repeat sends without
 * matching on names or file names), `profileVersion`, and `assessment` — which
 * is verified against the role's reviewed material before anything is
 * forwarded. Callers that send none of these produce the payload they always did.
 */

const MAX_LENGTH = 6000;

function asString(value: unknown, max = 300): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function asStringList(value: unknown, maxItems: number, max = 80): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item, max))
    .filter(Boolean)
    .slice(0, maxItems);
}

/**
 * The Career Passport, when the person chose to send it with this application.
 *
 * Optional and additive: callers that don't send `profile` produce exactly the
 * payload they always did. Every field is bounded and anything unexpected is
 * dropped, so the shape forwarded downstream is the shape documented here.
 */
function profileFrom(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const p = raw as Record<string, unknown>;
  const experience = Array.isArray(p.experience)
    ? p.experience.slice(0, 12).map((entry) => {
        const e = (entry ?? {}) as Record<string, unknown>;
        return {
          title: asString(e.title, 160),
          organisation: asString(e.organisation, 160),
          from: asString(e.from, 40),
          to: asString(e.to, 40),
          summary: asString(e.summary, 1200),
        };
      })
    : [];
  return {
    functionIds: asStringList(p.functionIds, 12),
    skills: asStringList(p.skills, 40, 60),
    experience: experience.filter((e) => e.title || e.organisation || e.summary),
    directionIds: asStringList(p.directionIds, 12),
    directionNote: asString(p.directionNote, 2000),
    workModelIds: asStringList(p.workModelIds, 8),
    preferredLocationIds: asStringList(p.preferredLocationIds, 30),
    preferredRegions: asStringList(p.preferredRegions, 12),
    stageIds: asStringList(p.stageIds, 8),
    compensationExpectation: asString(p.compensationExpectation, 120),
    valueIds: asStringList(p.valueIds, 12),
    valuesNote: asString(p.valuesNote, 2000),
    ...(Array.isArray(p.education)
      ? {
          education: p.education.slice(0, 8).map((entry) => {
            const e = (entry ?? {}) as Record<string, unknown>;
            return { institution: asString(e.institution, 160), qualification: asString(e.qualification, 160), year: asString(e.year, 20) };
          }),
        }
      : {}),
    ...(Array.isArray(p.certifications) ? { certifications: asStringList(p.certifications, 12, 120) } : {}),
  };
}

/** Ids made on the candidate's device: bounded, and only the characters a random id uses. */
function asId(value: unknown): string {
  const id = asString(value, 80);
  return /^[A-Za-z0-9-]{8,80}$/.test(id) ? id : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const application = {
    roleSlug: asString(body.roleSlug, 120),
    roleTitle: asString(body.roleTitle, 200),
    name: asString(body.name),
    email: asString(body.email),
    headline: asString(body.headline, 400),
    locationId: asString(body.locationId, 80),
    availabilityId: asString(body.availabilityId, 40),
    bandId: asString(body.bandId, 40),
    why: asString(body.why, MAX_LENGTH),
    questions: asString(body.questions, MAX_LENGTH),
    resumeName: asString(body.resumeName, 300),
  };

  const profile = profileFrom(body.profile);

  const identity = {
    applicationId: asId(body.applicationId),
    profileId: asId(body.profileId),
    profileVersion: asString(body.profileVersion, 40),
  };

  if (!application.roleSlug) {
    return NextResponse.json(
      { ok: false, error: "We couldn't tell which role this was for." },
      { status: 422 },
    );
  }

  if (!application.name || !application.email) {
    return NextResponse.json(
      { ok: false, error: "Your name and an email we can reply to are required." },
      { status: 422 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(application.email)) {
    return NextResponse.json(
      { ok: false, error: "That email address doesn't look right." },
      { status: 422 },
    );
  }

  // Consent is explicit on the final step. Without it there is nothing to do.
  if (body.consentGiven !== true) {
    return NextResponse.json(
      { ok: false, error: "We need your confirmation before sending anything." },
      { status: 422 },
    );
  }

  // An assessment is checked against the role it claims to be for before
  // anything is forwarded: its questions must be this role's, every answer
  // present and within bounds, and an out-of-date version is labelled as such.
  let assessment = null;
  if (body.assessment !== undefined) {
    const role = ROLES.find((r) => r.slug === application.roleSlug);
    if (!role) {
      return NextResponse.json({ ok: false, error: "We couldn't find that role." }, { status: 422 });
    }
    const verified = verifySubmission(body.assessment, role);
    if (!verified.ok) {
      return NextResponse.json({ ok: false, error: verified.error }, { status: 422 });
    }
    assessment = verified.value;
  }

  const destination =
    process.env.CANDIDATE_WEBHOOK_URL || process.env.CONTACT_WEBHOOK_URL;

  if (!destination) {
    return NextResponse.json(
      {
        ok: false,
        fallback: true,
        error: "Application delivery is not configured for this deployment.",
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(destination, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...application,
        ...(identity.applicationId ? { applicationId: identity.applicationId } : {}),
        ...(identity.profileId ? { profileId: identity.profileId } : {}),
        ...(identity.profileVersion ? { profileVersion: identity.profileVersion } : {}),
        ...(profile ? { profile } : {}),
        ...(assessment ? { assessment } : {}),
        kind: "candidate-application",
        source: "talyntlabs.com/candidates",
        receivedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) throw new Error(`Upstream responded ${response.status}`);
  } catch {
    return NextResponse.json(
      { ok: false, fallback: true, error: "We couldn't deliver that just now." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
