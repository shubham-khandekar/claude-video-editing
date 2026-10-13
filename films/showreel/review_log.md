# Showreel review log

Brief: `prompts/01-smoke-test.md`, a 15s showreel. 1080x1920, 120 BPM, Am–F–C–G score synthesized in `music.py`.
Grid: `python beats.py out/showreel_audio.wav 120 > films/showreel/beats.json`. Without the hint, librosa
locked onto the claps at 60 BPM. With it, every measured beat is within 20 ms of the composed grid.

Shots (cut on every downbeat, 2s each): hook · springs · kinetic type · UI morph · tile grid · cut bands · code · lockup → dot (loops to frame 0).

## Round 1: stills, one per beat (`out/r1.png`)
Hook 7 · readability 5 · motion 7 · variety 8 · composition 5 · consistency 8
1. Dead space: hook stack sat low with the top 40% empty; UI shot was a small button on an empty canvas; code and outro floated.
2. Mono captions at 30–34px were unreadable at phone width.
3. Text slivers stayed inside the collapsing bands (11.5s), and exit fragments of `seek(t)` at 14.8s.

Fixes: raised the hook stack and added a caption under it; scaled the UI container ~1.5x with a bigger cursor; rebuilt the code shot
around "ONE / FUNCTION."; captions ≥ 40px; band words exit before the bands collapse; faster outro exit.

## Round 2 (`out/r2.png`)
Hook 7 · readability 7 · motion 7 · variety 8 · composition 7 · consistency 8
1. Outro still left `(` `)` fragments: exits only slid as far as the mask.
2. UI shot: top half empty, loader/check small.
3. Code cursor blinked on a fixed timer, not the beat.

Fixes: exits now travel 1.4x the type size; "IT CLICKS." heading in the UI shot, loader/check 320px; cursor blinks on half-beats.

## Round 3 (`out/r3.png`)
Hook 8 · readability 8 · motion 8 · variety 8 · composition 8 · consistency 8
All stills clear. Moved on to the full render and video checks (motion strip, phone test, loop seam, sound sync).
