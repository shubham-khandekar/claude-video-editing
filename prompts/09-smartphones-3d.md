# How smartphones are changing the world: 3D motion film (three.js)

Director's brief for a fully code-rendered, three.js-heavy motion graphics film. Run it in this repo
(the renderer, `lib/motion.js`, three.js and CLAUDE.md are already set up):

```
claude --model claude-sonnet-5-5
/model   → effort: xhigh
```

Then paste everything in the block below.

```
You are the director, 3D artist, motion designer, sound designer and render engineer for a
40-second vertical film made entirely in code: "HOW SMARTPHONES ARE CHANGING THE WORLD".
This is a showcase of three.js. Most shots are real 3D scenes, and every shot has heavy, polished
motion graphics. Treat it as a multi-session production. Don't rush to a final render.

Read CLAUDE.md first and follow every rule in it (render contract, banned looks, springs, sound,
critique loop). Read render.mjs, lib/motion.js, lib/reel.js (three3d helper, card kit) and
films/showreel/index.html to learn the house style and tooling before writing anything.

## The film in one line
A phone falls out of the dark, and in 40 seconds it rebuilds the planet around it: money, media,
knowledge and attention. The viewer should feel "the most powerful object in history is in my hand".

## Output
- films/smartphones/: index.html, music.py, beats.json, docs (style_guide.md, shotlist.md,
  review_log.md, sources.md), out/ renders.
- 1080x1920 (9:16), 40 s, final render at 60 fps with --sub 2 motion blur.
- Then 1:1 (1080x1080) and 16:9 (1920x1080) from the same timeline: framing must adapt
  (camera FOV/position per aspect), not just crop.

## Facts (verify before use)
Every number on screen must be real. Verify each one with web search, use the most recent figure
you can source, and log the source + date in docs/sources.md. Where you can't verify a number, cut it.
Candidates to check:
- First iPhone: 2007. The Apollo Guidance Computer vs a modern phone chip (clock speed / RAM / transistor count).
- Number of smartphone users / mobile-internet users worldwide (GSMA State of Mobile Internet Connectivity).
- India's UPI: monthly transaction count (NPCI). M-Pesa (Kenya, launched 2007): users or share of GDP.
- Photos taken per year (mostly on phones).
- Average daily time spent on mobile (data.ai / Sensor Tower / DataReportal).
- Share of web traffic from mobile (StatCounter).

## Look
- Dark-to-light story: open on near-black (#0B0B0F), end on warm paper (#F2F1ED).
  One accent: electric yellow #FFE600. Support colours: ink, paper, one cool grey. Nothing else.
- Type: one display face (Inter 800-900, tight tracking) and one mono UI face (JetBrains Mono).
  Fonts are in assets/fonts/fonts.css. Numbers always mono, tabular.
- 3D materials: MeshPhysicalMaterial for the phone (dark glass + brushed aluminium,
  clearcoat 1, roughness 0.15-0.35). Matte MeshStandardMaterial for everything else. Soft studio
  lighting (key + rim + HemisphereLight), real shadows (PCFSoftShadowMap) on a floor that fades into fog.
- Camera language: slow dolly-ins, one orbit, one dramatic "through the screen" fly-through,
  one top-down reveal. No handheld shake, no random wobble.
- Banned: centered title on a gradient, everything fading in, generic particle bursts, glow on UI,
  lens flares, stock "cyber" grids, neon. Particles are allowed only when they ARE data
  (users, transactions, photos) and move with purpose.

## The hero object
Build ONE phone and reuse it in every shot: rounded-rectangle body (ExtrudeGeometry with
bevel, or RoundedBoxGeometry from three/examples/jsm), separate glass screen plane, camera bump,
side buttons. The screen is a CanvasTexture you redraw inside seek(t) (needsUpdate = true), so the
UI on the phone animates frame-accurately: lock screen, payment confirmation, camera viewfinder,
map, feed, notifications. The phone must look premium in close-up.

## Beat sheet (120 BPM, beat = 0.5 s, cut on downbeats = every 2 s)
0:00-0:03  HOOK. Black. A single yellow pixel. It springs into a phone screen lighting up
           in the dark; the phone body resolves around it; camera dollies in.
           Kinetic type slams in line by line (masked rise, no fade):
           "THIS / CHANGED / EVERYTHING."
0:03-0:07  2007 → NOW. Exploded view: the phone separates into layers in 3D (glass, display,
           board, chip, battery), each layer labelled with mono call-outs on leader lines.
           The chip lifts out and a ghosted Apollo Guidance Computer box appears beside it
           at true relative scale. Counter compares them (verified figure).
0:07-0:12  THROUGH THE SCREEN. The camera flies into the phone's screen and comes out over
           a 3D globe. Instanced points (InstancedMesh, seeded positions weighted by real
           population regions) light up continent by continent while a counter climbs
           to the verified number of smartphone users. Arcs (TubeGeometry along
           CatmullRomCurve3, drawn with a progress uniform) connect cities.
0:12-0:17  MONEY. Top-down reveal of a grid of phones on a table. Payments fly between
           them as flat yellow tokens along arcs (no glow); each landing pops a "₹ PAID ✓" card on
           that phone's screen texture. Counter: verified UPI monthly transactions. Second beat:
           a map tile of Kenya with an M-Pesa stat.
0:17-0:22  CAMERA. The phone turns, shutter clicks on the beat; each click spits a photo
           tile into space. Tiles become a wall of thousands of photos (InstancedMesh with
           a texture atlas generated in code: simple coloured scenes, never real people) that
           ripples in a wave and forms the number of photos taken per year.
0:22-0:27  KNOWLEDGE. Phone lies flat; a paper-style stack of cards (not holograms) rises
           from the screen: map route drawing itself, translation (two languages swapping),
           search results, a lesson video. Each card arrives on a beat with springs.
0:27-0:32  ATTENTION. Twist: a 24-hour 3D clock ring; segments fill yellow as the average daily
           screen time (verified). Camera pulls back: the ring is the phone's notification
           badge. Type: "WE GAVE IT OUR TIME."
0:32-0:37  WORLD → HAND. Everything collapses back into the phone: globe, cards, tiles
           fly into the screen (stacked tracks, one spring per change). Phone rotates into
           a hand-held angle over warm paper.
0:37-0:40  LOCKUP. "THE MOST POWERFUL OBJECT / IN HISTORY / IS IN YOUR HAND."
           The last frame equals the first frame's state (yellow pixel on black) so it loops:
           the screen shrinks back to one yellow pixel as the scene darkens.

## Motion rules
- Everything is a pure function of t through window.seek(t). No THREE.Clock, no
  performance.now, no AnimationMixer.update(delta) (if you use a mixer, set mixer.setTime(t)).
  Seeded rng only (lib/reel.js rng()).
- Closed-form springs from lib/motion.js for every move. Values with several targets use
  track() (one spring per change, stacked). Tiny overshoot on objects, none on type.
- Camera paths: CatmullRomCurve3 sampled at a spring-eased progress, with lookAt targets
  that also spring. Never linear camera moves.
- Instanced everything (InstancedMesh + per-instance matrices computed from t). Keep
  draw calls under 200 and every frame under ~150 ms in headless Chromium.
- Text in 3D: draw labels to the 2D canvas over the WebGL frame (project 3D anchor points
  with Vector3.project) so type stays razor sharp. Don't use 3D text geometry.
- Something new every 1-2 s. Every shot has at least: one 3D move, one typographic beat,
  one data beat (counter/arc/fill), and one hit on the music.

## Build
- One page, one 2D canvas #c (1080x1920). Render three.js into an offscreen WebGLRenderer
  (preserveDrawingBuffer: true, antialias: true, toneMapping ACESFilmic, sRGB output) and
  drawImage it into #c, then draw 2D type/UI on top. lib/reel.js three3d() shows the pattern.
- Import three from /node_modules/three/build/three.module.js and addons from
  /node_modules/three/examples/jsm/... (already installed).
- window.ready loads fonts, beats.json and builds all scenes once; seek(t) only updates
  transforms, uniforms and textures, then renders.
- Shot switcher: each shot = { t0, t1, scene, camera, update(t), overlay(g, t) }. Hard cuts on
  downbeats, except the planned continuous moves (through-the-screen, collapse-to-phone).

## Sound
- music.py: original 120 BPM track synthesized in numpy (dark pulse in the first half, warmer
  chords from 0:27, drop on 0:07 and 0:12). SFX in code on the picture: phone power-on, shutter
  clicks, payment "ding", whooshes on camera moves, a low boom on the 0:37 lockup.
- python beats.py out/music.wav 120 > films/smartphones/beats.json. Use bpm + measured phase
  for the grid. Mix with scripts/mix.sh at -14 LUFS.

## Workflow, with gates (no skipping)
1. Verify facts → docs/sources.md. Write docs/style_guide.md and docs/shotlist.md (shot, time,
   3D content, camera move, type, data beat, SFX). Show me the shot list and the facts. Wait for my OK.
2. Build the phone alone first. Render 4 hero stills (front, back, 3/4, exploded) and show me.
3. Build every shot as stills: node scripts/stills.mjs --page films/smartphones/index.html
   --dur 40 --step 1 --offset 0.5. Critique, fix.
4. Rough cut: node render.mjs ... --w 540 --h 960 --fps 30 --sub 1 with placeholder audio.
   Fix pacing and camera moves before polish.
5. Polish pass (materials, lighting, shadows, type), sound pass, then the final render:
   node render.mjs --page films/smartphones/index.html --dur 40 --fps 60 --sub 2.
6. Build a live preview page with python scripts/preview.py so I can scrub it.

## Critique loop (every round, at least 3 rounds)
Render stills, then score 1-10: hook in first 2 s, 3D quality (materials, light, shadows),
camera language, readability at phone size, variety, data accuracy, sound sync, loop seam.
Log scores and the 3 biggest problems with timestamps in docs/review_log.md. Hunt for: aliasing
on thin lines, z-fighting, shadow acne, text overlapping 3D, dead beats, camera moves that feel
linear, instanced points that look random instead of geographic. Fix. Repeat until all are 8+.

## Deliverables
out/final.mp4 (9:16), out/final_1x1.mp4, out/final_16x9.mp4, out/loop_check.mp4,
out/poster.png, out/contact.png, the live preview page, docs/sources.md, README.md.
```

## Notes
- For a quick test of the setup, cut the beat sheet down to the hook + globe shots (12 s).
- Headless Chromium renders WebGL in software (SwiftShader). 40 s × 60 fps × 2 subframes is
  about 4,800 frames: expect a long final render. Do the rough cut at 540x960 / 30 fps.
