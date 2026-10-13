# Score it to the beat (Step 8)

If you have a track (only use music you have the rights to):

```
python beats.py audio/track.wav > beats.json
```

Then:

```
Read beats.json. Screen changes land on beats, big moments on downbeats, sound effects
on the hits. If no track is supplied, compose the music and UI sounds in code at 120 BPM
and write the beat grid yourself. Render the audio to out/audio.wav, then run
scripts/mix.sh out/audio.wav to normalize to -14 LUFS and combine it with
out/silent.mp4 into out/final.mp4.
```
