/**
 * The TALYNT LABS logo system.
 *
 * Four variations, per standard identity practice: a primary lockup, a
 * secondary arrangement for square spaces, a submark for avatars and stamps,
 * and a favicon tuned to survive 16px. The tagline lockup is the primary's
 * endorsed form.
 *
 * Every file in /public/brand is vector outlines — no live text — so the
 * wordmark cannot reflow or substitute a different font anywhere it lands.
 */

export type Colourway = "light" | "dark" | "mono";

export type LogoVariant = {
  id: string;
  index: string;
  name: string;
  role: string;
  use: string;
  avoid: string;
  minimum: string;
  /** Display height on the sheet, in px. */
  height: number;
  ways: Colourway[];
  file: (way: Colourway) => string;
};

export const VARIANTS: LogoVariant[] = [
  {
    id: "primary",
    index: "01",
    name: "Primary",
    role: "The default lockup",
    use: "Website headers, decks, documents, signage — anywhere there is room to show the brand at full width.",
    avoid: "Don't use it below 120px wide; the descriptor stops resolving.",
    minimum: "120px wide",
    height: 56,
    ways: ["light", "dark", "mono"],
    file: (way) => `/brand/talynt-primary-${way}.svg`,
  },
  {
    id: "tagline",
    index: "02",
    name: "Primary with tagline",
    role: "The endorsed lockup",
    use: "First impressions: the homepage footer, a title slide, a cover, an email signature, a stand.",
    avoid: "Don't set it where the tagline would fall below 8px — use the primary instead.",
    minimum: "180px wide",
    height: 84,
    ways: ["light", "dark", "mono"],
    file: (way) => `/brand/talynt-tagline-${way}.svg`,
  },
  {
    id: "stacked",
    index: "03",
    name: "Secondary",
    role: "Stacked, for square and narrow spaces",
    use: "Square ads, app splash screens, merchandise, a narrow sidebar — wherever the horizontal lockup would have to shrink too far.",
    avoid: "Don't stack it when a horizontal lockup would fit. The primary is the default for a reason.",
    minimum: "72px wide",
    height: 132,
    ways: ["light", "dark", "mono"],
    file: (way) => `/brand/talynt-stacked-${way}.svg`,
  },
  {
    id: "submark",
    index: "04",
    name: "Submark",
    role: "The mark alone",
    use: "Social avatars, app icons, a stamp on a document corner, the loading state of the product.",
    avoid: "Don't use it as the first thing an audience ever sees from TALYNT. It stands in for the name; it doesn't teach it.",
    minimum: "24px",
    height: 88,
    ways: ["light", "dark", "mono"],
    file: (way) => `/brand/talynt-submark-${way}.svg`,
  },
];

export const FAVICON = {
  id: "favicon",
  index: "05",
  name: "Favicon",
  role: "The 16px case",
  use: "Browser tabs, bookmarks, and anywhere the mark renders smaller than 24px.",
  minimum: "16px",
  file: "/brand/talynt-favicon.svg",
};

export const PALETTE = [
  { name: "Ink", hex: "#0B0B0D", note: "Frame, wordmark on light" },
  { name: "Paper", hex: "#F5F2EA", note: "Frame on dark, wordmark on dark" },
  { name: "Signal", hex: "#FF4D1C", note: "The node, and the descriptor" },
];
