"""Original score for the showreel, synthesized in code. 120 BPM, Am-F-C-G.
Usage: python films/showreel/music.py out/showreel_audio.wav
SFX cue times mirror the scene list in index.html (cuts on downbeats)."""
import sys, numpy as np, soundfile as sf

SR, BPM, DUR = 48000, 120, 15.0
BEAT = 60 / BPM
N = int(SR * DUR)
mix = np.zeros(N)
rng = np.random.default_rng(7)


def at(sig, t, gain=1.0):
    i = int(round(t * SR))
    if i >= N:
        return
    n = min(len(sig), N - i)
    mix[i:i + n] += sig[:n] * gain


def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def kick():
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.12)


def clap():
    n = int(0.25 * SR)
    noise = rng.standard_normal(n)
    hp = noise - lowpass(noise, 900)
    return hp * env(n, 0.001, 0.06) * 0.6


def hat():
    n = int(0.06 * SR)
    noise = rng.standard_normal(n)
    return (noise - lowpass(noise, 6000)) * env(n, 0.0005, 0.015) * 0.35


def tone(freq, dur, harmonics=6, decay=0.6, cutoff=None):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * freq * h * t) / h for h in range(1, harmonics + 1))
    if cutoff:
        s = lowpass(s, cutoff)
    return s * env(n, 0.01, decay)


def whoosh(length=0.45):
    # rising filtered noise that lands on the cut
    n = int(length * SR); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    for k, c in enumerate(np.linspace(300, 5000, 12)):
        seg = slice(k * n // 12, (k + 1) * n // 12)
        out[seg] = lowpass(noise, c)[seg]
    return out * (t / length) ** 2 * 0.5


def click():
    n = int(0.03 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 2400 * t) * env(n, 0.0003, 0.004) * 0.6


def ding():
    return (tone(1318.5, 0.6, 2, 0.25) + tone(1975.5, 0.6, 1, 0.18) * 0.5) * 0.25


A, F, C, G = 55.0, 43.65, 65.41, 49.0
roots = [A, F, C, G, A, F, C, G]
chords = {A: [220.0, 261.63, 329.63], F: [174.61, 220.0, 261.63],
          C: [196.0, 261.63, 329.63], G: [196.0, 246.94, 293.66]}

for b in range(int(DUR / BEAT)):
    t = b * BEAT
    at(kick(), t, 0.9)
    if b % 2 == 1:
        at(clap(), t, 0.7)
    at(hat(), t + BEAT / 2, 0.6)
    if b % 4 in (1, 3):
        at(hat(), t + BEAT * 0.75, 0.3)

for bar, root in enumerate(roots):
    t = bar * 4 * BEAT
    if t >= DUR:
        break
    for k, off in enumerate([0, 0.75, 1.5, 2, 2.75, 3.5]):
        at(tone(root * (2 if k % 3 == 2 else 1), 0.4, 5, 0.18, 900), t + off * BEAT, 0.55)
    for f in chords[root]:
        at(tone(f, 2.2, 3, 1.2, 2500), t, 0.07)

# SFX on the film's cues
for cut in [2, 4, 6, 8, 10, 12, 14]:
    at(whoosh(), cut - 0.45, 0.5)
at(click(), 6.5)                                       # cursor click on Render
at(ding(), 7.0)                                        # success check
for k in range(18):                                    # wave of flips
    at(click(), 8.0 + k * 0.035, 0.25)
    at(click(), 9.0 + k * 0.035, 0.2)
for i in range(46):                                    # typing
    at(click(), 12.0 + i * 0.021, 0.18)
at(ding(), 14.0, 0.8)

mix = np.tanh(mix * 1.2) * 0.8
sf.write(sys.argv[1], np.stack([mix, mix], 1), SR)
print(f"wrote {sys.argv[1]}")
