// Builds the "Open Roles Across India" LinkedIn carousel in two themes.
// Each deck: 4 portrait slides, 4:5 (10.8in x 13.5in = 1080 x 1350 at 100 px/in).
// Run: NODE_PATH=<dir with pptxgenjs> node build.js <out-dir>
const path = require("path");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require(process.env.APPLY_THEME);

const W = 10.8;
const H = 13.5;
const M = 0.8; // outer margin
const CW = W - 2 * M; // content width

// ---------------------------------------------------------------- content
const chennai = {
  left: {
    head: "Finance & People",
    roles: [
      { title: "Audit Assistant", meta: "0–2 years · 5 openings", ind: "Audit Firm" },
      { title: "Financial Analyst", meta: "1–2 years · 1 opening", req: "CA candidates", ind: "Maritime Shipping" },
      { title: "Senior Executive Accounts", meta: "5–7 years · 1 opening", req: "Semi-qualified CA", ind: "Maritime Shipping" },
      { title: "HR Manager", meta: "3–5 years · 1 opening", ind: "Retail" },
    ],
  },
  right: {
    head: "Tech, Support & Sales",
    roles: [
      { title: "Data Engineer", meta: "7+ years", ind: "Staffing Firm" },
      { title: "Technical Support", meta: "0–2 years", ind: "Audit Firm" },
      { title: "Full Stack Developer Lead", meta: "5–7 years · 3 openings", ind: "Maritime Product" },
      { title: "Dot Net Developer", meta: "5+ years", ind: "Staffing Firm" },
      { title: "Pre-Sales", meta: "0–1 years · 4 openings", req: "Hindi mandatory", ind: "EdTech" },
    ],
  },
};

const workday = {
  locations: ["Pune", "Mumbai", "Chennai", "Hyderabad", "Bengaluru", "Kolkata", "Delhi", "Gurugram"],
  roles: [
    { title: "Workday Consultant", sub: "Finance Payables, Integration & Treasury Support Consultant" },
    { title: "Workday Finance", sub: "GL/FDM/PC, Integration" },
    { title: "Workday Integration (Technical)" },
    { title: "Workday Reporting", sub: "Senior Developer" },
  ],
  industry: "IT Services",
};

const byCity = [
  { city: "Bengaluru", roles: [{ title: "Sales", meta: "0–2 years · 6 openings", req: "Hindi mandatory; regional language is a bonus", ind: "Telecom SaaS" }] },
  { city: "Pune", roles: [{ title: "Technical Service & Sales Engineer", meta: "5+ years" }] },
  { city: "Mumbai", roles: [{ title: "Head of Valve Controls & Actuators", meta: "12+ years · 1 opening", ind: "Manufacturing" }] },
  {
    city: "Gurugram",
    roles: [
      { title: "Business Development Executive", meta: "0–4 years · 1 opening", ind: "Agritech Stealth Startup" },
      { title: "Marketing & Brand Executive", meta: "1+ years · 2 openings", ind: "Agritech Stealth Startup" },
    ],
  },
  { city: "Noida", roles: [{ title: "GTM Engineer", meta: "3–7 years", ind: "IT Services/Consulting" }] },
];

