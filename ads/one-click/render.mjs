#!/usr/bin/env node
/**
 * Renders ad.html to MP4, frame by frame, with the sound design from audio.mjs.
 *
 *   node ads/one-click/render.mjs [v|s|all] [out dir]
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
import { renderAudio } from "./audio.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const SECONDS = 20;
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

const audio = path.join(out, "talynt-one-click-audio.wav");
renderAudio(audio, SECONDS);

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

  const total = FPS * SECONDS;
  for (let i = 0; i < total; i++) {
    const t = (i / FPS) * 1000;
    await page.evaluate((ms) => document.getAnimations().forEach((a) => (a.currentTime = ms)), t);
    await page.screenshot({ path: path.join(frames, `${String(i).padStart(4, "0")}.jpg`), type: "jpeg", quality: 92 });
  }
  await page.close();

  const file = path.join(out, `talynt-one-click-${shape.name}.mp4`);
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
