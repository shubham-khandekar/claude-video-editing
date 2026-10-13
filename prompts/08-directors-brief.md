# The overnight director's brief (Step 10)

For a long, unattended run. Sections: the film in one line, references, tools and keys,
look, beat sheet (hook in first 2s, payoff every 3-5s), workflow gates (no skipping),
critique loop, deliverables.

```
You are the director, animator, sound designer, and render engineer for a [DURATION] film
made in code. Treat this as a multi-session production. Don't rush to a final render.

## The film in one line
[LOGLINE. What the viewer should feel at the end.]

## References and inputs
- ./refs/ : [video / frames / image library]. Take the grammar, never the content.
- ./audio/track.wav : use it unchanged. Measure beats with beats.py first.
- APIs in .env: [KEYS]. Budget: [$X]. Be economical.

## Look
[3-5 lines: palette, type, texture, camera language. Banned looks.]

## Beat sheet
0:00-0:02  hook: [the single most striking image]
0:02-0:10  [act 1]
...        a new visual payoff every 3-5 seconds
[END]      the last frame sets up the first frame

## Workflow, with gates
1. Write docs/style_guide.md and docs/shotlist.md. Show me the shot list.
2. Build stills for every shot. Contact sheet. Critique.
3. Rough cut at low resolution with placeholder audio. Fix pacing before polish.
4. Full animation, polish pass, sound pass, final render.
5. For long films, write docs/ANIMATION_GUIDE.md first, then split chapters across
   subagents so they all code in the same style.

## Critique loop (every shot, at least 3 rounds)
Render stills, score 1-10, log scores and the 3 biggest problems in docs/review_log.md.
Fix. Repeat until all are 8+.

## Deliverables
out/final.mp4, out/loop_check.mp4, out/poster.png, out/contact.png, README.md
```
