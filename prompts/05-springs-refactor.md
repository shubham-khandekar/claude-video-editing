# Make the motion feel expensive (Step 7)

When something changes target several times, don't restart the spring: stack one
spring per change, each starting at its own time (`track()` in `lib/motion.js`).

```
Replace every easing curve with closed-form springs from lib/motion.js. Tiny overshoot
on UI, none on type. Any value with more than one target uses track().
```

Stiffer springs feel snappy (buttons, toggles). Softer ones feel heavy (big type, logos).
