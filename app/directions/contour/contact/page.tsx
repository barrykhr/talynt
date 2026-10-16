import type { Metadata } from "next";
import Link from "next/link";
import { ENQUIRY } from "@/lib/contour/content";
import { EMAIL, LINKEDIN, ROUTES, whatsappHref } from "@/lib/contour/site";
import { ContactForm } from "@/components/contour/ContactForm";
import { Eyebrow, Headline } from "@/components/contour/ui";
import { LinkedInIcon, WhatsAppIcon } from "@/components/contour/chrome/Icons";
import { Meeting } from "@/components/contour/graphics/Meeting";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a hiring conversation with TALYNT LABS, or find the right route in as a candidate.",
};

/**
 * One page, three doors: employers get the enquiry form on the existing route;
 * candidates get the routes that actually do something for them; anyone with a
 * question about their data gets the privacy address. WhatsApp and LinkedIn
 * appear only when a verified destination is configured.
 */
export default function ContactPage() {
  const whatsapp = whatsappHref();

  return (
    <>
      <section aria-labelledby="contact-heading" className="pt-12 pb-10 md:pt-20">
        <div className="ct-wrap grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow tone="ink">Contact</Eyebrow>
            <Headline as="h1" id="contact-heading" lead={ENQUIRY.title} turn={ENQUIRY.titleItalic} size="xl" className="mt-7" />
          </div>
          <div className="flex items-end lg:col-span-4 lg:col-start-9">
            <Meeting className="w-full max-w-sm" decorative />
          </div>
        </div>
      </section>

      <section id="enquiry" aria-labelledby="enquiry-heading" className="scroll-mt-[var(--ct-nav-h)] pb-[var(--ct-section)]">
        <div className="ct-wrap grid gap-6 lg:grid-cols-12">
          {/* Employers */}
          <div className="ct-panel p-6 sm:p-10 lg:col-span-7">
            <Eyebrow tone="green">For employers · {ENQUIRY.eyebrow}</Eyebrow>
            <h2 id="enquiry-heading" className="ct-display ct-m mt-5">
              {ENQUIRY.lede}
            </h2>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            {/* Candidates */}
            <div className="ct-panel p-6 sm:p-8">
              <Eyebrow tone="violet">For candidates</Eyebrow>
              <p className="ct-body mt-4">
                Applying is not the only way in, but it is the one that reaches a specific role. Every route below works
                without an account.
              </p>
              <ul className="mt-5 flex flex-col">
                {[
                  { label: "Explore open roles", href: ROUTES.opportunities },
                  { label: "Build your Career Passport", href: ROUTES.profile },
                  { label: "Your dashboard", href: ROUTES.dashboard },
                ].map((l) => (
                  <li key={l.href} className="border-t">
                    <Link href={l.href} className="flex min-h-12 items-center justify-between text-[0.98rem] hover:text-[var(--ct-green)]">
                      {l.label} <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="ct-small mt-5">
                Questions about a role:{" "}
                <a href={`mailto:${EMAIL.talent}`} className="ct-link">
                  {EMAIL.talent}
                </a>
              </p>
            </div>

            {/* Everyone */}
            <div className="ct-panel p-6 sm:p-8">
              <Eyebrow tone="ink">Write to us</Eyebrow>
              <dl className="mt-5 flex flex-col">
                {[
                  { label: "General and hiring", email: EMAIL.general },
                  { label: "Candidates", email: EMAIL.talent },
                  { label: "Your personal information", email: EMAIL.privacy },
                ].map((row) => (
                  <div key={row.email} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t py-3">
                    <dt className="ct-small">{row.label}</dt>
                    <dd>
                      <a href={`mailto:${row.email}`} className="ct-link text-[0.95rem]">
                        {row.email}
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>

              {(whatsapp || LINKEDIN) && (
                <div className="mt-5 flex flex-wrap gap-2 border-t pt-5">
                  {whatsapp && (
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="ct-btn ct-btn-secondary min-h-11">
                      <WhatsAppIcon className="h-[18px] w-[18px] text-[var(--ct-green)]" />
                      WhatsApp
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
                  {LINKEDIN && (
                    <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="ct-btn ct-btn-secondary min-h-11">
                      <LinkedInIcon />
                      LinkedIn
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
