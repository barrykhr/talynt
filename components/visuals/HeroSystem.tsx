"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * The hero's living system.
 *
 * Signals drift in from the talent market as undifferentiated noise. They meet
 * the TALYNT intelligence layer. Most do not pass — that refusal is the point,
 * not a rendering artefact. The few that resolve travel as clean, labelled
 * lines to a single decision node.
 *
 * Drawn on canvas so the density stays cheap; the typography around it stays
 * in the DOM so it remains selectable, translatable and readable.
 */

const SIGNAL_NAMES = [
  "role",
  "skills",
  "experience",
  "motivation",
  "context",
  "team",
  "values",
  "ownership",
  "communication",
  "leadership",
  "learning",
  "career intent",
  "ambiguity",
  "collaboration",
  "decision-making",
];

const MEMBRANE_X = 0.46;
const NODE_X = 0.9;
const PASS_RATE = 0.22;

type Particle = {
  x: number;
  y: number;
  speed: number;
  drift: number;
  phase: number;
  size: number;
  name: number;
  state: "noise" | "resolved" | "absorbed";
  alpha: number;
  lane: number;
  trail: number;
};

function spawn(i: number, fromLeft = true): Particle {
  return {
    x: fromLeft ? -0.05 - Math.random() * 0.4 : Math.random() * MEMBRANE_X,
    y: 0.06 + Math.random() * 0.88,
    speed: 0.00055 + Math.random() * 0.0012,
    drift: (Math.random() - 0.5) * 0.28,
    phase: Math.random() * Math.PI * 2,
    size: 1 + Math.random() * 1.9,
    name: i % SIGNAL_NAMES.length,
    state: "noise",
    alpha: 0,
    lane: 0,
    trail: 0,
  };
}

