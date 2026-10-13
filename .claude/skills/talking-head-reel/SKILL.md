---
name: talking-head-reel
description: Edit a talking-head video into an Instagram reel in the split-card style (face band + animated UI cards, B-roll, three.js 3D scenes, pill captions). Use when the user uploads a talking-head / face-cam video and asks to edit it, add B-roll, explainers or captions.
---

# Talking-head reel (split-card, calm default)

Style rules live in the `video-split-card-reel` skill (layouts A-G, pill captions on the seam, 6-10 component
cards, 2-4 word-synced beats per card, gentle build-ins, no slams/shakes unless asked). This is how to run it here.

## Pipeline
1. `python scripts/transcribe.py raw.mp4 films/<name>/words.json [--model small] [--lang en|hi]`
   (needs huggingface.co allowed). Fix spellings by hand, keep timings. Hinglish: romanise, use "tum".
2. `python scripts/cut_silence.py raw.mp4 films/<name>/words.json films/<name>/media --gap 0.3`
   → `cut.mp4`, `voice.wav`, `words_cut.json`, `cuts.json`, `face/%05d.jpg` (media/ is git-ignored).
3. Beat sheet before code: 2-3 word caption chunks; per shot: layout, card components, beats tied to words (`at(words, 'word')`).
4. Build `films/<name>/index.html` with `lib/reel.js` (`Reel`, `shot()`, card kit, `three3d()` for 3D scenes,
   `cue()` for SFX). Look at `films/_test/index.html` for a working example. Import three from `/node_modules/three/build/three.module.js`.
5. Stills: `node scripts/stills.mjs --page films/<name>/index.html --dur <cuts.json duration> --step 1 --offset 0.5`. Fix overlaps/safe zones.
6. **Approval gate**: write `films/<name>/brief.json`, run `node scripts/brief.mjs --page ... --brief ... --out exports/<name>_brief.pdf`,
   send the PDF and stop. Render only after the user approves (unless they said to skip the brief).
7. Render: `node render.mjs --page films/<name>/index.html --dur <d> --fps 30 --sub 1 --out out/<name>_silent.mp4`.
8. Audio: `node scripts/cues.mjs --page ... --out films/<name>/cues.json` →
   `python scripts/reel_audio.py films/<name>/media/voice.wav films/<name>/cues.json out/<name>_mix.wav [--bed soft|none|track.wav]` →
   `bash scripts/mix.sh out/<name>_mix.wav out/<name>_silent.mp4 out/<name>.mp4` (-14 LUFS).
9. `bash scripts/review.sh out/<name>.mp4` → check contact/phone sheets, caption positions, end card. Deliver the MP4.

## When to use three.js
Only when the script talks about something spatial or structural that reads better in 3D: growth/compare (3D bars),
systems/architecture (node graph in space), globe/reach, layers/stacks, a product object. Keep it calm: slow orbit,
elements grow/assemble on the spoken word, same paper/ink/yellow palette, rendered inside a card or full-bleed (layout C).
