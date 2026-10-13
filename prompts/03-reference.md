# Give it a reference (Step 5)

Without a reference Claude falls back to its defaults. Ways to give one:
- **A frame**: screenshot of a video you love. Say what to take (colors, type, texture) and what not to (the subject).
- **A video**: put it in `./refs/` and have Claude pull frames and study the pacing shot by shot.
- **A library**: a folder of your own images or past work.

Specify the look and the rules, not the coding library.

```
Reference: ./refs/launch.mp4

1. Extract one frame every 0.5s with ffmpeg. Study them.
2. Write ./docs/style_guide.md: palette (hex), type (family, weight, spacing),
   shot lengths, transition types, camera moves, texture, how text enters and exits.
3. Write ./docs/shotlist.md for a [DURATION]s video about [SUBJECT] in THAT style.
   Take the grammar of the reference, never its content, logos, or characters.
4. Show me both files. Wait for my OK before any code.
```
