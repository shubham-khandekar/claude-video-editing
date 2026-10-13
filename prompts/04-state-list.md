# State list, not a vibe (Step 6)

A structured spec: inputs to ask for, a visual direction, a beat-by-beat list of
what's on screen, build rules, and known problems. One container morphs through
every state, a cursor drives each change, and the last frame matches the first so
it loops forever.

```
<inputs>
Ask me for: my product + URL, 8 to 12 UI states that tell its story, the real data shown
in each state, brand colors + fonts + one accent, a royalty-free track near 120 BPM, formats.
</inputs>

<direction>
Product-film UI motion. One container never cuts: every state is the same element changing
size, radius, and fill while its content swaps behind a short blur. A cursor drives every change.
Warm neutral canvas, one accent. Springs with at most a tiny overshoot.
Banned: bouncy easing, glows, gradients on UI, particle bursts, dead time.
</direction>

<structure>
120 BPM, 8 bars, something happens on every beat.
logo → button → email field (typed) → loader → success check → dashboard card
→ chart draws itself → tooltip → command menu → notification → logo.
</structure>

<build>
1. One HTML file, one canvas, window.seek(t). No CSS transitions, no timers, no carried state.
2. Closed-form springs. A value with many targets = sum of one spring per change.
3. Text inside a morphing container enters after the morph starts, leaves before the next one.
4. Beat grid from the track. Start on a downbeat. UI sounds on measured peaks.
5. Render at 60 fps, 4 subframes per frame, blended for motion blur.
</build>

<gotchas>
The last frame must equal the first, cursor position and speed included.
</gotchas>

<start>
Ask for the inputs, then show me the state list on the beat grid before writing code.
</start>
```
