/**
 * Rasterise the logo SVGs to HD PNG (transparent) and JPEG (matted).
 *
 * The SVGs are inlined rather than loaded through <img> so that the one-colour
 * variants, which paint with currentColor, can be driven to ink or paper.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const SRC = process.argv[2];
const OUT = process.argv[3];

const INK = "#0b0b0d";
const PAPER = "#f5f2ea";

fs.mkdirSync(path.join(OUT, "png"), { recursive: true });
fs.mkdirSync(path.join(OUT, "jpg"), { recursive: true });
fs.mkdirSync(path.join(OUT, "favicon"), { recursive: true });

const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".svg")).sort();
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});

function aspect(svg) {
  const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  return m ? { w: parseFloat(m[1]), h: parseFloat(m[2]) } : { w: 100, h: 100 };
}

async function render({ svg, width, height, colour, bg, out, jpeg }) {
  const page = await browser.newPage({
    viewport: { width: Math.ceil(width), height: Math.ceil(height) },
  });
  await page.setContent(
    `<body style="margin:0;${bg ? `background:${bg};` : ""}">
       <div style="width:${width}px;height:${height}px;color:${colour};line-height:0">${svg}</div>
     </body>`,
  );
  await page.evaluate(({ w, h }) => {
    const el = document.querySelector("svg");
    el.setAttribute("width", w);
    el.setAttribute("height", h);
    el.style.display = "block";
  }, { w: width, h: height });
  await page.waitForTimeout(90);
  await page.screenshot({
    path: out,
    omitBackground: !bg,
    ...(jpeg ? { type: "jpeg", quality: 95 } : {}),
  });
  await page.close();
}

const LOCKUP_WIDTHS = [1200, 3000];
const MARK_SIZES = [512, 2048];
const FAVICON_SIZES = [16, 32, 48, 64, 128, 256, 512];

let count = 0;

for (const file of files) {
  const svg = fs.readFileSync(path.join(SRC, file), "utf8");
  const { w, h } = aspect(svg);
  const base = file.replace(/\.svg$/, "");
  const isMark = /submark|favicon/.test(base);
  const isMono = base.endsWith("-mono");
  const isDark = base.endsWith("-dark");

  if (base.includes("favicon")) {
    for (const s of FAVICON_SIZES) {
      await render({ svg, width: s, height: s, colour: INK, out: path.join(OUT, "favicon", `${base}-${s}.png`) });
      count += 1;
    }
    continue;
  }

  const sizes = isMark ? MARK_SIZES : LOCKUP_WIDTHS;

  for (const target of sizes) {
    const width = target;
    const height = Math.round((target * h) / w);

    // Transparent PNG — the default deliverable.
    await render({
      svg, width, height, colour: isMono ? INK : "inherit",
      out: path.join(OUT, "png", `${base}-${target}.png`),
    });
    count += 1;

    // One-colour art is also wanted in white for dark grounds.
    if (isMono) {
      await render({
        svg, width, height, colour: PAPER,
        out: path.join(OUT, "png", `${base.replace("-mono", "-white")}-${target}.png`),
      });
      count += 1;
    }
  }

  // JPEG cannot carry alpha, so matte each on the ground it was drawn for.
  const big = isMark ? 2048 : 3000;
  const bigH = Math.round((big * h) / w);
  if (!isMono) {
    await render({
      svg, width: big, height: bigH, colour: "inherit",
      bg: isDark ? INK : PAPER, jpeg: true,
      out: path.join(OUT, "jpg", `${base}-${big}.jpg`),
    });
    count += 1;
  }
}

await browser.close();
console.log("rendered", count, "raster files");
