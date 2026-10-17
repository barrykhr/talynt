import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/contour/site";

/** The dashboard became "Your applications" and "Your profile". Old links still land. */
export default function DashboardPage() {
  redirect(ROUTES.applications);
}
