#!/usr/bin/env node
/**
 * Renders the "Human in the loop" ad to MP4, frame by frame, with the shared sound
 * design (../one-click/audio.mjs), the music (music.py) and the voiceover
 * (voiceover.py).
 *
 *   VOICEOVER=ads/human-loop/out/voiceover.wav node ads/human-loop/render.mjs [v|s|all] [out dir]
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
const SECONDS = 47;
// Music: music.py (120 BPM funk; a brass hit on every human line). UI sounds on top.
const MUSIC = process.env.MUSIC ?? path.join(here, "out", "music.wav");
const FLIPS = [];
const STEPS = [7.5, 11.5, 16.5, 21, 25.5, 31, 35.5];
const HUMAN = [5.13, 9.3, 14.15, 18.6, 23.23, 28.0, 32.99, 37.36];
const CUES = [
  [0.75, "ping-soft"],
  [1.65, "ping-in"],
  ...STEPS.flatMap((s) => [[s + 0.65, "tick"], [s + 0.9, "tick"], [s + 1.05, "tick"], [s + 1.2, "tick"]]),
  ...HUMAN.map((h) => [h + 0.42, "click"]),
  [39.35, "ping-soft"],
  [40.95, "ping-in"],
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

const audio = path.join(out, "talynt-human-loop-audio.wav");
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

  const file = path.join(out, `talynt-human-loop-${shape.name}.mp4`);
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
