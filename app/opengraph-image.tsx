import { ImageResponse } from "next/og";

export const alt = "TALYNT LABS — Talent intelligence, built for hiring.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0b0b0d",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
          <span
            style={{
              fontSize: 34,
              letterSpacing: "-0.02em",
              color: "#f5f2ea",
              fontWeight: 600,
            }}
          >
            TALYNT
          </span>
          <span style={{ fontSize: 18, letterSpacing: "0.22em", color: "#ff4d1c" }}>
            LABS
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <span style={{ fontSize: 76, lineHeight: 1.05, color: "#f5f2ea" }}>
            Hiring is more than
          </span>
          <span style={{ fontSize: 76, lineHeight: 1.05, color: "#8a8a94" }}>
            finding the right CV.
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", width: 56, height: 3, backgroundColor: "#ff4d1c" }} />
          <span style={{ fontSize: 24, letterSpacing: "0.04em", color: "#aeaeba" }}>
            Talent intelligence, built for hiring.
          </span>
        </div>
      </div>
    ),
    size,
  );
}