export function HeroSystem() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const pointer = useRef({ x: -1, y: -1, active: false });
  const reduced = useReducedMotion();
  const [resolvedLog, setResolvedLog] = useState<string[]>([
    "motivation",
    "context",
    "ownership",
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    let lastLog = 0;
    let nodePulse = 0;

    const particles: Particle[] = Array.from({ length: 108 }, (_, i) =>
      spawn(i, false),
    );

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrap.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    resize();

    const drawMembrane = (t: number) => {
      const mx = width * MEMBRANE_X;
      const bandWidth = Math.max(54, width * 0.075);

      const gradient = ctx.createLinearGradient(mx - bandWidth, 0, mx + bandWidth, 0);
      gradient.addColorStop(0, "rgba(255,77,28,0)");
      gradient.addColorStop(0.5, "rgba(255,77,28,0.13)");
      gradient.addColorStop(1, "rgba(255,77,28,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(mx - bandWidth, 0, bandWidth * 2, height);

      // The aperture itself: a hairline with a slow scanning highlight.
      ctx.strokeStyle = "rgba(255,77,28,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mx, height * 0.04);
      ctx.lineTo(mx, height * 0.96);
      ctx.stroke();

      const scanY = height * (0.04 + ((t * 0.00013) % 1) * 0.92);
      const scan = ctx.createLinearGradient(mx, scanY - 70, mx, scanY + 70);
      scan.addColorStop(0, "rgba(255,147,112,0)");
      scan.addColorStop(0.5, "rgba(255,147,112,0.85)");
      scan.addColorStop(1, "rgba(255,147,112,0)");
      ctx.strokeStyle = scan;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(mx, scanY - 70);
      ctx.lineTo(mx, scanY + 70);
      ctx.stroke();
    };

    const drawNode = () => {
      const nx = width * NODE_X;
      const ny = height * 0.5;
      const pulse = Math.max(0, nodePulse);

      ctx.strokeStyle = `rgba(245,242,234,${0.14 + pulse * 0.5})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(nx, ny, 22 + pulse * 16, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = `rgba(255,77,28,${0.75 + pulse * 0.25})`;
      ctx.beginPath();
      ctx.arc(nx, ny, 4.5, 0, Math.PI * 2);
      ctx.fill();
    };

    const step = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      drawMembrane(time);

      const mx = MEMBRANE_X;
      const px = pointer.current.active ? pointer.current.x : -1;
      const py = pointer.current.active ? pointer.current.y : -1;

      for (const p of particles) {
        p.x += p.speed * (p.state === "resolved" ? 2.6 : 1);
        p.alpha = Math.min(1, p.alpha + 0.02);

        if (p.state === "noise") {
          p.y += Math.sin(time * 0.0004 + p.phase) * 0.00035 * p.drift * 40;

          // Decision point: the membrane admits only what carries signal.
          if (p.x >= mx) {
            const passes = Math.random() < PASS_RATE;
            if (passes) {
              p.state = "resolved";
              p.lane = p.y;
              p.y = p.y * 0.35 + 0.5 * 0.65;
              nodePulse = 1;
              if (time - lastLog > 1100) {
                lastLog = time;
                const name = SIGNAL_NAMES[p.name];
                setResolvedLog((prev) =>
                  prev[0] === name ? prev : [name, prev[0], prev[1]],
                );
              }
            } else {
              p.state = "absorbed";
            }
          }
        } else if (p.state === "resolved") {
          // Converge toward the decision node, and end there.
          p.y += (0.5 - p.y) * 0.03;
          p.trail = Math.min(1, p.trail + 0.06);
          if (p.x >= NODE_X) {
            p.state = "absorbed";
            nodePulse = 1;
          }
        } else {
          p.alpha -= 0.05;
        }

        if (p.x > 1.05 || (p.state === "absorbed" && p.alpha <= 0)) {
          Object.assign(p, spawn(p.name));
        }

        const cx = p.x * width;
        const cy = p.y * height;

        // Pointer proximity lifts a signal out of the noise.
        let boost = 0;
        if (px >= 0) {
          const dx = cx - px;
          const dy = cy - py;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) boost = (1 - dist / 130) ** 2;
        }

        // A signal that has reached the node keeps its colour as it dissolves.
        if (p.state === "resolved" || (p.state === "absorbed" && p.trail > 0)) {
          if (p.trail > 0) {
            const tail = ctx.createLinearGradient(cx - 60, cy, cx, cy);
            tail.addColorStop(0, "rgba(255,77,28,0)");
            tail.addColorStop(1, `rgba(255,107,61,${0.45 * p.alpha})`);
            ctx.strokeStyle = tail;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - 60, cy);
            ctx.lineTo(cx, cy);
            ctx.stroke();
          }
          ctx.fillStyle = `rgba(255,77,28,${0.95 * p.alpha})`;
          ctx.beginPath();
          ctx.arc(cx, cy, 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const base = p.state === "absorbed" ? 0.14 : 0.38;
          ctx.fillStyle = `rgba(245,242,234,${Math.max(0, (base + boost * 0.65) * p.alpha)})`;
          ctx.beginPath();
          ctx.arc(cx, cy, p.size + boost * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      nodePulse = Math.max(0, nodePulse - 0.02);
      drawNode();

      raf = requestAnimationFrame(step);
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      drawMembrane(0);
      for (const p of particles) {
        const cx = p.x * width;
        const cy = p.y * height;
        ctx.fillStyle = "rgba(245,242,234,0.3)";
        ctx.beginPath();
        ctx.arc(cx, cy, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      // A composed end-state: a handful of resolved signals, already converged.
      for (let i = 0; i < 6; i += 1) {
        const y = height * (0.32 + i * 0.072);
        ctx.strokeStyle = "rgba(255,77,28,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(width * MEMBRANE_X, y);
        ctx.lineTo(width * NODE_X, height * 0.5);
        ctx.stroke();
      }
      drawNode();
    };

    if (reduced) {
      drawStatic();
      const onResize = () => {
        resize();
        drawStatic();
      };
      window.addEventListener("resize", onResize);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", onResize);
      };
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      pointer.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };
    const onPointerLeave = () => {
      pointer.current.active = false;
    };

    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerleave", onPointerLeave);
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [reduced]);

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full"
      role="img"
      aria-label="A live diagram: signals from the talent market meet the TALYNT intelligence layer; most are filtered out, and the few that carry meaning converge into a single decision."
    >
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden="true" />

      {/* Instrument annotations — the DOM keeps the typography crisp. */}
      <div className="pointer-events-none absolute inset-0 select-none">
        <span className="mono-micro absolute top-0 left-0 hidden opacity-35 sm:block">
          Talent market
        </span>
        <span className="mono-micro absolute bottom-0 left-0 hidden opacity-35 sm:block">
          Noise
        </span>
        <span className="mono-micro absolute top-0 left-0 whitespace-nowrap text-signal sm:left-[46%] sm:-translate-x-1/2 sm:text-center">
          Intelligence
        </span>
        <span className="mono-micro absolute top-0 right-0 hidden opacity-35 sm:block">
          Decision
        </span>
        <div className="absolute right-0 bottom-0 text-right">
          <span className="mono-micro opacity-35">Resolved</span>
          <p className="mono-micro mt-1.5 text-signal-300 tabular-nums">
            {resolvedLog.filter(Boolean).slice(0, 3).join(" · ")}
          </p>
        </div>
      </div>
    </div>
  );
}
