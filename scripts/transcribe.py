"""Transcribe a talking-head video to word-level timings with faster-whisper.
Usage: python scripts/transcribe.py <video> <out_words.json> [--model small] [--lang en]
Writes [{"w": word, "s": start, "e": end}, ...]. Fix spellings by hand afterwards and keep the timings.
Models download from huggingface.co on first use (allow it in the environment's network settings).
"""
import argparse, json
from faster_whisper import WhisperModel

ap = argparse.ArgumentParser()
ap.add_argument("video"); ap.add_argument("out")
ap.add_argument("--model", default="small"); ap.add_argument("--lang", default=None)
a = ap.parse_args()

model = WhisperModel(a.model, device="cpu", compute_type="int8")
segments, info = model.transcribe(a.video, language=a.lang, word_timestamps=True, vad_filter=True)
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)}
         for seg in segments for w in seg.words if w.word.strip()]
json.dump(words, open(a.out, "w"), indent=1, ensure_ascii=False)
print(f"{len(words)} words, language {info.language} ({info.language_probability:.2f}) -> {a.out}")
