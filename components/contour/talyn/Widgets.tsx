import type { CSSProperties, ReactNode } from "react";
import { TALYN } from "@/lib/contour/talyn";
import { cx } from "@/lib/utils";

/**
 * The Talyn product, drawn live: each widget is a piece of the interface that
 * assembles itself once it is in view (see Play.tsx and talyn.css). The role,
 * candidates and figures are fictional and every widget says so. Server
 * components: no state, no script — the motion is all CSS.
 */

const v = (o: Record<string, string | number>) => o as CSSProperties;

export function Win({ title, meta, children, className }: { title: string; meta?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cx("tw-win", className)}>
      <div className="tw-bar">
        <span className="tw-lights">
          <i />
          <i />
          <i />
        </span>
        <span className="tw-bar-title">{title}</span>
        <span className="tw-bar-meta">{meta ?? "Illustrative"}</span>
      </div>
      <div className="tw-body">{children}</div>
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="tw-ic tw-ok" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function Flag() {
  return (
    <svg viewBox="0 0 24 24" className="tw-ic tw-warn" aria-hidden="true">
      <path d="M12 4 3 20h18Z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  );
}

/** A number that counts up to its value (CSS @property). */
function Count({ to, d = "0s", suffix }: { to: number; d?: string; suffix?: string }) {
  return (
    <span className="tw-count" style={v({ "--to": to, "--d": d })} data-suffix={suffix ?? ""}>
      <span className="sr-only">
        {to}
        {suffix}
      </span>
    </span>
  );
}

/** Score ring out of 100 with the grade inside. */
export function ScoreRing({ score, grade, d = "0.3s", size = "lg" }: { score: number; grade: string; d?: string; size?: "lg" | "sm" }) {
  return (
    <span className={cx("tw-ring", size === "sm" && "is-sm")} style={v({ "--to": score, "--d": d })}>
      <span className="tw-ring-in">
        <Count to={score} d={d} />
        <small>{grade}</small>
      </span>
    </span>
  );
}

/* --- The Talyn console: a request in plain words, and what comes back ------ */

const RESULTS = [
  { ini: "AK", line: "Backend engineer · 7 yrs · fintech", score: 96, grade: "A+", intent: "High intent", reason: "Built a payments ledger · Kafka at scale" },
  { ini: "RS", line: "Platform engineer · 9 yrs · payments", score: 91, grade: "A", intent: "High intent", reason: "Led on-call for core APIs · mentors four" },
  { ini: "MN", line: "Senior engineer · 6 yrs · lending", score: 84, grade: "A", intent: "Watch", reason: "Event sourcing in production · compliance" },
];

export function TalynConsole() {
  const steps = ["Reading the JD · 9 requirements", "Searching 6 sources by meaning", "412 profiles matched", "Scoring against the JD · reading intent"];
  return (
    <Win title="Talyn" meta="Illustrative">
      <div className="tw-console">
        <div className="tw-prompt tw-in" style={v({ "--d": "0.2s" })}>
          <span className="tw-prompt-label">Ask Talyn</span>
          <p className="tw-type" style={v({ "--d": "0.5s", "--t": "1.8s" })}>
            Find a backend engineer who has scaled payments in a fintech, and is open to a move
          </p>
        </div>
        <ul className="tw-log">
          {steps.map((s, i) => (
            <li key={s} className="tw-in" style={v({ "--d": `${2.5 + i * 0.45}s` })}>
              <Check /> {s}
            </li>
          ))}
        </ul>
        <div className="tw-results">
          {RESULTS.map((r, i) => (
            <div key={r.ini} className="tw-result tw-rise" style={v({ "--d": `${4.5 + i * 0.25}s` })}>
              <span className="tw-avatar">{r.ini}</span>
              <span className="tw-result-text">
                <b>{r.line}</b>
                <span>{r.reason}</span>
              </span>
              <span className={cx("tw-chip", r.intent === "Watch" ? "is-watch" : "is-good")}>{r.intent}</span>
              <ScoreRing score={r.score} grade={r.grade} d={`${4.7 + i * 0.25}s`} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </Win>
  );
}

/* --- Role Insights: the JD, turned into a search plan ------------------------ */

export function RoleInsightsPanel() {
  return (
    <Win title="Role Insights · Senior Backend Engineer">
      <div className="tw-role">
        <div className="tw-role-col">
          <p className="tw-label">Must-have</p>
          <div className="tw-tags">
            {["Payments infrastructure", "Event-driven systems", "Go or Java", "On-call ownership"].map((t, i) => (
              <span key={t} className="tw-chip is-good tw-pop" style={v({ "--d": `${0.3 + i * 0.12}s` })}>
                {t}
              </span>
            ))}
          </div>
          <p className="tw-label">Nice-to-have</p>
          <div className="tw-tags">
            {["Kafka", "Fintech compliance", "Mentoring"].map((t, i) => (
              <span key={t} className="tw-chip tw-pop" style={v({ "--d": `${0.8 + i * 0.12}s` })}>
                {t}
              </span>
            ))}
          </div>
          <p className="tw-label">Boolean string</p>
          <p className="tw-code tw-type" style={v({ "--d": "1.3s", "--t": "1.6s" })}>
            (&quot;backend engineer&quot; OR &quot;platform engineer&quot; OR SDE-3) AND (payments OR ledger OR UPI) AND (kafka OR &quot;event-driven&quot;)
          </p>
          <p className="tw-label">Adjacent titles</p>
          <div className="tw-tags">
            {["Platform Engineer", "SDE III", "Payments Engineer", "Senior Software Engineer"].map((t, i) => (
              <span key={t} className="tw-chip tw-pop" style={v({ "--d": `${2.9 + i * 0.1}s` })}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="tw-role-col">
          <p className="tw-label">Growth path</p>
          <div className="tw-path">
            {["SDE II", "Senior Backend", "Staff / Lead"].map((t, i) => (
              <span key={t} className={cx("tw-path-node tw-pop", i === 1 && "is-now")} style={v({ "--d": `${0.6 + i * 0.25}s` })}>
                {t}
              </span>
            ))}
          </div>
          <p className="tw-label">JD quality check</p>
          <ul className="tw-flags">
            <li className="tw-in" style={v({ "--d": "1.6s" })}>
              <Flag /> “Rockstar” is vague — say what they’ll own
            </li>
            <li className="tw-in" style={v({ "--d": "1.85s" })}>
              <Flag /> 10+ years conflicts with the stated level
            </li>
          </ul>
          <div className="tw-stats">
            <div className="tw-stat tw-in" style={v({ "--d": "2.2s" })}>
              <small>Talent pool · our sources</small>
              <b>
                <Count to={412} d="2.2s" />
              </b>
            </div>
            <div className="tw-stat tw-in" style={v({ "--d": "2.4s" })}>
              <small>Interview kit</small>
              <b>
                <Count to={18} d="2.4s" suffix=" Qs" />
              </b>
            </div>
            <div className="tw-stat is-soon tw-in" style={v({ "--d": "2.6s" })}>
              <small>Salary benchmark</small>
              <b>{TALYN.soon}</b>
            </div>
          </div>
        </div>
      </div>
    </Win>
  );
}

/* --- Candidate Insights: a profile, scored against the JD -------------------- */

const FIT = [
  { req: "Payments infrastructure", pct: 96, ev: "Built the ledger behind 2M daily transactions" },
  { req: "Event-driven systems", pct: 92, ev: "Moved settlement onto Kafka; owns the consumers" },
  { req: "Go or Java", pct: 88, ev: "Five years of Go in production" },
  { req: "On-call ownership", pct: 0, ev: "Not yet proven — question sent by chat", gap: true },
];

export function CandidateScorecard() {
  return (
    <Win title="Candidate Insights · AK">
      <div className="tw-card-head">
        <span className="tw-avatar is-lg">AK</span>
        <div>
          <b>Backend engineer · 7 years</b>
          <span>Fintech · Bengaluru · 3.1 yrs in role · usual 2.2</span>
        </div>
        <ScoreRing score={91} grade="A" d="0.4s" />
      </div>
      <ul className="tw-fit">
        {FIT.map((f, i) => (
          <li key={f.req} className={cx("tw-in", f.gap && "is-gap")} style={v({ "--d": `${0.6 + i * 0.3}s` })}>
            <span className="tw-fit-req">{f.req}</span>
            <span className="tw-meter">
              <i className="tw-grow" style={v({ width: `${f.pct}%`, "--d": `${0.7 + i * 0.3}s` })} />
            </span>
            <span className="tw-fit-ev">
              {f.gap ? <Flag /> : <Check />} {f.ev}
            </span>
          </li>
        ))}
      </ul>
    </Win>
  );
}

/* --- Campaign and outreach --------------------------------------------------- */

export function CampaignPanel() {
  return (
    <Win title="Campaign · Senior Backend Engineer" meta="24 candidates · Illustrative">
      <div className="tw-campaign">
        <div className="tw-mail tw-in" style={v({ "--d": "0.2s" })}>
          <p className="tw-label">Email · step 1 of 4</p>
          <p className="tw-field">
            <span>To</span> Aarav · Backend engineer
          </p>
          <p className="tw-field">
            <span>Subject</span> <b className="tw-type" style={v({ "--d": "0.5s", "--t": "0.9s" })}>A payments role built around your Kafka work</b>
          </p>
          <p className="tw-type tw-mail-body" style={v({ "--d": "1.5s", "--t": "1.6s" })}>
            Hi Aarav — the ledger you built at <mark>your fintech</mark> is exactly the problem this team is solving, on <mark>Kafka</mark>, at <mark>10× the volume</mark>.
          </p>
          <span className="tw-sent tw-pop" style={v({ "--d": "3.2s" })}>
            <Check /> Sent · personalised from profile
          </span>
        </div>
        <ol className="tw-seq">
          {[
            ["Email", "First message, from their profile"],
            ["Email", "Follow-up if no reply in 3 days"],
            ["WhatsApp", "Continues after they opt in"],
            ["Voice", `Call if they go quiet · ${TALYN.soon}`],
          ].map(([ch, t], i) => (
            <li key={t} className={cx("tw-in", ch === "Voice" && "is-soon")} style={v({ "--d": `${3.4 + i * 0.25}s` })}>
              <span className="tw-ch">{ch}</span>
              {t}
            </li>
          ))}
        </ol>
      </div>
    </Win>
  );
}

/* --- Gap-closing chat ---------------------------------------------------------- */

export function GapChat() {
  return (
    <Win title="Gap-closing · chat with AK">
      <div className="tw-chat">
        <p className="tw-bubble is-out tw-pop" style={v({ "--d": "0.3s" })}>
          Your JD match is strong. One thing we couldn’t see: have you owned on-call for a payments service? What broke, and what did you change?
        </p>
        <p className="tw-typing tw-blip" style={v({ "--d": "1.3s" })}>
          <i />
          <i />
          <i />
        </p>
        <p className="tw-bubble is-in tw-pop" style={v({ "--d": "2.2s" })}>
          Yes — I ran the settlement rotation for two years. A duplicate-event bug double-posted refunds; I added idempotency keys and cut pages by 60%.
        </p>
        <p className="tw-evidence tw-pop" style={v({ "--d": "3s" })}>
          <Check /> Gap closed · evidence added · specific, consistent with profile
        </p>
      </div>
    </Win>
  );
}

/* --- Authenticity checks --------------------------------------------------------- */

const AUTH = [
  ["Timeline consistency", "ok"],
  ["Specificity", "ok"],
  ["Cross-channel consistency", "ok"],
  ["Public evidence", "ok"],
  ["Generated-answer detection", "flag"],
  ["Skill claim vs evidence", "ok"],
] as const;

export function AuthenticityPanel() {
  return (
    <Win title="Authenticity · 6 checks">
      <ul className="tw-auth">
        {AUTH.map(([label, s], i) => (
          <li key={label} className={cx("tw-in", s === "flag" && "is-flag")} style={v({ "--d": `${0.3 + i * 0.28}s` })}>
            {s === "flag" ? <Flag /> : <Check />}
            <span>{label}</span>
            <small>{s === "flag" ? "One answer reads as generated — sent to a recruiter" : "Passed"}</small>
          </li>
        ))}
      </ul>
    </Win>
  );
}

/* --- Intent and health ------------------------------------------------------------- */

export function IntentPanel() {
  const on = new Set([0, 1, 3, 4, 6]);
  const signals = TALYN.capabilities.modules.find((m) => m.id === "intent")!;
  return (
    <Win title="Intent and health · AK">
      <div className="tw-intent">
        <ul className="tw-signals">
          {("signals" in signals ? signals.signals : []).map((s, i) => (
            <li key={s} className={cx("tw-in", on.has(i) && "is-on")} style={v({ "--d": `${0.2 + i * 0.15}s` })}>
              <span className="tw-led" />
              {s}
            </li>
          ))}
        </ul>
        <div className="tw-gauges">
          <div className="tw-gauge tw-in" style={v({ "--d": "1.5s" })}>
            <small>Switch intent</small>
            <b className="tw-strong">High</b>
            <span>5 of 8 signals</span>
          </div>
          <div className="tw-gauge tw-in" style={v({ "--d": "1.7s" })}>
            <small>Candidate health</small>
            <b>
              <Count to={82} d="1.7s" />
            </b>
            <span className="tw-band is-good">Healthy</span>
          </div>
          <div className="tw-gauge tw-in" style={v({ "--d": "1.9s" })}>
            <small>Pipeline health</small>
            <b>
              <Count to={68} d="1.9s" />
            </b>
            <span className="tw-band is-watch">Watch · 2 drifting</span>
          </div>
        </div>
      </div>
    </Win>
  );
}

/* --- Engagement timeline -------------------------------------------------------------- */

export function EngagementPanel() {
  const touches = [
    ["Email", "Intro, from their profile", "Day 1"],
    ["WhatsApp", "Role pack after opt-in", "Day 2"],
    ["Email", "Interview reminder", "Day 6"],
    ["WhatsApp", "Feedback within the week", "Day 9"],
    ["Alert", "Drifting · recruiter re-engages", "Day 11"],
  ];
  return (
    <Win title="Engagement · every stage">
      <ol className="tw-touch">
        {touches.map(([ch, t, day], i) => (
          <li key={t} className={cx("tw-in", ch === "Alert" && "is-alert")} style={v({ "--d": `${0.3 + i * 0.3}s` })}>
            <span className="tw-ch">{ch}</span>
            <span>{t}</span>
            <small>{day}</small>
          </li>
        ))}
      </ol>
    </Win>
  );
}

/* --- Interview kit for hiring managers ----------------------------------------------------- */

export function InterviewKit() {
  const qs = [
    ["Payments infrastructure", "Walk me through the ledger you built — what guarantees did it make?"],
    ["Event-driven systems", "How did you handle duplicate events in settlement?"],
    ["On-call ownership", "Gap closed by chat — probe: what would you change in that rotation today?"],
    ["Mentoring", "Who have you grown, and what did they take over from you?"],
  ];
  return (
    <Win title="Interview kit · AK · mapped to the JD">
      <ol className="tw-kit">
        {qs.map(([req, q], i) => (
          <li key={req} className="tw-in" style={v({ "--d": `${0.3 + i * 0.3}s` })}>
            <span className="tw-label">{req}</span>
            <p>{q}</p>
          </li>
        ))}
      </ol>
    </Win>
  );
}

/* --- Semantic search ------------------------------------------------------------------------- */

export function SearchPanel() {
  const sources = ["Professional networks", "Job boards", "Developer communities", "Portfolios & open source", "Referrals", "TALYNT talent pool"];
  return (
    <Win title="Semantic search">
      <div className="tw-search">
        <p className="tw-prompt tw-in" style={v({ "--d": "0.1s" })}>
          <span className="tw-prompt-label">Ask for the person</span>
          <span className="tw-type" style={v({ "--d": "0.3s", "--t": "1.4s" })}>
            Someone who has scaled payments, not just worked on them
          </span>
        </p>
        <div className="tw-sources">
          {sources.map((s, i) => (
            <span key={s} className="tw-chip tw-pop" style={v({ "--d": `${1.8 + i * 0.12}s` })}>
              <span className="tw-led is-on" /> {s}
            </span>
          ))}
        </div>
        <p className="tw-matched tw-in" style={v({ "--d": "2.7s" })}>
          Matched on meaning: <mark>scaled</mark> → led migrations, 10× volume, owned settlement · not just the word “payments”
        </p>
      </div>
    </Win>
  );
}

/* --- Human in the loop: what waits for a person ----------------------------------------------- */

export function HumanPanel() {
  const items = [
    ["Approve", "First message to RS — personalised from profile"],
    ["Review", "Flagged answer from MN — reads as generated"],
    ["Call", "PD went quiet after the first call — recruiter follows up"],
    ["Decide", "Shortlist of 4 ready — scores, evidence and gaps attached"],
  ];
  return (
    <Win title="For a person · today">
      <ol className="tw-queue">
        {items.map(([a, t], i) => (
          <li key={t} className="tw-in" style={v({ "--d": `${0.3 + i * 0.3}s` })}>
            <span className="tw-ch">{a}</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
    </Win>
  );
}

/** Each capability module's widget. */
export const MODULE_WIDGET: Record<string, () => React.JSX.Element> = {
  search: SearchPanel,
  outreach: CampaignPanel,
  gaps: GapChat,
  authenticity: AuthenticityPanel,
  engagement: EngagementPanel,
  intent: IntentPanel,
  managers: InterviewKit,
  humans: HumanPanel,
};
