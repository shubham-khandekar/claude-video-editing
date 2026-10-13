"""Remove pauses longer than --gap from a talking-head video, using word timings.
Usage: python scripts/cut_silence.py <video> <words.json> <out_dir> [--gap 0.3] [--pad 0.08] [--fps 30]
Writes to out_dir:
  cut.mp4          the tightened video (CFR, original size)
  voice.wav        its audio
  words_cut.json   word timings on the new timeline
  cuts.json        kept segments [{src_s, src_e, dst_s}] and jump-cut times on the new timeline
  face/%05d.jpg    one JPEG per frame for the film to draw (1-based, frame n = t*fps + 1)
"""
import argparse, json, os, subprocess

ap = argparse.ArgumentParser()
ap.add_argument("video"); ap.add_argument("words"); ap.add_argument("out")
ap.add_argument("--gap", type=float, default=0.3); ap.add_argument("--pad", type=float, default=0.08)
ap.add_argument("--fps", type=int, default=30)
a = ap.parse_args()
os.makedirs(os.path.join(a.out, "face"), exist_ok=True)
words = json.load(open(a.words))

# Keep spans of speech; split wherever the silence between words exceeds the gap.
segs = []
for w in words:
    s, e = max(0, w["s"] - a.pad), w["e"] + a.pad
    if segs and s - segs[-1][1] <= a.gap:
        segs[-1][1] = max(segs[-1][1], e)
    else:
        segs.append([s, e])
for i in range(1, len(segs)):                      # pads never overlap
    segs[i][0] = max(segs[i][0], segs[i - 1][1])

kept, t = [], 0.0
for s, e in segs:
    kept.append({"src_s": round(s, 3), "src_e": round(e, 3), "dst_s": round(t, 3)})
    t += e - s
def remap(x):
    for k in kept:
        if k["src_s"] <= x <= k["src_e"]:
            return round(k["dst_s"] + x - k["src_s"], 3)
    return None
words_cut = [{**w, "s": remap(max(w["s"], 0)), "e": remap(w["e"])} for w in words]
json.dump(words_cut, open(os.path.join(a.out, "words_cut.json"), "w"), indent=1, ensure_ascii=False)
json.dump({"duration": round(t, 3), "segments": kept, "jumps": [k["dst_s"] for k in kept[1:]]},
          open(os.path.join(a.out, "cuts.json"), "w"), indent=1)

# trim + concat in one filtergraph
parts, labels = [], ""
for i, k in enumerate(kept):
    parts.append(f"[0:v]trim={k['src_s']}:{k['src_e']},setpts=PTS-STARTPTS,fps={a.fps}[v{i}];"
                 f"[0:a]atrim={k['src_s']}:{k['src_e']},asetpts=PTS-STARTPTS,"
                 f"afade=t=in:d=0.01,afade=t=out:st={k['src_e'] - k['src_s'] - 0.01:.3f}:d=0.01[a{i}]")
    labels += f"[v{i}][a{i}]"
graph = ";".join(parts) + f";{labels}concat=n={len(kept)}:v=1:a=1[v][a]"
cut = os.path.join(a.out, "cut.mp4")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", a.video, "-filter_complex", graph, "-map", "[v]", "-map", "[a]",
                "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", cut], check=True)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", cut, "-vn", "-ac", "1", "-ar", "48000",
                os.path.join(a.out, "voice.wav")], check=True)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", cut, "-q:v", "3",
                os.path.join(a.out, "face", "%05d.jpg")], check=True)
src_len = words[-1]["e"] if words else 0
print(f"kept {len(kept)} segments, {t:.2f}s (removed {max(0, src_len - t):.2f}s of pauses) -> {a.out}")
