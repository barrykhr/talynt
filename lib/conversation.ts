import type { SignalStrength } from "@/components/primitives/SignalBadge";

export type SignalId =
  | "motivation"
  | "ownership"
  | "communication"
  | "learning"
  | "leadership"
  | "intent";

export type ConversationSignal = {
  id: SignalId;
  label: string;
  strength: SignalStrength;
  reading: string;
};

/**
 * Illustrative sample content. The strengths are deliberately uneven —
 * an evaluation where every reading is "strong" is a sales deck, not a signal.
 */
export const CONVERSATION_SIGNALS: ConversationSignal[] = [
  {
    id: "motivation",
    label: "Motivation",
    strength: "strong",
    reading: "Wants influence over what gets built, not only how it gets built.",
  },
  {
    id: "ownership",
    label: "Ownership",
    strength: "strong",
    reading: "Treats scope as something to take responsibility for, not receive.",
  },
  {
    id: "communication",
    label: "Communication",
    strength: "strong",
    reading: "Answers directly. Qualifies claims rather than inflating them.",
  },
  {
    id: "learning",
    label: "Learning",
    strength: "solid",
    reading: "Names a specific gap and the way they intend to close it.",
  },
  {
    id: "leadership",
    label: "Leadership",
    strength: "emerging",
    reading: "Has mentored engineers. Has not yet carried a team or headcount.",
  },
  {
    id: "intent",
    label: "Career intent",
    strength: "strong",
    reading: "A two-to-three year horizon, described without being asked for one.",
  },
];

export type Segment = { text: string; signal?: SignalId };

export type Exchange = {
  speaker: "Recruiter" | "Candidate 0148";
  timestamp: string;
  segments: Segment[];
};

export const TRANSCRIPT: Exchange[] = [
  {
    speaker: "Recruiter",
    timestamp: "00:04:12",
    segments: [
      {
        text: "What are you hoping your next role gives you that your current role doesn't?",
      },
    ],
  },
  {
    speaker: "Candidate 0148",
    timestamp: "00:04:19",
    segments: [
      { text: "I've shipped a lot in the last two years, but " },
      { text: "most of it was scoped by somebody else", signal: "ownership" },
      { text: ". I'm good at execution and I don't want to stop being close to the code. " },
      {
        text: "What I'm missing is being in the room when we decide what we're building, and why",
        signal: "motivation",
      },
      { text: ". " },
      {
        text: "The roadmap used to arrive finished. I'd like to be somewhere small enough that I can argue with it",
        signal: "motivation",
      },
      { text: "." },
    ],
  },
  {
    speaker: "Recruiter",
    timestamp: "00:06:48",
    segments: [{ text: "What would you need to learn to do that well?" }],
  },
  {
    speaker: "Candidate 0148",
    timestamp: "00:06:55",
    segments: [
      {
        text: "I can defend a technical trade-off. I'm weaker at defending a commercial one",
        signal: "communication",
      },
      { text: " — " },
      {
        text: "I've started sitting in on customer calls to fix that, and it's changed how I estimate",
        signal: "learning",
      },
      { text: ". " },
      {
        text: "I've mentored three engineers, but I've never carried a team's headcount and I wouldn't pretend otherwise",
        signal: "leadership",
      },
      { text: ". " },
      {
        text: "In two or three years I'd want to be the person accountable for a product area, not a job title",
        signal: "intent",
      },
      { text: "." },
    ],
  },
];
