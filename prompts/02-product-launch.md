# Product launch video (Step 4)

Fill in the brackets. Keep one Claude Code session per brand: the second video
for the same product is much faster because renderer, music and assets exist.
For a voiceover, put the key in `.env` and say "the ElevenLabs key is
ELEVENLABS_API_KEY in .env". Never paste a real key into a prompt.

```
Make a dynamic 20-second motion graphics video for [PRODUCT] ([URL]), with the energy
of a motion designer's showreel. Go all out.

Assets
- Visit the site. Use real screenshots (Playwright), the real logo, real colors and fonts.
  Save everything to ./assets and list what you found before you animate.

Story
1. Hook: [THE PROBLEM OR PROMISE IN ONE LINE], on screen in the first 2 seconds.
2. The product appears, the UI assembles itself piece by piece.
3. Three features, each as a UI moment with a cursor doing a real action.
4. One number that proves it works: [A REAL METRIC].
5. Logo lockup + [CALL TO ACTION].

Sound
- Original music, 120 BPM, synthesized in code. UI clicks and whooshes on the beat.

Format: 1080x1920 (9:16) first, then 1:1 and 16:9 from the same timeline.
Before the full render, show me a contact sheet of one frame per beat.
```
