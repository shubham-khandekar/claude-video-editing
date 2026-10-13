# Motion studio rules

Every video in this folder is a program. Claude writes `index.html`, the renderer
turns it into frames, ffmpeg turns frames into an MP4. These rules apply to every
video made here.

## Render contract
- Every film is a pure function of time: `window.seek(t)` paints frame t.
- The page has a `<canvas id="c">` sized to the output format (default 1080x1920).
- No CSS transitions, no setTimeout, no requestAnimationFrame in render mode,
  no state carried between frames. Seeded noise only, never Math.random.
- Render with `node render.mjs`. Encode H.264 yuv420p, CRF 16.
- The renderer serves the project root over http: import helpers as `/lib/motion.js`.
- Async setup (e.g. fetching `beats.json`) goes in a `window.ready` promise; the renderer awaits it.
- Wait for fonts before painting (render.mjs awaits `document.fonts.ready`).

## Look
- Banned: centered title on a gradient, everything fading in,
  corner labels and frame borders, glow on UI, generic particle bursts.
- One display font, one UI font. One accent color unless the brief says otherwise.
- Every 2 to 4 seconds something new must happen on screen.
- Real product UI only. Never invent screens.
- Always work from a reference when one exists: take the grammar, never the content.

## Motion
- Springs, not easing curves. Use `lib/motion.js`: `spring()` for one change,
  `track()` for any value with more than one target (one spring per change, stacked).
- Tiny overshoot on UI, none on type. Stiffer springs for buttons/toggles,
  softer for big type and logos.
- Cut on the beat: screen changes land on beats, big moments on downbeats.

## Sound
- Music and sound effects are synthesized in code unless a track is supplied.
- Place hits on the measured beat grid (`beats.json` from `beats.py`). Loudness -14 LUFS.
- Only use music we have the rights to.

## Loop before you show me anything
1. Render one frame per beat as a contact sheet and LOOK at it
   (`node scripts/stills.mjs --page <film>/index.html --dur N`; after a render, `scripts/review.sh`).
2. Score it 1-10 on: hook in first 2s, readability at phone size,
   motion quality, variety, brand accuracy, sound sync.
3. Fix the 3 worst problems. Repeat until every score is 8+ (3 rounds minimum).
   Log scores and problems in `docs/review_log.md`.
4. Only then do the full render.

## Keys
- API keys live in `.env` only (see `.env.example`). Never in a prompt or a committed file.

## Project layout
- `render.mjs` — renderer: `node render.mjs --dur 15 --fps 60 --sub 4 [--w 1080 --h 1920] [--out out/silent.mp4] [--page index.html]`
- `lib/motion.js` — closed-form springs (`spring`, `track`, `clamp`)
- `beats.py` — `python beats.py song.wav [bpm_hint] > beats.json` (hint fixes half/double-time errors;
  `downbeats` assumes the first detected beat is beat 1, so prefer bpm + measured phase)
- `scripts/stills.mjs` — cheap per-beat contact sheet straight from the page (critique rounds)
- `scripts/serve.mjs` — static server shared by the renderer and stills
- `scripts/review.sh` — contact sheet, strip, phone test, loop check from a rendered MP4
- `scripts/mix.sh` — normalize audio to -14 LUFS and mux with the silent render
- `films/<name>/` — one folder per film: `index.html`, `beats.json`, music script, review log
- `prompts/` — brief templates (product launch, reference, state list, director's brief, critique)
- `assets/` gathered brand assets · `refs/` references · `audio/` tracks · `docs/` style guide, shot list, review log · `out/` renders (git-ignored)
- `/motion-reel` skill packages the whole pipeline (`.claude/skills/motion-reel/SKILL.md`).
