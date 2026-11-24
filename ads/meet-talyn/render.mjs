#!/usr/bin/env node
/**
 * Renders the "Meet Talyn" ad to MP4, frame by frame, with the shared sound
 * design (../one-click/audio.mjs) and the voiceover (voiceover.py).
 *
 *   VOICEOVER=ads/meet-talyn/out/voiceover.wav node ads/meet-talyn/render.mjs [v|s|all] [out dir]
 *
 * v = 1080×1920 (9:16), s = 1080×1080 (1:1). Needs Playwright (Chromium) and
 * ffmpeg on the PATH. Every animation in ad.html runs on one timeline, so the
 * page is paused and each frame is the timeline set to that moment — the
 * result is the same on any machine, however fast it is.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderAudio } from "../one-click/audio.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const SECONDS = 36.5;
// Sound cues on this ad's timeline (seconds), in the shared palette.
const FLIPS = [1.95, 5.7, 10.4, 13.7, 17.2, 19.9, 24.0, 28.4, 31.6];
const CUES = [
  [0.6, "ping-soft"],
  [2.4, "chime"],
  [3.5, "tick"], [3.7, "tick"], [3.9, "tick"],
  [6.5, "ping-soft"],
  [8.3, "tick"], [8.4, "tick"], [8.5, "tick"],
  [9.0, "ping-soft"],
  [12.2, "chime"],
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => [14.5 + i * 0.18, "tick"]),
  [16.2, "ping"],
  [18.8, "ping"],
  [19.1, "ping-in"],
  [19.5, "ping-in"],
  [20.4, "ping-soft"],
  [20.95, "ping-in"],
  ...[0, 1, 2, 3, 4, 5].map((i) => [21.45 + i * 0.22, "tick"]),
  [23.0, "chime"],
  [24.6, "ping-soft"],
  [25.0, "tick"], [25.3, "tick"], [25.6, "tick"],
  [29.5, "ping-soft"],
  [31.85, "hit"],
  [32.8, "ping-soft"],
];
const SHAPES = { v: { w: 1080, h: 1920, name: "9x16" }, s: { w: 1080, h: 1080, name: "1x1" } };

const which = process.argv[2] ?? "all";
const out = path.resolve(process.argv[3] ?? path.join(here, "out"));
fs.mkdirSync(out, { recursive: true });

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  ({ chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "/opt/node22/lib/node_modules/playwright/index.mjs"));
}

const audio = path.join(out, "talynt-meet-talyn-audio.wav");
// VOICEOVER=/path/to/voiceover.mp3 mixes a recorded voiceover in (ads/voice/ELEVENLABS.md).
renderAudio(audio, SECONDS, process.env.VOICEOVER, { flips: FLIPS, cues: CUES });

const browser = await chromium.launch();
for (const key of which === "all" ? Object.keys(SHAPES) : [which]) {
  const shape = SHAPES[key];
  const frames = path.join(out, `frames-${key}`);
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames);

  const page = await browser.newPage({ viewport: { width: shape.w, height: shape.h } });
  await page.goto(`${pathToFileURL(path.join(here, "ad.html")).href}?f=${key}`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.__ready);
  await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));

  const total = Math.round(FPS * SECONDS);
  for (let i = 0; i < total; i++) {
    const t = (i / FPS) * 1000;
    await page.evaluate((ms) => document.getAnimations().forEach((a) => (a.currentTime = ms)), t);
    await page.screenshot({ path: path.join(frames, `${String(i).padStart(4, "0")}.jpg`), type: "jpeg", quality: 92 });
  }
  await page.close();

  const file = path.join(out, `talynt-meet-talyn-${shape.name}.mp4`);
  execFileSync("ffmpeg", [
    "-v", "error", "-y",
    "-framerate", String(FPS), "-i", path.join(frames, "%04d.jpg"),
    "-i", audio,
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k",
    "-shortest", "-movflags", "+faststart",
    file,
  ]);
  fs.rmSync(frames, { recursive: true, force: true });
  console.log(`✓ ${file}`);
}
await browser.close();
