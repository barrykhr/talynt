#!/usr/bin/env node
/**
 * Renders the "Meet Talyn" ad to MP4, frame by frame, with the shared sound
 * design (../one-click/audio.mjs), the music (music.py) and the voiceover
 * (voiceover.py).
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
const SECONDS = 38;
// Music: music.py (120 BPM, risers and impacts on every cut). UI sounds on top.
const MUSIC = process.env.MUSIC ?? path.join(here, "out", "music.wav");
const FLIPS = [];
const CUES = [
  ...[0.55, 0.7, 0.85, 1.0].map((t) => [t, "tick"]),
  ...[3.25, 3.5, 3.75].map((t) => [t, "ping-soft"]),
  ...[6.85, 6.95, 7.05, 8.65, 8.75, 8.85].map((t) => [t, "tick"]),
  ...[9.35, 9.55, 9.75, 9.95].map((t) => [t, "tick"]),
  ...[12.45, 12.67, 12.89].map((t) => [t, "ping"]),
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => [15.3 + i * 0.16, "tick"]),
  [17.15, "click"],
  [18.75, "ping"],
  [19.2, "ping"],
  [19.75, "ping"],
  [20.15, "ping-in"],
  ...[0, 1, 2, 3, 4, 5].map((i) => [22.65 + i * 0.2, "tick"]),
  [24.15, "click"],
  [25.95, "chime"],
  ...[26.35, 26.75, 27.15].map((t) => [t, "tick"]),
  [30.5, "ping-soft"],
  [31.5, "ping-soft"],
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
renderAudio(audio, SECONDS, process.env.VOICEOVER, { flips: FLIPS, cues: CUES, bed: MUSIC });

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
