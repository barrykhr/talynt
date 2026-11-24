#!/usr/bin/env python3
"""
The "Meet Talyn" music: a 120 BPM track synthesised from scratch with numpy,
so there is nothing to license. Every scene cut in ad.html lands on a beat.

    python3 ads/meet-talyn/music.py ads/meet-talyn/out/music.wav

- 0–2 s: the hook. Hats, a filtered bass and a riser into the drop.
- 2 s: the drop as Talyn appears. Kick, clap, hats, bass and a chord stab.
- On every cut: a riser into it, then an impact and a stab.
- 33 s: the end card. A big hit, then the track rings out to 38 s.

render.mjs mixes this under the voiceover, and it ducks whenever she speaks.
Needs numpy and soundfile.
"""
import sys

import numpy as np
import soundfile as sf

SR = 48000
BPM = 120
BEAT = 60 / BPM
LENGTH = 38.0
DROP = 2.0
END = 33.0
CUTS = [2.0, 6.0, 11.0, 14.5, 18.0, 21.0, 25.0, 29.5, 33.0]

rng = np.random.default_rng(7)
n = int(LENGTH * SR)
music = np.zeros((n, 2))


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= n:
        return
    sig = sig[: n - i] * gain
    music[i : i + len(sig), 0] += sig * (1 - pan) ** 0.5 if pan > 0 else sig
    music[i : i + len(sig), 1] += sig * (1 + pan) ** 0.5 if pan < 0 else sig


def t(d):
    return np.arange(int(d * SR)) / SR


def kick():
    x = t(0.45)
    f = 48 + 110 * np.exp(-32 * x)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-7 * x) + 0.25 * np.sin(2 * np.pi * 3000 * x) * np.exp(-200 * x)


def noise(d):
    return rng.standard_normal(int(d * SR))


def highpass(x, a=0.85):
    y = np.empty_like(x)
    prev_x = prev_y = 0.0
    for i, v in enumerate(x):
        prev_y = a * (prev_y + v - prev_x)
        prev_x = v
        y[i] = prev_y
    return y


def lowpass(x, a):
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


HAT = highpass(noise(0.06), 0.92) * np.exp(-70 * t(0.06))
OPEN_HAT = highpass(noise(0.25), 0.9) * np.exp(-14 * t(0.25))
CLAP = sum(highpass(noise(0.3), 0.6) * np.exp(-18 * t(0.3)) * (t(0.3) >= k * 0.011) for k in range(3))


def saw(freq, d, bright=1.0):
    x = t(d)
    s = sum(np.sin(2 * np.pi * freq * k * x) / k * (bright ** (k - 1)) for k in range(1, 12))
    return s * 0.6


def bass_note(freq, d):
    x = t(d)
    env = np.minimum(1, x * 200) * np.exp(-3.5 * x)
    return (saw(freq, d, 0.55) + 0.6 * np.sin(2 * np.pi * freq / 2 * x)) * env


def stab(freqs, d=0.6):
    x = t(d)
    env = np.minimum(1, x * 300) * np.exp(-6 * x)
    return sum(saw(f, d, 0.7) for f in freqs) / len(freqs) * env


def riser(d=1.0):
    x = t(d)
    sweep = highpass(noise(d), 0.5)
    tone = np.sin(2 * np.pi * np.cumsum(200 + 1400 * (x / d) ** 2) / SR)
    return (sweep * 0.35 + tone * 0.25) * (x / d) ** 2.2


def impact(d=1.6):
    x = t(d)
    f = 40 + 90 * np.exp(-10 * x)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-3 * x)
    crash = highpass(noise(d), 0.7) * np.exp(-4 * x) * 0.35
    return boom + crash


# A minor feel: A, F, C, G — one chord a bar (four beats).
ROOTS = [55.0, 43.65, 65.41, 49.0]
CHORDS = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]]

beats = int(LENGTH / BEAT)
for b in range(beats):
    at = b * BEAT
    bar = int(at // (4 * BEAT)) % 4
    in_drop = DROP <= at < END
    tail = at >= END
    # hats on every off-beat, all the way through (quiet in the hook and the tail)
    place(HAT, at + BEAT / 2, 0.22 if in_drop else 0.12, pan=0.3)
    if in_drop:
        place(HAT, at, 0.12, pan=-0.3)
        place(kick(), at, 0.95)
        if b % 2 == 1:
            place(CLAP, at, 0.5)
        if b % 4 == 3:
            place(OPEN_HAT, at + BEAT / 2, 0.18)
    # bass on eighths, octave-jumping for bounce
    if at < END + 2 * BEAT:
        root = ROOTS[bar]
        for k, mult in enumerate((1, 2)):
            note = bass_note(root * mult, BEAT / 2 * 0.9)
            if not in_drop:
                note = lowpass(note, 0.05)
            place(note, at + k * BEAT / 2, 0.42 if in_drop else 0.3)

# Risers into each cut, impacts and stabs on them.
for i, c in enumerate(CUTS):
    rd = 1.6 if c in (DROP, END) else 0.9
    place(riser(rd), c - rd, 0.55 if c in (DROP, END) else 0.35)
    place(impact(2.4 if c == END else 1.2), c, 0.9 if c in (DROP, END) else 0.45)
    place(stab([f * 2 for f in CHORDS[int(c // (4 * BEAT)) % 4]]), c, 0.3)

# The end card: one last chord, held.
x = t(LENGTH - END)
place(sum(np.sin(2 * np.pi * f * x) for f in (110, 220, 261.6, 329.6)) / 4 * np.exp(-0.6 * x), END, 0.35)

# Fade in a touch, fade out at the very end, normalise with headroom.
fade_in = np.minimum(1, np.arange(n) / (0.05 * SR))
fade_out = np.clip((LENGTH - np.arange(n) / SR) / 1.2, 0, 1)
music *= (fade_in * fade_out)[:, None]
music = np.tanh(music * 0.9)
music /= np.max(np.abs(music)) / 0.89
sf.write(sys.argv[1], music, SR)
print(f"✓ {sys.argv[1]} ({LENGTH:.1f}s, {BPM} BPM)")
