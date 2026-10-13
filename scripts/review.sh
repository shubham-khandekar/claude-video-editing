#!/usr/bin/env bash
# Turn a rendered video into images Claude can review.
# Usage: scripts/review.sh [video=out/final.mp4] [fast_moment_seconds=4.2]
set -euo pipefail
IN="${1:-out/final.mp4}"
AT="${2:-4.2}"
mkdir -p out
START=$(awk -v t="$AT" 'BEGIN { s = t - 0.1; print (s < 0 ? 0 : s) }')

# Contact sheet: 2 frames per second, 6 across
ffmpeg -y -loglevel error -i "$IN" -vf "fps=2,scale=270:-1,tile=6x5" -frames:v 1 out/contact.png
# Strip: 12 frames around a fast moment, to catch glitches
ffmpeg -y -loglevel error -ss "$START" -i "$IN" -vf "scale=320:-1,tile=12x1" -frames:v 1 out/strip.png
# Phone test: how it reads at 360px wide
ffmpeg -y -loglevel error -i "$IN" -vf "fps=1,scale=360:-1,tile=5x3" -frames:v 1 out/phone.png
# Loop check: play it twice and watch the seam
ffmpeg -y -loglevel error -stream_loop 1 -i "$IN" -c copy out/loop_check.mp4
# Poster frame
ffmpeg -y -loglevel error -ss 1 -i "$IN" -frames:v 1 out/poster.png

echo "wrote out/contact.png out/strip.png out/phone.png out/loop_check.mp4 out/poster.png"
