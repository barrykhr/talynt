// Renders kivitronics-diwali.html frame-by-frame and encodes a seamless looping GIF.
// Usage:  node export-gif.js [size=600] [fps=25]
// Needs:  Node with `playwright` (npm i playwright && npx playwright install chromium) and ffmpeg on PATH.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SIZE = Number(process.argv[2] || 600);
const FPS = Number(process.argv[3] || 25);
const here = __dirname;
const html = 'file://' + path.join(here, 'kivitronics-diwali.html') + '?capture';
const frames = fs.mkdtempSync(path.join(os.tmpdir(), 'diwali-frames-'));
const out = path.join(here, `kivitronics-diwali-${SIZE}.gif`);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 760, height: 760 } });
  await page.goto(html);
  await page.waitForFunction(() => window.fontsReady === true);
  const loop = await page.evaluate(() => window.LOOP);
  const n = Math.round(loop * FPS);
  const canvas = page.locator('#c');
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.renderFrame(t), i / FPS);
    const png = await page.evaluate(() => document.getElementById('c').toDataURL('image/png'));
    fs.writeFileSync(path.join(frames, `f${String(i).padStart(4, '0')}.png`), Buffer.from(png.split(',')[1], 'base64'));
  }
  await browser.close();

  const scale = `scale=${SIZE}:${SIZE}:flags=lanczos`;
  const pal = path.join(frames, 'palette.png');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, 'f%04d.png'),
    '-vf', `${scale},palettegen=max_colors=256:stats_mode=full`, pal]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, 'f%04d.png'), '-i', pal,
    '-lavfi', `${scale}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`, '-loop', '0', out]);
  fs.rmSync(frames, { recursive: true, force: true });
  console.log(`Wrote ${out} (${n} frames, ${(fs.statSync(out).size / 1e6).toFixed(2)} MB)`);
})();
