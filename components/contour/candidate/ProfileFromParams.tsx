"use client";

import { useSearchParams } from "next/navigation";
import { ProfileFlow } from "./ProfileFlow";

/** Lets the dashboard deep-link to a step: /profile?step=experience */
export function ProfileFromParams() {
  const params = useSearchParams();
  return <ProfileFlow initialStep={params.get("step") ?? undefined} />;
}
