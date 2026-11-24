#!/usr/bin/env python3
"""
The "Human in the loop" music: a 120 BPM funk groove, synthesised from scratch
with numpy (nothing to license). Cuts in ad.html land on its beats.

    python3 ads/human-loop/music.py ads/human-loop/out/music.wav

- Swung 16th hats, a kick on 1 and the "and" of 2, claps on 2 and 4, ghost snares.
- A syncopated, octave-popping slap-style bass and a cowbell.
- Wah-style chord stabs on the off-beats.
- A brass-style hit every time the human voice comes in (HUMAN), so the
  hand-off from Talyn to a person is something you hear.
- 0–3 s: hats and filtered bass only; 3 s: the drop. 42.5 s: the end card.

Needs numpy and soundfile.
"""
import sys

import numpy as np
import soundfile as sf

SR = 48000
BEAT = 0.5
SWING = 0.035
LENGTH = 47.0
DROP = 3.0
END = 42.5
CUTS = [3.0, 7.5, 11.5, 16.5, 21.0, 25.5, 31.0, 35.5, 39.0, 42.5]
HUMAN = [5.13, 9.3, 14.15, 18.6, 23.23, 28.0, 32.99, 37.36, 40.96]

rng = np.random.default_rng(11)
n = int(LENGTH * SR)
mix = np.zeros((n, 2))


def t(d):
    return np.arange(int(d * SR)) / SR


def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= n or i < 0:
        return
    sig = sig[: n - i] * gain
    mix[i : i + len(sig), 0] += sig * min(1, 1 - pan)
    mix[i : i + len(sig), 1] += sig * min(1, 1 + pan)


def onepole(x, a, high=False):
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = v - acc if high else acc
    return y


def noise(d):
    return rng.standard_normal(int(d * SR))


def saw(f, d, bright=0.7, harmonics=14):
    x = t(d)
    return sum(np.sin(2 * np.pi * f * k * x) / k * bright ** (k - 1) for k in range(1, harmonics))


def kick():
    x = t(0.4)
    f = 50 + 120 * np.exp(-35 * x)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-8 * x)


HAT = onepole(noise(0.05), 0.6, high=True) * np.exp(-90 * t(0.05))
OPEN = onepole(noise(0.22), 0.6, high=True) * np.exp(-15 * t(0.22))
CLAP = sum(onepole(noise(0.25), 0.35, high=True) * np.exp(-20 * t(0.25)) * (t(0.25) >= k * 0.01) for k in range(3))
GHOST = onepole(noise(0.08), 0.3, high=True) * np.exp(-45 * t(0.08))


def cowbell():
    x = t(0.18)
    return (np.sign(np.sin(2 * np.pi * 562 * x)) + np.sign(np.sin(2 * np.pi * 845 * x))) * 0.25 * np.exp(-22 * x)


def bass(f, d):
    x = t(d)
    pluck = saw(f, d, 0.6) * np.exp(-9 * x) + 0.8 * np.sin(2 * np.pi * f * x) * np.exp(-4 * x)
    return pluck * np.minimum(1, x * 400)


def wah(freqs, d=0.28):
    x = t(d)
    s = sum(saw(f, d, 0.82, 18) for f in freqs) / len(freqs)
    # a crude "wah": blend from dark to bright and back over the note
    dark = onepole(s, 0.08)
    sweep = np.sin(np.pi * np.minimum(1, x / d))
    return (dark * (1 - sweep) + s * sweep) * np.exp(-6 * x) * np.minimum(1, x * 300)


def brass(freqs, d=0.55):
    x = t(d)
    env = np.minimum(1, x * 60) * np.exp(-3.2 * x)
    s = sum(saw(f * (1 + 0.004 * k), d, 0.78, 16) for k, f in enumerate(freqs)) / len(freqs)
    return s * env


def riser(d):
    x = t(d)
    tone = np.sin(2 * np.pi * np.cumsum(220 + 1500 * (x / d) ** 2) / SR)
    return (onepole(noise(d), 0.4, high=True) * 0.4 + tone * 0.25) * (x / d) ** 2.2


def impact(d=1.2):
    x = t(d)
    f = 42 + 90 * np.exp(-10 * x)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-3.5 * x) + onepole(noise(d), 0.5, high=True) * np.exp(-5 * x) * 0.3


# E minor funk: E, E, G, A — a bar each.
ROOTS = [41.2, 41.2, 49.0, 55.0]
CHORDS = [[329.6, 392.0, 493.9, 587.3], [329.6, 392.0, 493.9, 587.3], [392.0, 493.9, 587.3, 740.0], [440.0, 523.3, 659.3, 784.0]]
# 16th-step bass pattern (1 = note, 2 = octave pop), per bar.
BASS = [1, 0, 0, 1, 0, 0, 2, 0, 1, 0, 1, 0, 0, 2, 0, 1]

six = BEAT / 4
steps = int(LENGTH / six)
for i in range(steps):
    at = i * six + (SWING if i % 2 else 0)
    bar = int((i // 16)) % 4
    pos = i % 16
    groove = DROP <= at < END
    tail = at >= END
    if tail and at > END + 2:
        break
    place(HAT, at, (0.2 if pos % 2 == 0 else 0.11) * (1 if groove else 0.7), pan=0.35)
    if not groove:
        if pos in (0, 6, 10) and not tail:
            place(onepole(bass(ROOTS[bar], six * 1.6), 0.06), at, 0.4)
        continue
    if pos in (0, 6, 10):
        place(kick(), at, 0.95)
    if pos in (4, 12):
        place(CLAP, at, 0.55)
    if pos in (7, 15):
        place(GHOST, at, 0.16, pan=-0.2)
    if pos == 14:
        place(OPEN, at, 0.16, pan=0.35)
    if pos in (2, 10):
        place(cowbell(), at, 0.12, pan=-0.45)
    if BASS[pos]:
        f = ROOTS[bar] * (2 if BASS[pos] == 2 else 1)
        place(bass(f, six * 1.5), at, 0.5)
    if pos in (2, 6, 11, 14):
        place(wah(CHORDS[bar]), at, 0.16, pan=0.25 if pos % 2 else -0.25)

for c in CUTS:
    big = c in (DROP, END)
    d = 1.5 if big else 0.8
    place(riser(d), c - d, 0.5 if big else 0.3)
    place(impact(2.2 if c == END else 1.2), c, 0.85 if big else 0.4)

for h in HUMAN:
    bar = int(h // (4 * BEAT)) % 4
    place(brass([f / 2 for f in CHORDS[bar][:3]]), h - 0.02, 0.32)

x = t(LENGTH - END)
place(sum(np.sin(2 * np.pi * f * x) for f in (82.4, 164.8, 196.0, 246.9, 329.6)) / 5 * np.exp(-0.55 * x), END, 0.4)
place(brass([164.8, 196.0, 246.9, 329.6], 1.4), END, 0.35)

fade = np.clip((LENGTH - np.arange(n) / SR) / 1.4, 0, 1) * np.minimum(1, np.arange(n) / (0.05 * SR))
mix *= fade[:, None]
mix = np.tanh(mix * 0.9)
mix /= np.max(np.abs(mix)) / 0.89
sf.write(sys.argv[1], mix, SR)
print(f"✓ {sys.argv[1]} ({LENGTH:.0f}s, 120 BPM funk)")
