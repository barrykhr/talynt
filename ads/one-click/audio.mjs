/**
 * The ad's sound design, synthesised with ffmpeg — no samples, no licensed
 * music. Every cue lines up with a moment in ad.html:
 *
 *   a low pulse under everything; a whoosh at each scene flip; the click on
 *   "Find talent"; a chime as the shortlist rises; message pings for WhatsApp,
 *   the email and the follow-up nudges; soft ticks as touchpoints complete;
 *   and a low hit on the end card.
 */
import { execFileSync } from "node:child_process";

const FLIPS = [2.45, 5.25, 7.85, 10.45, 12.65, 14.85, 17.25];
const CUES = [
  // [at seconds, kind]
  [1.2, "click"],
  [3.4, "ping-soft"],
  [6.3, "chime"],
  [8.5, "ping"],
  [9.0, "ping"],
  [9.3, "tick"],
  [10.15, "ping-in"],
  [11.0, "tick"],
  [11.22, "tick"],
  [11.44, "tick"],
  [11.66, "tick"],
  [11.88, "tick"],
  [13.4, "ping"],
  [13.75, "ping"],
  [14.1, "ping"],
  [15.5, "chime"],
  [17.4, "hit"],
  [18.35, "ping-soft"],
];

const SOUNDS = {
  click: { d: 0.12, e: "0.7*sin(2*PI*2600*t)*exp(-70*t)+0.4*sin(2*PI*900*t)*exp(-40*t)" },
  tick: { d: 0.1, e: "0.35*sin(2*PI*3200*t)*exp(-60*t)" },
  ping: { d: 0.45, e: "0.32*(sin(2*PI*1318*t)+0.55*sin(2*PI*1976*t))*exp(-11*t)" },
  "ping-in": { d: 0.5, e: "0.32*(sin(2*PI*988*t)+0.55*sin(2*PI*1480*t))*exp(-10*t)" },
  "ping-soft": { d: 0.6, e: "0.18*(sin(2*PI*880*t)+0.5*sin(2*PI*1320*t))*exp(-7*t)" },
  chime: { d: 1.6, e: "0.22*(sin(2*PI*659*t)+sin(2*PI*880*t)+0.7*sin(2*PI*1319*t)+0.4*sin(2*PI*1760*t))*exp(-2.6*t)" },
  hit: { d: 2.2, e: "0.9*sin(2*PI*(46+70*exp(-9*t))*t)*exp(-2.2*t)+0.12*sin(2*PI*1760*t)*exp(-3*t)" },
};

/**
 * `voiceover` (optional): a recorded voiceover (see ads/voice/ELEVENLABS.md).
 * The music and effects duck under it automatically. `flips` and `cues` let
 * another ad (ads/meet-talyn) reuse the same sounds on its own timeline.
 */
export function renderAudio(file, seconds, voiceover, { flips = FLIPS, cues = CUES } = {}) {
  const inputs = [];
  const graph = [];
  let n = 0;
  const add = (args, label) => {
    inputs.push(...args);
    graph.push(label(n));
    n++;
  };

  // The bed: a soft, slowly pulsing low tone.
  add(
    ["-f", "lavfi", "-i", `aevalsrc='0.10*sin(2*PI*55*t)*(0.65+0.35*sin(2*PI*0.5*t))+0.05*sin(2*PI*110*t)':s=48000:d=${seconds}`],
    (i) => `[${i}:a]afade=t=in:d=0.8,afade=t=out:st=${seconds - 1.4}:d=1.4[a${i}]`,
  );

  // Whooshes: shaped pink noise, one per flip.
  for (const at of flips) {
    add(["-f", "lavfi", "-i", "anoisesrc=color=pink:amplitude=0.5:d=0.55:r=48000"], (i) =>
      `[${i}:a]highpass=f=500,lowpass=f=5000,afade=t=in:d=0.3:curve=exp,afade=t=out:st=0.3:d=0.25,volume=0.35,adelay=${Math.round(at * 1000)}|${Math.round(at * 1000)}[a${i}]`,
    );
  }

  for (const [at, kind] of cues) {
    const s = SOUNDS[kind];
    add(["-f", "lavfi", "-i", `aevalsrc='${s.e}':s=48000:d=${s.d}`], (i) =>
      `[${i}:a]adelay=${Math.round(at * 1000)}|${Math.round(at * 1000)}[a${i}]`,
    );
  }

  const mix = Array.from({ length: n }, (_, i) => `[a${i}]`).join("");
  if (voiceover) {
    inputs.push("-i", voiceover);
    graph.push(`${mix}amix=inputs=${n}:normalize=0:duration=longest,aformat=channel_layouts=stereo[fx]`);
    graph.push(`[${n}:a]aresample=48000,aformat=channel_layouts=stereo,volume=1.6,apad=whole_dur=${seconds},asplit=2[vo][key]`);
    graph.push(`[fx][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=300[duck]`);
    graph.push(`[duck][vo]amix=inputs=2:normalize=0:duration=first,atrim=0:${seconds},loudnorm=I=-16:TP=-1.5:LRA=11[out]`);
  } else {
    graph.push(`${mix}amix=inputs=${n}:normalize=0:duration=longest,atrim=0:${seconds},aformat=channel_layouts=stereo,loudnorm=I=-16:TP=-1.5:LRA=11[out]`);
  }

  execFileSync("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", graph.join(";"), "-map", "[out]", "-ar", "48000", file]);
}
