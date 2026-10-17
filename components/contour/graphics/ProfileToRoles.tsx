"use client";

import { useEffect, useState } from "react";
import { ROLES } from "@/lib/candidate/roles";
import { definitionFor } from "@/lib/assessment/bank";
import { ONE_PROFILE } from "@/lib/contour/proposed";
import { flow, ring } from "@/lib/contour/geometry";

/**
 * One profile, three roles, three assessments. The roles are real open roles
 * and the line under each is the first competency its own assessment asks
 * about — so the drawing shows the actual difference between them, not a
 * pretend one. It does not suggest every role suits every person.
 */

const W = 520;
const H = 340;
const SLUGS = ["staff-data-engineer-fintech", "product-manager-developer-tools", "design-lead-consumer"];
const ROLE_SET = SLUGS.map((slug) => {
  const role = ROLES.find((r) => r.slug === slug)!;
  return { title: role.title.split(",")[0], competency: definitionFor(slug)?.competencies[0]?.label ?? "" };
});
const CARD_Y = [36, 136, 236];
const RINGS = [12, 19, 26].map((r, i) => ring(66, 104, r, 41 + i, 0.12));

export function ProfileToRoles() {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setDrawn(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <figure data-drawn={drawn ? "true" : "false"} className="ct-window">
      <div className="ct-window-bar">
        <span className="ct-meta ct-mute">{ONE_PROFILE.profile} → 3 roles</span>
        <span className="ct-meta ct-violet">{ONE_PROFILE.assessment}</span>
      </div>
      <div className="ct-field relative bg-[var(--ct-bg)]" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label={ONE_PROFILE.graphicLabel}>
          {/* The profile */}
          <g className="ct-appear" style={{ ["--d" as string]: "100ms" }}>
            <rect x="20" y="62" width="150" height="216" rx="12" fill="var(--ct-surface)" stroke="var(--ct-ink)" strokeWidth="1.1" />
            {RINGS.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="var(--ct-violet)" strokeWidth={i === 0 ? 1.1 : 0.8} opacity={0.9 - i * 0.25} />
            ))}
            <circle cx="66" cy="104" r="4.5" fill="var(--ct-signal)" />
            <text x="104" y="100" fontSize="10.5" className="font-mono" fill="var(--ct-ink)">
              Your
            </text>
            <text x="104" y="114" fontSize="10.5" className="font-mono" fill="var(--ct-ink)">
              profile
            </text>
            {["Experience", "Skills", "Education", "Preferences"].map((label, i) => (
              <g key={label}>
                <text x="36" y={162 + i * 28} fontSize="9.5" className="font-mono" fill="var(--ct-mute)" letterSpacing="0.04em">
                  {label.toUpperCase()}
                </text>
                <path d={`M36 ${170 + i * 28}h${92 - i * 14}`} stroke="var(--ct-line-2)" strokeWidth="3" strokeLinecap="round" />
              </g>
            ))}
          </g>

          {/* Connections: the same profile, three times */}
          <g fill="none" stroke="var(--ct-violet)" strokeWidth="1.3">
            {CARD_Y.map((y, i) => (
              <path key={y} d={flow(170, 170, 300, y + 34, 0.55)} pathLength={1} className="ct-draw" style={{ ["--d" as string]: `${500 + i * 180}ms` }} />
            ))}
          </g>

          {/* Each role, with its own assessment */}
          {ROLE_SET.map((r, i) => {
            const y = CARD_Y[i];
            return (
              <g key={r.title} className="ct-appear" style={{ ["--d" as string]: `${1100 + i * 180}ms` }}>
                <rect x="300" y={y} width="200" height="68" rx="10" fill="var(--ct-surface)" stroke="var(--ct-ink)" strokeWidth="1" />
                <rect x="314" y={y + 14} width="12" height="12" rx="3" fill="var(--ct-ink)" />
                <text x="334" y={y + 24} fontSize="12" fill="var(--ct-ink)" style={{ fontFamily: "var(--font-ct-serif), serif" }}>
                  {r.title}
                </text>
                <rect x="314" y={y + 38} width="172" height="18" rx="5" fill="var(--ct-violet-wash)" />
                <text x="322" y={y + 50.5} fontSize="8.6" className="font-mono" fill="var(--ct-violet-ink)" letterSpacing="0.02em">
                  {r.competency.length > 30 ? `${r.competency.slice(0, 29)}…` : r.competency}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}
