#!/usr/bin/env python3
"""
Generates the ad's voiceover from vo.json with Kokoro (an open-source,
Apache-2.0 text-to-speech model that runs locally, so no script or key leaves
the machine), and places each line at its time in the ad.

    python3 -m venv .venv && .venv/bin/pip install kokoro-onnx soundfile
    # model files (~350 MB) from github.com/thewh1teagle/kokoro-onnx releases:
    #   kokoro-v1.0.onnx and voices-v1.0.bin
    .venv/bin/python ads/meet-talyn/voiceover.py <model dir> ads/meet-talyn/out/voiceover.wav

`say` is the text as spoken: "Talin" and "Talent Labs" so the names are
pronounced the way TALYNT says them, "J.D." and "A.I." as letters. The voice is
Kokoro's Indian English female voice (hf_beta). For a studio voice, record the
same lines (see ads/voice/ELEVENLABS.md) and pass that file as VOICEOVER instead.
"""
import json, os, subprocess, sys, tempfile

import soundfile as sf
from kokoro_onnx import Kokoro

here = os.path.dirname(os.path.abspath(__file__))
model_dir, out = sys.argv[1], sys.argv[2]
cfg = json.load(open(os.path.join(here, "vo.json")))
k = Kokoro(os.path.join(model_dir, "kokoro-v1.0.onnx"), os.path.join(model_dir, "voices-v1.0.bin"))

with tempfile.TemporaryDirectory() as tmp:
    inputs, chain = [], []
    for i, line in enumerate(cfg["lines"]):
        audio, sr = k.create(line["say"], voice=cfg["voice"], speed=cfg["speed"], lang="en-us")
        path = os.path.join(tmp, f"{i:02d}.wav")
        sf.write(path, audio, sr)
        end = line["at"] + len(audio) / sr
        nxt = cfg["lines"][i + 1]["at"] if i + 1 < len(cfg["lines"]) else None
        print(f"{line['at']:5.1f}s → {end:5.2f}s  {line['text']}")
        if nxt is not None and end > nxt - 0.15:
            sys.exit(f"line {i} runs into the next one ({end:.2f}s > {nxt}s): shorten it or move it")
        ms = round(line["at"] * 1000)
        inputs += ["-i", path]
        chain.append(f"[{i}:a]adelay={ms}|{ms}[l{i}]")
    n = len(cfg["lines"])
    mix = "".join(f"[l{i}]" for i in range(n))
    chain.append(f"{mix}amix=inputs={n}:normalize=0,aresample=48000[out]")
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(chain), "-map", "[out]", out], check=True)
print(f"✓ {out}")
