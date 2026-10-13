# Motion studio

Launch videos, product ads and showreels made entirely in code with Claude Code.
No After Effects, no animation skills. The prompt is 10% of the video; this repo
is the other 90%: house rules, a render engine, springs, a beat grid, a critique
loop, and a skill that packages it all.

## How it works

Claude writes `index.html` with one function, `window.seek(t)`, that paints the
exact frame for any moment in time. `render.mjs` opens it in headless Chromium,
calls `seek` for every subframe, screenshots `#c`, and pipes the PNGs into ffmpeg.
Nothing depends on a live timer, so the render is identical every time, and
changing one shot is a one-line edit plus a re-render.

## Setup

```bash
# Node, ffmpeg, Python (macOS: brew install node ffmpeg python)
pip install numpy librosa soundfile
npm install && npx playwright install chromium
cp .env.example .env   # optional: ELEVENLABS_API_KEY for voiceovers

# optional framework skills
npx skills add remotion-dev/skills
npx skills add heygen-com/hyperframes

claude --model claude-opus-5-5
```

In Claude Code set the effort with `/model`: **medium** for small fixes and
re-renders, **xhigh** for new videos.

## Use

- One sentence: `/motion-reel for https://example.com, 20s, vertical, reference ./refs/frame.png`
- Or paste a brief from [`prompts/`](prompts/), in order of ambition:
  smoke test → product launch → reference → state list → springs → sound → critique → overnight director's brief.

## Commands

| Command | What it does |
| --- | --- |
| `node render.mjs --dur 15 [--fps 60 --sub 4 --w 1080 --h 1920 --out out/silent.mp4]` | Render `index.html`; `--sub 4` blends 4 subframes per frame for motion blur |
| `python beats.py audio/track.wav > beats.json` | Measure bpm, beats, downbeats and hits |
| `bash scripts/mix.sh out/audio.wav` | Normalize to -14 LUFS and mux with `out/silent.mp4` → `out/final.mp4` |
| `bash scripts/review.sh out/final.mp4 4.2` | Contact sheet, glitch strip, phone test, loop check, poster frame |

## Layout

```
CLAUDE.md                       house rules (render contract, banned looks, critique loop)
render.mjs                      renderer
lib/motion.js                   spring(), track(), clamp(), seeded rng()
beats.py                        beat grid analysis
scripts/review.sh, mix.sh       review images, audio mix
prompts/                        brief templates
.claude/skills/motion-reel/     the packaged pipeline
examples/smoke/                 minimal working film used to verify the pipeline
assets/ refs/ audio/ docs/      per-project inputs and planning docs
out/                            renders (git-ignored)
```

## Troubleshooting

- **Looks like every other AI video**: the CLAUDE.md banned list isn't loaded, or there's no reference. Give it a frame or video you love.
- **Motion feels cheap or floaty**: refactor to springs (`prompts/05-springs-refactor.md`), check effort is xhigh.
- **Blurry text when it scales up**: render at full size, don't scale text up from small; check `out/strip.png` at that moment.
- **Render changes every time**: something uses `Math.random` or a live timer. Use `rng()` from `lib/motion.js`.
- **Wrong fonts**: the renderer waits for `document.fonts.ready`; check the fonts actually load.
- **Music and visuals drift**: re-run `beats.py` on the exact final track and re-time cuts.
- **First try was mid**: normal. Run the critique loop 3 times before judging.

## Rules to remember

The setup is 90% of the video. Every frame is a pure function of time. Ban the AI
defaults. Always give a reference: take the style, never the content. Real product
UI only. Springs, not easing curves. Cut on the beat. Make Claude watch its own
frames: 3 rounds minimum, every score 8+. Keys in `.env`, never in a prompt.
Only use music, logos and footage you have the rights to.
