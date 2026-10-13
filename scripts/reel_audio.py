"""Mix a talking-head reel: voice + subtle SFX on key beats + a soft bed ducked under the voice.
Usage: python scripts/reel_audio.py <voice.wav> <cues.json> <out.wav> [--bed none|soft|<file.wav>] [--sfx-db -15]
Cue kinds: pop, click, tick, ding, type, whoosh. Cues closer than 0.12s to the previous one are dropped.
Loudness is set to -14 LUFS afterwards by scripts/mix.sh.
"""
import argparse, json
import numpy as np, soundfile as sf

ap = argparse.ArgumentParser()
ap.add_argument("voice"); ap.add_argument("cues"); ap.add_argument("out")
ap.add_argument("--bed", default="soft"); ap.add_argument("--sfx-db", type=float, default=-15)
a = ap.parse_args()

voice, SR = sf.read(a.voice, always_2d=True); voice = voice.mean(1)
N = len(voice); rng = np.random.default_rng(3)
voice = voice / (np.abs(voice).max() + 1e-9) * 0.8
t = lambda n: np.arange(n) / SR
env = lambda n, a_, d: np.minimum(1, t(n) / a_) * np.exp(-t(n) / d)

def sfx(kind):
    if kind == "pop":
        n = int(.09 * SR); f = 900 * np.exp(-t(n) / .03) + 300; return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .001, .03)
    if kind == "click":
        n = int(.03 * SR); return np.sin(2 * np.pi * 2600 * t(n)) * env(n, .0003, .004)
    if kind == "tick":
        n = int(.05 * SR); return np.sin(2 * np.pi * 1800 * t(n)) * env(n, .0005, .012)
    if kind == "ding":
        n = int(.6 * SR); return (np.sin(2 * np.pi * 1318.5 * t(n)) + .5 * np.sin(2 * np.pi * 1975.5 * t(n))) * env(n, .002, .2) * .7
    if kind == "type":
        out = np.zeros(int(.5 * SR))
        for k in range(10):
            n = int(.02 * SR); i = int(k * .05 * SR + rng.uniform(0, .01) * SR)
            out[i:i + n] += rng.standard_normal(n) * env(n, .0003, .003) * .5
        return out
    if kind == "whoosh":
        n = int(.35 * SR); x = rng.standard_normal(n); x = np.convolve(x, np.ones(24) / 24, "same")
        return x * np.sin(np.pi * t(n) / .35) ** 2 * 2
    raise ValueError(kind)

fx = np.zeros(N); last = -1
for c in json.load(open(a.cues)):
    if c["t"] - last < 0.12: continue
    last = c["t"]; s = sfx(c["kind"]); i = int(c["t"] * SR)
    if i >= N: continue
    s = s[: N - i]; fx[i:i + len(s)] += s / (np.abs(s).max() + 1e-9)
fx *= 0.8 * 10 ** (a.sfx_db / 20)

bed = np.zeros(N)
if a.bed == "soft":                         # warm pad, A minor -> F, 8s per chord
    for k, chord in enumerate(([220, 261.63, 329.63], [174.61, 220, 261.63]) * int(N / SR / 16 + 1)):
        i0 = int(k * 8 * SR); n = min(int(8.5 * SR), N - i0)
        if n <= 0: break
        tt = t(n); seg = sum(np.sin(2 * np.pi * f * tt) + .3 * np.sin(4 * np.pi * f * tt) for f in chord)
        bed[i0:i0 + n] += seg * np.minimum(1, tt / 1.5) * np.minimum(1, (8.5 - tt) / 1.5)
    bed = bed / (np.abs(bed).max() + 1e-9) * 0.1
elif a.bed != "none":
    b, bsr = sf.read(a.bed, always_2d=True); b = b.mean(1)
    if bsr != SR: b = np.interp(np.arange(int(len(b) * SR / bsr)) * bsr / SR, np.arange(len(b)), b)
    b = np.tile(b, N // len(b) + 1)[:N]; bed = b / (np.abs(b).max() + 1e-9) * 0.15
# duck the bed under speech
win = int(.05 * SR); level = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, "same"))
duck = 1 - 0.7 * np.clip(level / (level.max() * .25 + 1e-9), 0, 1)
duck = np.convolve(duck, np.ones(int(.2 * SR)) / int(.2 * SR), "same")
mix = np.tanh((voice + fx + bed * duck) * 1.1) * .9
sf.write(a.out, mix, SR)
print(f"mixed {N / SR:.2f}s -> {a.out}")