// ---------------------------------------------------------------- themes
// dk1 = main text, lt1 = page background (both decks), so tx1/bg1 map correctly.
const THEMES = {
  editorial: {
    file: "open-roles-india-editorial",
    theme: {
      name: "Editorial",
      headFontFace: "Cambria",
      bodyFontFace: "Calibri",
      colors: {
        dk1: "1F1A15", lt1: "F5EFE3", dk2: "5B5147", lt2: "CDBFA8",
        accent1: "9E4A2A", accent2: "EADFCB", accent3: "7A6A58", accent4: "B9805F",
        accent5: "3E352C", accent6: "D8C9B0", hlink: "9E4A2A", folHlink: "7A6A58",
      },
    },
    headBold: false,
    titleSize: 72,
    roleTitleSize: 25,
    roleTitleBold: true,
    caps: false,
    // average glyph width as a fraction of the point size, for wrap estimates
    headChar: 0.45, bodyChar: 0.415,
  },
  night: {
    file: "open-roles-india-night-shift",
    theme: {
      name: "Night Shift",
      headFontFace: "Arial",
      bodyFontFace: "Arial",
      colors: {
        dk1: "F6F1E4", lt1: "0B1630", dk2: "C3C8D4", lt2: "2A3A5E",
        accent1: "C8F03C", accent2: "16244A", accent3: "8F9BB3", accent4: "A6D12A",
        accent5: "F6F1E4", accent6: "1E2E55", hlink: "C8F03C", folHlink: "8F9BB3",
      },
    },
    headBold: true,
    titleSize: 68,
    roleTitleSize: 25,
    roleTitleBold: true,
    caps: true,
    headChar: 0.49, bodyChar: 0.47,
  },
};

// ---------------------------------------------------------------- helpers
const lineH = (pt) => (pt * 1.24) / 72;
function lines(text, pt, widthIn, charFactor) {
  const perLine = Math.floor((widthIn * 72) / (pt * charFactor));
  // greedy word wrap
  let n = 1, cur = 0;
  for (const w of text.split(" ")) {
    const len = w.length + (cur ? 1 : 0);
    if (cur + len > perLine && cur) { n++; cur = w.length; } else cur += len;
  }
  return n;
}

// A role block: title, then "meta · industry" or separate lines. Returns height.
function roleBlock(slide, T, C, r, x, y, w, opts = {}) {
  const tSize = opts.titleSize || T.roleTitleSize;
  const body = opts.bodySize || 19;
  const gap = 4; // pt before each body paragraph
  const runs = [
    { text: r.title, options: { fontFace: T.theme.headFontFace, fontSize: tSize, bold: T.roleTitleBold, color: C.text1, breakLine: true } },
  ];
  let h = lines(r.title, tSize, w, T.headChar) * lineH(tSize);
  const para = (parts, plain) => {
    parts.forEach((p, i) =>
      runs.push({ text: p.text, options: { fontSize: body, color: p.color, bold: !!p.bold, paraSpaceBefore: i === 0 ? gap : 0, breakLine: false } })
    );
    runs[runs.length - 1].options.breakLine = true;
    h += lines(plain, body, w, T.bodyChar) * lineH(body) + gap / 72;
  };
  const inline = opts.inlineIndustry && r.ind && lines(`${r.meta}  ·  ${r.ind}`, body, w, T.bodyChar) === 1;
  if (inline) {
    para([{ text: r.meta, color: C.text2 }, { text: "  ·  ", color: C.text2 }, { text: r.ind, color: C.accent1, bold: true }], `${r.meta}  ·  ${r.ind}`);
  } else {
    para([{ text: r.meta, color: C.text2 }], r.meta);
  }
  if (r.req) para([{ text: r.req, color: C.text1 }], r.req);
  if (!inline && r.ind) para([{ text: r.ind, color: C.accent1, bold: true }], r.ind);
  delete runs[runs.length - 1].options.breakLine;
  if (opts.measure) return h;
  slide.addText(runs, {
    x, y, w, h: h + 0.05, margin: 0, valign: "top", isTextBox: true, fit: "none",
    fontFace: T.theme.bodyFontFace, objectName: `Role: ${r.title}`,
  });
  return h;
}

function hairline(slide, C, x, y, w, name, color) {
  slide.addShape("line", { x, y, w, h: 0, line: { color: color || C.background2, width: 0.75 }, objectName: name });
}

