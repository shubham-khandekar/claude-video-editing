#!/usr/bin/env bash
# Normalize the soundtrack to -14 LUFS and combine it with the silent render.
# Usage: scripts/mix.sh <audio.wav> [video=out/silent.mp4] [out=out/final.mp4]
set -euo pipefail
AUDIO="${1:?usage: scripts/mix.sh <audio.wav> [video] [out]}"
VIDEO="${2:-out/silent.mp4}"
OUT="${3:-out/final.mp4}"

ffmpeg -y -loglevel error -i "$VIDEO" -i "$AUDIO" \
  -filter:a "loudnorm=I=-14:TP=-1:LRA=11" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "wrote $OUT"
