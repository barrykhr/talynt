import type { CSSProperties, ReactNode } from "react";
import { TALYN } from "@/lib/contour/talyn";
import { cx } from "@/lib/utils";

/**
 * The Buddy product, drawn live: each widget is a piece of the interface that
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

/* --- The Buddy console: a request in plain words, and what comes back ------ */

const RESULTS = [
  { ini: "AK", line: "Backend engineer · 7 yrs · fintech", score: 96, grade: "A+", timing: "Good time · 85", reason: "Matches 5 of 5 essentials · “Led the settlement migration to Kafka”" },
  { ini: "RS", line: "Platform engineer · 9 yrs · payments", score: 91, grade: "A", timing: "Good time · 78", reason: "Matches 4 of 5 essentials · “Owned on-call for core APIs”" },
  { ini: "MN", line: "Senior engineer · 6 yrs · lending", score: 84, grade: "A", timing: "Later · 41", reason: "Matches 4 of 5 essentials · reached interview for Platform Engineer" },
];

export function TalynConsole() {
  const steps = ["Reading the JD · 5 must-haves", "Understood: Backend Engineer · Kafka · Bangalore", "Searching your talent pool + 25 similar companies", "Checking every criterion against the CV"];
  return (
    <Win title="Buddy" meta="Illustrative">
      <div className="tw-console">
        <div className="tw-prompt tw-in" style={v({ "--d": "0.2s" })}>
          <span className="tw-prompt-label">Ask Buddy</span>
          <p className="tw-type" style={v({ "--d": "0.5s", "--t": "1.8s" })}>
            A backend engineer who has scaled payments at a startup, in Bangalore
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
              <span className={cx("tw-chip", r.timing.startsWith("Later") ? "is-watch" : "is-good")}>{r.timing}</span>
              <ScoreRing score={r.score} grade={r.grade} d={`${4.7 + i * 0.25}s`} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </Win>
  );
}

/* --- Role insights: the JD, turned into a search ------------------------------ */

