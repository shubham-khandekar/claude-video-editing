# Make Claude watch its own frames (Step 9)

First: `bash scripts/review.sh out/final.mp4 4.2` (second arg = a fast moment to inspect).

```
Open out/contact.png, out/strip.png and out/phone.png and look at them properly.
Be a harsh motion director, not a proud author.

Score 1-10: hook in first 2s, readability at phone size, motion quality, variety
(new thing every 2-4s), composition, brand accuracy, sound sync.

List the 3 biggest problems with timestamps. Hunt for: text overlapping during swaps,
anything sliding instead of easing, corner labels and frame borders, centered-on-gradient
shots, blurry scaled text, a dead beat with nothing happening, a stutter at the loop seam.

Fix them, re-render only the affected seconds, show me the new contact sheet and new scores.
```

Run at least 3 rounds. Iteration is the method, not a failure.
