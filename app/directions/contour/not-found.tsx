import Link from "next/link";
import { ROUTES } from "@/lib/contour/site";
import { Meeting } from "@/components/contour/graphics/Meeting";
import { EMPLOYERS_ONLY } from "@/lib/contour/variant";

export default function ContourNotFound() {
  return (
    <main id="ct-main" className="ct-wrap grid gap-10 py-24 md:grid-cols-2 md:items-center">
      <div>
        <p className="ct-meta ct-mute">Not found</p>
        <h1 className="ct-display ct-l mt-5">
          Nothing at this address. <span className="ct-italic block">It may have moved or closed.</span>
        </h1>
        {!EMPLOYERS_ONLY && <p className="ct-body mt-5 max-w-md">If you were looking for a role, the open ones are all on one page.</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          {!EMPLOYERS_ONLY && (
            <Link href={ROUTES.opportunities} className="ct-btn ct-btn-primary">
              Explore roles <span aria-hidden="true">→</span>
            </Link>
          )}
          <Link href={ROUTES.home} className={EMPLOYERS_ONLY ? "ct-btn ct-btn-primary" : "ct-btn ct-btn-secondary"}>
            Home
          </Link>
        </div>
      </div>
      <Meeting className="w-full max-w-md" decorative />
    </main>
  );
}