// Small group label: editorial = rust small caps text; night = lime pill.
function groupLabel(slide, T, C, text, x, y, name) {
  const size = 20;
  if (T.caps) {
    const w = (text.length * size * 0.66) / 72 + 0.5;
    slide.addText(text.toUpperCase(), {
      shape: "roundRect", rectRadius: 0.24, x, y, w, h: 0.48, fill: { color: C.accent1 },
      color: C.background1, bold: true, fontSize: size, charSpacing: 1.5, align: "center", valign: "middle",
      margin: 0, isTextBox: true, objectName: name,
    });
    return 0.5;
  }
  slide.addText(text.toUpperCase(), {
    x, y, w: CW, h: 0.48, margin: 0, color: C.accent1, bold: true, fontSize: size, charSpacing: 3,
    valign: "middle", isTextBox: true, objectName: name,
  });
  return 0.5;
}

// ---------------------------------------------------------------- build
async function build(key, outDir) {
  const T = THEMES[key];
  const pres = new pptxgen();
  pres.defineLayout({ name: "CAROUSEL_4x5", width: W, height: H });
  pres.layout = "CAROUSEL_4x5";
  pres.theme = { headFontFace: T.theme.headFontFace, bodyFontFace: T.theme.bodyFontFace };
  pres.title = "Open Roles Across India";
  const C = pres.SchemeColor;
  const bg = { color: T.theme.colors.lt1 };

  pres.defineSlideMaster({ title: "Cover", background: bg, objects: [] });
  pres.defineSlideMaster({
    title: "Roles",
    background: bg,
    objects: [
      {
        placeholder: {
          options: {
            name: "title", type: "title", x: M, y: 0.75, w: CW, h: 1.3, margin: 0, valign: "bottom", align: "left",
            fontSize: T.titleSize, bold: T.headBold, color: C.text1, fontFace: T.theme.headFontFace,
          },
          text: "",
        },
      },
    ],
  });
  const TITLE_RULE_Y = 2.35;
  const BODY_Y = 2.85;
  const titleRule = (s) => {
    if (key === "editorial") hairline(s, C, M, TITLE_RULE_Y, CW, "Title rule", C.text1);
  };

  // ---- Slide 1: cover (exact copy only)
  {
    pres.addSection({ title: "Cover" });
    const s = pres.addSlide({ masterName: "Cover", sectionTitle: "Cover" });
    if (key === "editorial") {
      s.addShape("rect", { x: 0.45, y: 0.45, w: W - 0.9, h: H - 0.9, fill: { type: "none" }, line: { color: C.accent1, width: 0.75 }, objectName: "Frame" });
      s.addText("Open Roles Across India.", {
        x: M + 0.1, y: 2.6, w: CW - 0.2, h: 4.6, margin: 0, valign: "bottom", isTextBox: true,
        fontFace: T.theme.headFontFace, fontSize: 110, color: C.text1, lineSpacingMultiple: 0.92, objectName: "Headline",
      });
      hairline(s, C, M + 0.1, 8.0, CW - 0.2, "Divider", C.text1);
      s.addText(
        [
          { text: "Know someone who may fit?", options: { color: C.text1, breakLine: true } },
          { text: "Share this post.", options: { color: C.accent1, paraSpaceBefore: 10 } },
        ],
        { x: M + 0.1, y: 8.45, w: CW - 0.2, h: 2.4, margin: 0, valign: "top", isTextBox: true, fontFace: T.theme.headFontFace, italic: true, fontSize: 50, objectName: "Call to share" }
      );
    } else {
      s.addShape("ellipse", { x: 5.9, y: -2.4, w: 7.4, h: 7.4, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "Lime disc" });
      s.addShape("ellipse", { x: 7.35, y: -0.95, w: 4.5, h: 4.5, fill: { color: C.background1 }, line: { type: "none" }, objectName: "Disc cut-out" });
      s.addText("Open Roles Across India.", {
        x: M, y: 4.2, w: CW, h: 5.2, margin: 0, valign: "bottom", isTextBox: true,
        fontFace: T.theme.headFontFace, bold: true, fontSize: 104, color: C.text1, lineSpacingMultiple: 0.9, objectName: "Headline",
      });
      s.addText(
        [
          { text: "Know someone who may fit?", options: { color: C.text1, breakLine: true } },
          { text: "Share this post.", options: { color: C.accent1, paraSpaceBefore: 8 } },
        ],
        { x: M, y: 9.95, w: CW, h: 2.2, margin: 0, valign: "top", isTextBox: true, fontFace: T.theme.headFontFace, bold: true, fontSize: 46, objectName: "Call to share" }
      );
    }
  }

  // ---- Slide 2: Chennai, two columns
  {
    pres.addSection({ title: "Chennai" });
    const s = pres.addSlide({ masterName: "Roles", sectionTitle: "Chennai" });
    s.addText("Chennai", { placeholder: "title" });
    titleRule(s);
    const gutter = 0.6;
    const colW = (CW - gutter) / 2;
    if (key === "editorial") {
      s.addShape("line", { x: M + colW + gutter / 2, y: BODY_Y + 0.1, w: 0, h: H - BODY_Y - 0.1 - M, line: { color: C.background2, width: 0.75 }, objectName: "Column divider" });
    }
    [chennai.left, chennai.right].forEach((col, ci) => {
      const x = M + ci * (colW + gutter);
      let y = BODY_Y + 0.1;
      const lh = groupLabel(s, T, C, col.head, x, y, `Group: ${col.head}`);
      y += lh + 0.35;
      const o = { titleSize: 29, bodySize: 22 };
      const hs = col.roles.map((r) => roleBlock(s, T, C, r, x, y, colW, { ...o, measure: true }));
      const gap = Math.min(0.85, (H - M - y - hs.reduce((a, b) => a + b, 0)) / (col.roles.length - 0.5));
      col.roles.forEach((r, i) => {
        if (i > 0 && key === "editorial") hairline(s, C, x, y - gap / 2, colW, "Divider");
        y += roleBlock(s, T, C, r, x, y, colW, o) + gap;
      });
    });
  }

  // ---- Slide 3: Workday
  {
    pres.addSection({ title: "Workday" });
    const s = pres.addSlide({ masterName: "Roles", sectionTitle: "Workday" });
    s.addText("Workday openings", { placeholder: "title" });
    titleRule(s);
    let y = BODY_Y + 0.1;
    y += groupLabel(s, T, C, "Locations", M, y, "Group: Locations") + 0.3;
    // location chips, flowed left to right
    const chipSize = 23, chipH = 0.7, chipGap = 0.2;
    let cx = M;
    workday.locations.forEach((loc) => {
      const w = (loc.length * chipSize * (T.bodyChar + 0.04)) / 72 + 0.6;
      if (cx + w > M + CW + 0.01) { cx = M; y += chipH + chipGap; }
      s.addText(loc, {
        shape: "roundRect", rectRadius: 0.35, x: cx, y, w, h: chipH, margin: 0, align: "center", valign: "middle",
        fontSize: chipSize, color: C.text1, isTextBox: true,
        fill: { color: key === "editorial" ? C.background1 : C.accent2 },
        line: { color: key === "editorial" ? C.text2 : C.background2, width: 1 },
        objectName: `Location: ${loc}`,
      });
      cx += w + chipGap;
    });
    y += chipH + 0.55;
    y += groupLabel(s, T, C, "Roles", M, y, "Group: Roles") + 0.35;

    const numW = 1.05, tw = CW - numW, tSize = 31, bSize = 23, indH = 0.55;
    const blocks = workday.roles.map((r) => {
      let h = lines(r.title, tSize, tw, T.headChar) * lineH(tSize);
      if (r.sub) h += lines(r.sub, bSize, tw, T.bodyChar) * lineH(bSize) + 6 / 72;
      return h;
    });
    // roles, then the industry line, fill the rest of the slide evenly
    const gap = Math.min(0.75, (H - M - y - indH - blocks.reduce((a, b) => a + b, 0)) / workday.roles.length);
    workday.roles.forEach((r, i) => {
      if (i > 0) hairline(s, C, M, y - gap / 2, CW, "Divider", key === "editorial" ? undefined : C.background2);
      const num = String(i + 1).padStart(2, "0");
      s.addText(num, {
        x: M, y: y - 0.02, w: numW, h: 0.65, margin: 0, valign: "top", isTextBox: true,
        fontFace: T.theme.headFontFace, fontSize: 33, bold: T.headBold, italic: key === "editorial", color: C.accent1, objectName: `Number ${num}`,
      });
      const runs = [{ text: r.title, options: { fontFace: T.theme.headFontFace, fontSize: tSize, bold: true, color: C.text1 } }];
      if (r.sub) {
        runs[0].options.breakLine = true;
        runs.push({ text: r.sub, options: { fontSize: bSize, color: C.text2, paraSpaceBefore: 6 } });
      }
      s.addText(runs, { x: M + numW, y, w: tw, h: blocks[i] + 0.05, margin: 0, valign: "top", isTextBox: true, fontFace: T.theme.bodyFontFace, objectName: `Role: ${r.title}` });
      y += blocks[i] + gap;
    });
    hairline(s, C, M, y - gap / 2, CW, "Divider", key === "editorial" ? undefined : C.background2);
    s.addText(
      [
        { text: "Industry", options: { color: C.text2, fontSize: 23 } },
        { text: "   ", options: { fontSize: 23 } },
        { text: workday.industry, options: { color: C.accent1, bold: true, fontSize: 25 } },
      ],
      { x: M, y, w: CW, h: indH, margin: 0, valign: "top", isTextBox: true, objectName: "Industry" }
    );
  }

  // ---- Slide 4: More roles by city
  {
    pres.addSection({ title: "More roles by city" });
    const s = pres.addSlide({ masterName: "Roles", sectionTitle: "More roles by city" });
    s.addText("More roles by city", { placeholder: "title" });
    titleRule(s);
    const cityW = 2.45;
    const roleX = M + cityW;
    const roleW = CW - cityW;
    const o = { titleSize: 28, bodySize: 22, inlineIndustry: true };
    const inner = 0.32; // between two roles in one city
    let y = BODY_Y + 0.2;
    const groupH = byCity.map((g) =>
      g.roles.reduce((a, r) => a + roleBlock(s, T, C, r, roleX, y, roleW, { ...o, measure: true }), 0) + inner * (g.roles.length - 1)
    );
    const gap = Math.min(0.85, (H - M - y - groupH.reduce((a, b) => a + b, 0)) / (byCity.length - 0.5));
    byCity.forEach((g, gi) => {
      if (gi > 0) hairline(s, C, M, y - gap / 2, CW, "Divider", key === "editorial" ? undefined : C.background2);
      s.addText(T.caps ? g.city.toUpperCase() : g.city, {
        x: M, y: T.caps ? y + 0.04 : y - 0.02, w: cityW - 0.2, h: 0.55, margin: 0, valign: "top", isTextBox: true,
        fontFace: T.theme.headFontFace, fontSize: T.caps ? 21 : 30, bold: true, italic: !T.caps, charSpacing: T.caps ? 1.5 : 0,
        color: C.accent1, objectName: `City: ${g.city}`,
      });
      g.roles.forEach((r, ri) => {
        y += roleBlock(s, T, C, r, roleX, y, roleW, o) + (ri < g.roles.length - 1 ? inner : 0);
      });
      y += gap;
    });
  }

  const out = path.join(outDir, `${T.file}.pptx`);
  await pres.writeFile({ fileName: out });
  await applyTheme(out, T.theme);
  console.log("wrote", out);
}

(async () => {
  const outDir = process.argv[2] || ".";
  for (const k of Object.keys(THEMES)) await build(k, outDir);
})();
