import type { Metadata } from "next";
import { Suspense } from "react";
import { PASSPORT } from "@/lib/contour/content";
import { Eyebrow } from "@/components/contour/ui";
import { ProfileFromParams } from "@/components/contour/candidate/ProfileFromParams";

export const metadata: Metadata = {
  title: "Submit your profile",
  description:
    "Build your Career Passport — where you’ve been, where you are and where this is going — and send it with a role you choose.",
};

export default function ProfilePage() {
  return (
    <>
      <header className="ct-wrap pt-12 pb-10 md:pt-16">
        <Eyebrow tone="violet">Submit your profile</Eyebrow>
        <h1 className="ct-display ct-xl mt-7 max-w-4xl">
          {PASSPORT.title} <span className="ct-italic">{PASSPORT.titleItalic}</span>
        </h1>
        <p className="ct-lede mt-6 max-w-2xl">
          Six short steps. Only your name, an email and where you’re based are required. It saves to this browser as you
          type, and it is sent only with a role you choose, after you confirm.
        </p>
      </header>
      <section aria-label="Profile" className="ct-wrap pb-[var(--ct-section)]">
        <div className="max-w-4xl">
          <Suspense fallback={<p className="ct-meta ct-mute">Loading…</p>}>
            <ProfileFromParams />
          </Suspense>
        </div>
      </section>
    </>
  );
}
