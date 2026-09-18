import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { ClientDashboard } from "@/components/visuals/ClientDashboard";

const ANSWERS = [
  "Where the search actually stands",
  "How many candidates sit at each stage",
  "Who has been shortlisted, and why",
  "What happens next, and when",
];

export function ClientVisibility() {
  return (
    <Section id="visibility" tone="ink" aria-labelledby="visibility-heading">
      <div className="wrap">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <SectionHeader
            index="11"
            eyebrow="Client visibility"
            headingId="visibility-heading"
            title={
              <>
                Your hiring process.
                <br />
                <span className="italic">Visible, not buried in email.</span>
              </>
            }
            lede="You should not have to ask a recruiter for a status update. Four questions should always have an answer:"
          />

          <Reveal delay={0.15}>
            <ul className="flex flex-col gap-3">
              {ANSWERS.map((answer, i) => (
                <li
                  key={answer}
                  className="flex items-baseline gap-4 border-t border-paper-100/10 pt-3"
                >
                  <span className="mono-micro text-signal tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[0.98rem] opacity-70">{answer}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="mt-16">
          <ClientDashboard />
        </Reveal>

        <p className="mono-micro mt-6 opacity-35">
          Illustrative interface representing the current client-visibility
          direction. Company and figures are fictional.
        </p>
      </div>
    </Section>
  );
}