export function RoleInsightsPanel() {
  return (
    <Win title="Role insights · Senior Backend Engineer">
      <div className="tw-role">
        <div className="tw-role-col">
          <p className="tw-label">Skills and criteria</p>
          <div className="tw-tags">
            {["Payments infrastructure", "Event-driven systems", "On-call ownership"].map((t, i) => (
              <span key={t} className="tw-chip is-good tw-pop" style={v({ "--d": `${0.3 + i * 0.12}s` })}>
                {t} · Must-have ✓
              </span>
            ))}
          </div>
          <div className="tw-tags">
            {["Go or Java", "Mentoring"].map((t, i) => (
              <span key={t} className="tw-chip tw-pop" style={v({ "--d": `${0.8 + i * 0.12}s` })}>
                {t}
              </span>
            ))}
          </div>
          <p className="tw-label">Search query</p>
          <p className="tw-code tw-type" style={v({ "--d": "1.3s", "--t": "1.6s" })}>
            (&quot;backend engineer&quot; OR &quot;platform engineer&quot;) AND (payments OR ledger OR settlement) AND (kafka OR &quot;event-driven&quot;)
          </p>
        </div>
        <div className="tw-role-col">
          <p className="tw-label">Wording check</p>
          <ul className="tw-flags">
            <li className="tw-in" style={v({ "--d": "1.6s" })}>
              <Flag /> “Rockstar” is vague — say what they’ll own
            </li>
            <li className="tw-in" style={v({ "--d": "1.85s" })}>
              <Flag /> “Young, energetic team” may exclude people
            </li>
          </ul>
          <p className="tw-label">Calibration · hiring manager</p>
          <ul className="tw-flags">
            <li className="tw-in" style={v({ "--d": "2.1s" })}>
              <Check /> Add: Owned a Kafka migration
            </li>
          </ul>
          <div className="tw-stats">
            <div className="tw-stat tw-in" style={v({ "--d": "2.4s" })}>
              <small>Must-haves</small>
              <b>
                <Count to={3} d="2.4s" />
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

/* --- Evidence-based screening: every criterion, against the CV ------------------- */

const FIT = [
  { req: "Payments infrastructure", pct: 96, ev: "“Built the ledger behind 2M daily transactions”" },
  { req: "Event-driven systems", pct: 92, ev: "“Led the settlement migration to Kafka”" },
  { req: "Go or Java", pct: 88, ev: "“Five years of Go in production”" },
  { req: "Mentoring", pct: 80, ev: "“Mentored four engineers to senior”" },
  { req: "On-call ownership", pct: 0, ev: "Not found in the CV — an open gap for the interview", gap: true },
];

export function CandidateScorecard() {
  return (
    <Win title="Screening · AK · 1 of 21">
      <div className="tw-card-head">
        <span className="tw-avatar is-lg">AK</span>
        <div>
          <b>Backend engineer · 7 years</b>
          <span>Matches 4 of 5 essentials · Meets all must-haves</span>
        </div>
        <ScoreRing score={91} grade="A" d="0.4s" />
      </div>
      <ul className="tw-fit">
        {FIT.map((f, i) => (
          <li key={f.req} className={cx("tw-in", f.gap && "is-gap")} style={v({ "--d": `${0.6 + i * 0.25}s` })}>
            <span className="tw-fit-req">{f.req}</span>
            <span className="tw-meter">
              <i className="tw-grow" style={v({ width: `${f.pct}%`, "--d": `${0.7 + i * 0.25}s` })} />
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

/* --- Semantic search and sourcing ------------------------------------------------------ */

export function SearchPanel() {
  const understood = ["Role: Backend Engineer", "Skill: Kafka", "Location: Bangalore"];
  const found = ["25 similar companies · Same domain · Similar headcount", "Found since yesterday · 14 new people to review", "Reached interview for Platform Engineer · worth another look"];
  return (
    <Win title="Semantic search">
      <div className="tw-search">
        <p className="tw-prompt tw-in" style={v({ "--d": "0.1s" })}>
          <span className="tw-prompt-label">Search your talent pool</span>
          <span className="tw-type" style={v({ "--d": "0.3s", "--t": "1.1s" })}>
            Scaled payments at a startup
          </span>
        </p>
        <p className="tw-label tw-in" style={v({ "--d": "1.5s" })}>
          Buddy understood · edit any chip
        </p>
        <div className="tw-sources">
          {understood.map((s, i) => (
            <span key={s} className="tw-chip is-good tw-pop" style={v({ "--d": `${1.6 + i * 0.15}s` })}>
              {s}
            </span>
          ))}
        </div>
        <ul className="tw-log">
          {found.map((s, i) => (
            <li key={s} className="tw-in" style={v({ "--d": `${2.3 + i * 0.3}s` })}>
              <span className="tw-led is-on" /> {s}
            </li>
          ))}
        </ul>
      </div>
    </Win>
  );
}

/* --- Hire for timing ------------------------------------------------------------------------ */

export function TimingPanel() {
  const reasons = [
    ["+25", "Same title for 4½ years", "CV"],
    ["+30", "Layoffs at his company", "News ↗"],
    ["+15", "Updated his profile", "Profile"],
  ];
  return (
    <Win title="Timing score · AK">
      <div className="tw-intent">
        <ul className="tw-signals">
          {reasons.map(([pts, t, src], i) => (
            <li key={t} className="tw-in is-on" style={v({ "--d": `${0.3 + i * 0.25}s` })}>
              <span className="tw-led" />
              <b>{pts}</b> {t} · {src}
            </li>
          ))}
        </ul>
        <div className="tw-gauges">
          <div className="tw-gauge tw-in" style={v({ "--d": "1.3s" })}>
            <small>Timing score</small>
            <b>
              <Count to={85} d="1.3s" />
            </b>
            <span className="tw-band is-good">Good time to reach out</span>
          </div>
        </div>
      </div>
    </Win>
  );
}

/* --- Calibration with the hiring manager, and hiring memory --------------------------------- */

export function CalibrationPanel() {
  const rows = [
    ["RS · Platform engineer, 9 yrs", "Would meet ✓", "Owned the Kafka migration end to end"],
    ["PD · Staff engineer, 11 yrs", "Wouldn’t meet ✕", "Never ran production on-call"],
    ["MN · Senior engineer, 6 yrs", "Not sure", "Strong on lending, light on payments"],
  ];
  return (
    <Win title="Calibration · hiring manager">
      <ol className="tw-queue">
        {rows.map(([who, verdict, why], i) => (
          <li key={who} className="tw-in" style={v({ "--d": `${0.3 + i * 0.3}s` })}>
            <span className="tw-ch">{verdict}</span>
            <span>
              {who} — “{why}”
            </span>
          </li>
        ))}
      </ol>
      <p className="tw-evidence tw-pop" style={v({ "--d": "1.4s" })}>
        <Check /> Buddy suggests · Add: Owned a Kafka migration
      </p>
      <p className="tw-evidence tw-pop" style={v({ "--d": "1.8s" })}>
        <Check /> Hiring memory · Would meet: owned the Kafka migration end to end
      </p>
    </Win>
  );
}

/* --- Review mode ------------------------------------------------------------------------------ */

export function ScreeningPanel() {
  const crit = [
    ["Payments infrastructure", "“Built the ledger behind 2M daily transactions”"],
    ["Event-driven systems", "“Led the settlement migration to Kafka”"],
    ["Go or Java", "“Five years of Go in production”"],
    ["Mentoring", "“Mentored four engineers to senior”"],
  ];
  return (
    <Win title="Review mode · 1 of 21" meta="Matches 4 of 5 essentials">
      <ul className="tw-auth">
        {crit.map(([c, q], i) => (
          <li key={c} className="tw-in" style={v({ "--d": `${0.3 + i * 0.22}s` })}>
            <Check />
            <span>{c}</span>
            <small>{q}</small>
          </li>
        ))}
        <li className="tw-in is-flag" style={v({ "--d": "1.2s" })}>
          <Flag />
          <span>On-call ownership</span>
          <small>Not found in the CV</small>
        </li>
      </ul>
      <div className="tw-sources">
        {[["Shortlist", "S", "is-good"], ["Hold", "H", ""], ["Reject", "R", "is-watch"]].map(([w, k, c], i) => (
          <span key={w} className={cx("tw-chip tw-pop", c)} style={v({ "--d": `${1.6 + i * 0.15}s` })}>
            {w} · {k}
          </span>
        ))}
      </div>
    </Win>
  );
}

/* --- Outreach drafts, interest check, self-scheduling ------------------------------------------ */

export function CampaignPanel() {
  return (
    <Win title="Outreach · Senior Backend Engineer" meta="Drafts · Illustrative">
      <div className="tw-campaign">
        <div className="tw-mail tw-in" style={v({ "--d": "0.2s" })}>
          <p className="tw-label">Draft · from real profile facts</p>
          <p className="tw-field">
            <span>To</span> Aarav · Backend engineer
          </p>
          <p className="tw-field">
            <span>Subject</span> <b className="tw-type" style={v({ "--d": "0.5s", "--t": "0.9s" })}>Your payments-ledger work, and a role built around it</b>
          </p>
          <p className="tw-type tw-mail-body" style={v({ "--d": "1.5s", "--t": "1.6s" })}>
            Hi Aarav — you <mark>led the settlement migration to Kafka</mark>; this team is solving the same problem at a <mark>startup</mark> in <mark>Bangalore</mark>.
          </p>
          <span className="tw-sent tw-pop" style={v({ "--d": "3.2s" })}>
            <Check /> Approved · sent
          </span>
        </div>
        <ol className="tw-seq">
          {[
            ["Interest", "“Would you like to hear more?” → “Yes, I’m interested” → Confirmed interest"],
            ["Schedule", "“Pick a time” → “You’re booked”"],
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

/* --- Interview kit and behavioural deep-dives ------------------------------------------------ */

export function InterviewKit() {
  const qs = [
    ["JD: On-call", "A payments outage you owned — what did you change after?"],
    ["JD: Payments", "How would you keep a ledger consistent across services?"],
    ["Open gap", "When did event-driven design cost you more than it saved?"],
    ["Deep-dive · L1 → L3", "Why leave a 5,000-person company for a team of 20? · Benchmark: mixed"],
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

/* --- Call check: the interview, against the JD, both ways ------------------------------------- */

export function CallCheckPanel() {
  return (
    <Win title="Call check · AK with Priya S.">
      <div className="tw-intent">
        <div className="tw-gauges">
          <div className="tw-gauge tw-in" style={v({ "--d": "0.3s" })}>
            <small>Candidate</small>
            <b className="tw-strong">4 of 5</b>
            <span>matches the JD</span>
          </div>
          <div className="tw-gauge tw-in" style={v({ "--d": "0.5s" })}>
            <small>Questions on JD</small>
            <b>
              <Count to={63} d="0.5s" suffix="%" />
            </b>
            <span className="tw-band is-watch">Often skips: API design</span>
          </div>
        </div>
        <ol className="tw-touch">
          <li className="tw-in is-alert" style={v({ "--d": "1s" })}>
            <span className="tw-ch">Never asked</span>
            <span>On-call ownership</span>
          </li>
          <li className="tw-in is-alert" style={v({ "--d": "1.3s" })}>
            <span className="tw-ch">Avoid</span>
            <span>“Are you planning to start a family?” · protected topic</span>
          </li>
        </ol>
      </div>
    </Win>
  );
}

/* --- Authenticity and integrity checks ------------------------------------------------------------ */

const AUTH = [
  ["Timeline", "ok", "Dates and titles line up"],
  ["Specificity", "ok", "Names systems, numbers and decisions"],
  ["Copied or AI-generated text", "ok", "Passed"],
  ["Near-identical CV", "flag", "Check with a person"],
  ["CV versus call", "flag", "CV says 8 years / on the call: about 5"],
] as const;

export function AuthenticityPanel() {
  return (
    <Win title="Integrity checks · MN" meta="Check with a person">
      <ul className="tw-auth">
        {AUTH.map(([label, s, note], i) => (
          <li key={label} className={cx("tw-in", s === "flag" && "is-flag")} style={v({ "--d": `${0.3 + i * 0.28}s` })}>
            {s === "flag" ? <Flag /> : <Check />}
            <span>{label}</span>
            <small>{note}</small>
          </li>
        ))}
      </ul>
    </Win>
  );
}

/* --- Hiring manager review and the inbox -------------------------------------------------------- */

export function HumanPanel() {
  const items = [
    ["Interested", "AK — matches 4 of 5 essentials, timing 85"],
    ["Question", "RS — “How deep was the on-call rotation?”"],
    ["Not a fit", "PD — reason: never ran production on-call"],
  ];
  return (
    <Win title="Hiring manager review" meta="Inbox · 3 need you">
      <ol className="tw-queue">
        {items.map(([a, t], i) => (
          <li key={t} className="tw-in" style={v({ "--d": `${0.3 + i * 0.3}s` })}>
            <span className="tw-ch">{a}</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
      <div className="tw-sources">
        {["Needs you · Approve", "Interviews", "Done", "Snooze"].map((c, i) => (
          <span key={c} className={cx("tw-chip tw-pop", i === 0 && "is-good")} style={v({ "--d": `${1.4 + i * 0.12}s` })}>
            {c}
          </span>
        ))}
      </div>
    </Win>
  );
}

/** Each capability module's widget. */
export const MODULE_WIDGET: Record<string, () => React.JSX.Element> = {
  search: SearchPanel,
  timing: TimingPanel,
  calibration: CalibrationPanel,
  screening: ScreeningPanel,
  outreach: CampaignPanel,
  managers: InterviewKit,
  calls: CallCheckPanel,
  authenticity: AuthenticityPanel,
  humans: HumanPanel,
};
