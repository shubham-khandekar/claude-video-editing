"""Build a self-contained live preview page for a film: the film's own seek(t) running
in real time, with its music, a scrubber and shot markers. Fonts are subset and inlined,
lib/motion.js and beats.json are inlined, so the page needs no server.

Usage: python scripts/preview.py films/showreel out/showreel_audio.wav out/preview.html
Requires: ffmpeg, fonttools + brotli (pip install fonttools brotli).
"""
import base64, html, io, json, re, subprocess, sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

film, audio, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
root = Path(__file__).resolve().parent.parent
src = (film / "index.html").read_text()
script = re.search(r'<script type="module">(.*?)</script>', src, re.S).group(1)
title = re.search(r"<title>(.*?)</title>", src).group(1)

# Inline the motion library and the beat grid.
motion = (root / "lib/motion.js").read_text().replace("export ", "")
script = re.sub(r"^import .*?from '/lib/motion\.js';\n", motion + "\n", script, flags=re.M)
beats = json.loads((film / "beats.json").read_text())
script = script.replace("fetch('beats.json').then((r) => r.json())", f"Promise.resolve({json.dumps(beats)})")
shots = [m.group(1).strip() for m in re.finditer(r"^// \d+\. ([^:,]+)[:,]", script, re.M)]
dur = float(re.search(r"const DUR = ([\d.]+);", script).group(1))

# Subset fonts to the characters the film can draw.
chars = "".join(chr(c) for c in range(32, 127)) + "→·"
def woff2(path):
    f = TTFont(path)
    s = subset.Subsetter(subset.Options(flavor="woff2", layout_features=["*"]))
    s.populate(text=chars); s.subset(f)
    f.flavor = "woff2"; buf = io.BytesIO(); f.save(buf)
    return base64.b64encode(buf.getvalue()).decode()

weights = {100: "Thin", 200: "ExtraLight", 300: "Light", 400: "Regular", 500: "Medium",
           600: "SemiBold", 700: "Bold", 800: "ExtraBold", 900: "Black"}
faces = [f'@font-face{{font-family:"Inter Display";font-weight:{w};src:url(data:font/woff2;base64,'
         f'{woff2(f"/usr/share/fonts/opentype/inter/InterDisplay-{n}.otf")}) format("woff2")}}'
         for w, n in weights.items()]
faces.append('@font-face{font-family:"DejaVu Sans Mono";font-weight:400;src:url(data:font/woff2;base64,'
             f'{woff2("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf")}) format("woff2")}}')

mp3 = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(audio), "-c:a", "libmp3lame", "-b:a", "160k",
                      "-f", "mp3", "-"], capture_output=True, check=True).stdout
audio_uri = "data:audio/mpeg;base64," + base64.b64encode(mp3).decode()

page = (root / "scripts/preview_template.html").read_text()
for k, v in {"__TITLE__": html.escape(title), "__FACES__": "\n".join(faces), "__FILM__": script,
             "__AUDIO__": audio_uri, "__SHOTS__": json.dumps(shots), "__DUR__": str(dur),
             "__SHOT_LEN__": str(4 * 60 / beats["bpm"])}.items():
    page = page.replace(k, v)
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(page)
print(f"wrote {out} ({len(page) / 1e6:.2f} MB, {len(shots)} shots)")
