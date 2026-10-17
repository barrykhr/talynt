// Builds the "Open Roles Across India" LinkedIn carousel in four themes.
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
// dk1 = main text, lt1 = page background (every deck), so tx1/bg1 map correctly.
// accent1 is always the accent used for text. Style colours below name scheme slots.
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
    roleTitleFont: "head",
    // average glyph width of the role-title / body fonts as a fraction of point size, for wrap estimates
    headChar: 0.45, bodyChar: 0.415,
    style: {
      cover: "editorial",
      label: { kind: "text", color: "accent1", caps: true },
      chip: { fill: "background1", line: "text2" },
      divider: "background2",
      titleRule: true, colDivider: true, roleDividers: true,
      city: { kind: "text", font: "head", size: 30, bold: true, italic: true },
      numItalic: true,
    },
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
    roleTitleFont: "head",
    headChar: 0.49, bodyChar: 0.47,
    style: {
      cover: "night",
      label: { kind: "pill", fill: "accent1", text: "background1", radius: 0.24, caps: true },
      chip: { fill: "accent2", line: "background2" },
      divider: "background2",
      roleDividers: false,
      city: { kind: "text", font: "head", size: 21, bold: true, caps: true },
    },
  },
  // Inspired by ElevenLabs: near-white, black type, black pill buttons, soft pastel orb.
  studio: {
    file: "open-roles-india-studio",
    theme: {
      name: "Studio",
      headFontFace: "Arial",
      bodyFontFace: "Arial",
      colors: {
        dk1: "000000", lt1: "FDFCFC", dk2: "67645F", lt2: "E4E1DC",
        accent1: "000000", accent2: "F3F1EE", accent3: "A9C5FF", accent4: "FFC9A8",
        accent5: "D9C8FF", accent6: "BEECE2", hlink: "000000", folHlink: "67645F",
      },
    },
    headBold: false,
    titleSize: 72,
    roleTitleFont: "head",
    headChar: 0.49, bodyChar: 0.47,
    style: {
      cover: "studio",
      label: { kind: "pill", fill: "text1", text: "background1", radius: 0.25 },
      chip: { fill: "accent2", line: null },
      divider: "background2",
      roleDividers: true,
      city: { kind: "text", font: "body", size: 26, bold: false },
    },
  },
  // Inspired by Wispr Flow: warm ivory, near-black ink, lavender and khaki, Garamond display type.
  flow: {
    file: "open-roles-india-flow",
    theme: {
      name: "Flow",
      headFontFace: "Garamond",
      bodyFontFace: "Arial",
      colors: {
        dk1: "1A1A1A", lt1: "FFFFEB", dk2: "56564B", lt2: "D9D9C0",
        accent1: "6A3D9A", accent2: "F0D7FF", accent3: "E4E4D0", accent4: "1A1A1A",
        accent5: "C9A6E8", accent6: "F4F4DC", hlink: "6A3D9A", folHlink: "56564B",
      },
    },
    headBold: false,
    titleSize: 84,
    roleTitleFont: "body",
    headChar: 0.49, bodyChar: 0.47,
    style: {
      cover: "flow",
      label: { kind: "pill", fill: "accent2", text: "text1", line: "text1", radius: 0.12 },
      chip: { fill: "accent3", line: null },
      divider: "background2",
      roleDividers: true,
      city: { kind: "pill", fill: "accent2", text: "text1", line: "text1", radius: 0.12, size: 20 },
      numItalic: true,
    },
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
const roleFont = (T) => (T.roleTitleFont === "head" ? T.theme.headFontFace : T.theme.bodyFontFace);

// A role block: title, then "meta · industry" or separate lines. Returns height.
function roleBlock(slide, T, C, r, x, y, w, opts = {}) {
  const tSize = opts.titleSize;
  const body = opts.bodySize;
  const gap = 4; // pt before each body paragraph
  const runs = [
    { text: r.title, options: { fontFace: roleFont(T), fontSize: tSize, bold: true, color: C.text1, breakLine: true } },
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
  slide.addShape("line", { x, y, w, h: 0, line: { color, width: 0.75 }, objectName: name });
}

// A pill with text sized to fit it. Returns its height.
function pill(slide, C, p, text, x, y, size, name) {
  const t = p.caps ? text.toUpperCase() : text;
  const w = (t.length * size * (p.caps ? 0.66 : 0.56)) / 72 + 0.5;
  const h = size >= 20 ? 0.5 : 0.48;
  slide.addText(t, {
    shape: "roundRect", rectRadius: p.radius, x, y, w, h, fill: { color: C[p.fill] },
    line: p.line ? { color: C[p.line], width: 0.75 } : { type: "none" },
    color: C[p.text], bold: true, fontSize: size, charSpacing: p.caps ? 1.5 : 0, align: "center", valign: "middle",
    margin: 0, isTextBox: true, objectName: name,
  });
  return h;
}

// Small group label: plain small caps text, or a pill.
function groupLabel(slide, T, C, text, x, y, name) {
  const L = T.style.label;
  if (L.kind === "pill") return pill(slide, C, L, text, x, y, 20, name);
  slide.addText(text.toUpperCase(), {
    x, y, w: CW, h: 0.48, margin: 0, color: C[L.color], bold: true, fontSize: 20, charSpacing: 3,
    valign: "middle", isTextBox: true, objectName: name,
  });
  return 0.5;
}

// ---------------------------------------------------------------- covers (exact copy only)
const COVERS = {
  editorial(s, T, C) {
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
  },
  night(s, T, C) {
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
  },
  studio(s, T, C) {
    s.addImage({ path: path.join(__dirname, "assets", "studio-orb.png"), x: 5.2, y: 0.8, w: 4.8, h: 4.8, altText: "Decorative pastel gradient orb", objectName: "Pastel orb" });
    s.addText("Open Roles Across India.", {
      x: M, y: 4.6, w: CW, h: 4.8, margin: 0, valign: "bottom", isTextBox: true,
      fontFace: T.theme.headFontFace, fontSize: 104, color: C.text1, lineSpacingMultiple: 0.9, objectName: "Headline",
    });
    s.addText("Know someone who may fit?", {
      x: M, y: 9.95, w: CW, h: 0.8, margin: 0, valign: "top", isTextBox: true, fontSize: 42, color: C.text2, objectName: "Question",
    });
    s.addText("Share this post.", {
      shape: "roundRect", rectRadius: 0.55, x: M, y: 11.0, w: 5.0, h: 1.1, fill: { color: C.text1 }, line: { type: "none" },
      color: C.background1, fontSize: 38, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: "Share button",
    });
  },
  flow(s, T, C) {
    s.addShape("roundRect", { x: 0.55, y: 0.55, w: W - 1.1, h: 8.7, rectRadius: 0.35, fill: { color: C.accent2 }, line: { type: "none" }, objectName: "Lavender card" });
    s.addText("Open Roles Across India.", {
      x: M + 0.15, y: 1.2, w: CW - 0.3, h: 7.5, margin: 0, valign: "bottom", isTextBox: true,
      fontFace: T.theme.headFontFace, fontSize: 124, color: C.text1, lineSpacingMultiple: 0.88, objectName: "Headline",
    });
    s.addText(
      [
        { text: "Know someone who may fit?", options: { fontFace: T.theme.bodyFontFace, fontSize: 40, color: C.text1, breakLine: true } },
        { text: "Share this post.", options: { fontFace: T.theme.headFontFace, fontSize: 60, italic: true, color: C.accent1, paraSpaceBefore: 12 } },
      ],
      { x: M + 0.15, y: 9.85, w: CW - 0.3, h: 2.6, margin: 0, valign: "top", isTextBox: true, objectName: "Call to share" }
    );
  },
};

// ---------------------------------------------------------------- build
async function build(key, outDir) {
  const T = THEMES[key];
  const S = T.style;
  const pres = new pptxgen();
  pres.defineLayout({ name: "CAROUSEL_4x5", width: W, height: H });
  pres.layout = "CAROUSEL_4x5";
  pres.theme = { headFontFace: T.theme.headFontFace, bodyFontFace: T.theme.bodyFontFace };
  pres.title = "Open Roles Across India";
  const C = pres.SchemeColor;
  const bg = { color: T.theme.colors.lt1 };
  const divider = C[S.divider];

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
    if (S.titleRule) hairline(s, C, M, TITLE_RULE_Y, CW, "Title rule", C.text1);
  };

  // ---- Slide 1: cover
  {
    pres.addSection({ title: "Cover" });
    const s = pres.addSlide({ masterName: "Cover", sectionTitle: "Cover" });
    COVERS[S.cover](s, T, C);
  }

  // ---- Slide 2: Chennai, two columns
  {
    pres.addSection({ title: "Chennai" });
    const s = pres.addSlide({ masterName: "Roles", sectionTitle: "Chennai" });
    s.addText("Chennai", { placeholder: "title" });
    titleRule(s);
    const gutter = 0.6;
    const colW = (CW - gutter) / 2;
    if (S.colDivider) {
      s.addShape("line", { x: M + colW + gutter / 2, y: BODY_Y + 0.1, w: 0, h: H - BODY_Y - 0.1 - M, line: { color: divider, width: 0.75 }, objectName: "Column divider" });
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
        if (i > 0 && S.roleDividers) hairline(s, C, x, y - gap / 2, colW, "Divider", divider);
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
        fill: { color: C[S.chip.fill] },
        line: S.chip.line ? { color: C[S.chip.line], width: 1 } : { type: "none" },
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
      if (i > 0) hairline(s, C, M, y - gap / 2, CW, "Divider", divider);
      const num = String(i + 1).padStart(2, "0");
      s.addText(num, {
        x: M, y: y - 0.02, w: numW, h: 0.65, margin: 0, valign: "top", isTextBox: true,
        fontFace: T.theme.headFontFace, fontSize: 33, bold: T.headBold, italic: !!S.numItalic, color: C.accent1, objectName: `Number ${num}`,
      });
      const runs = [{ text: r.title, options: { fontFace: roleFont(T), fontSize: tSize, bold: true, color: C.text1 } }];
      if (r.sub) {
        runs[0].options.breakLine = true;
        runs.push({ text: r.sub, options: { fontSize: bSize, color: C.text2, paraSpaceBefore: 6 } });
      }
      s.addText(runs, { x: M + numW, y, w: tw, h: blocks[i] + 0.05, margin: 0, valign: "top", isTextBox: true, fontFace: T.theme.bodyFontFace, objectName: `Role: ${r.title}` });
      y += blocks[i] + gap;
    });
    hairline(s, C, M, y - gap / 2, CW, "Divider", divider);
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
    const city = S.city;
    byCity.forEach((g, gi) => {
      if (gi > 0) hairline(s, C, M, y - gap / 2, CW, "Divider", divider);
      if (city.kind === "pill") {
        pill(s, C, city, g.city, M, y - 0.02, city.size, `City: ${g.city}`);
      } else {
        s.addText(city.caps ? g.city.toUpperCase() : g.city, {
          x: M, y: city.caps ? y + 0.04 : y - 0.02, w: cityW - 0.2, h: 0.55, margin: 0, valign: "top", isTextBox: true,
          fontFace: city.font === "head" ? T.theme.headFontFace : T.theme.bodyFontFace, fontSize: city.size,
          bold: city.bold, italic: !!city.italic, charSpacing: city.caps ? 1.5 : 0,
          color: C.accent1, objectName: `City: ${g.city}`,
        });
      }
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
  const only = process.argv.slice(3);
  for (const k of Object.keys(THEMES)) if (!only.length || only.includes(k)) await build(k, outDir);
})();
