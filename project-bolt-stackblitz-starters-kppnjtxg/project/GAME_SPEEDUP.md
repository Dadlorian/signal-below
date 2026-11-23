# Make The Signal Below faster

You built a big game, and it already runs. This is a treasure map for making it feel
smoother. It does **not** give you the fixes. It tells you **where to look**, **what is
happening**, and **why it costs time**, so you work out the fix yourself and actually
learn it.

> A game has about **16.7 milliseconds** to do everything for one frame (that's 60 frames
> a second). If a frame takes longer, you feel a stutter. All the ideas below are about
> giving each frame less work.

---

## Step 0 · Measure first (10 minutes)

Never fix a speed problem you haven't measured. You might fix the wrong thing.

1. Open the game in Chrome and start a run.
2. Press `F12` and open the **Performance** tab.
3. Click the record button (the circle), play for 10 seconds, then stop.
4. Look at the graph:
   - **FPS** bar at the top. Green is good. Red means dropped frames.
   - **Long tasks** are red-corner blocks in the Main track. Each one is a freeze.
   - **Scripting** (yellow), **Rendering/Painting** (purple, green) and **GC** (garbage
     collection). Which color dominates?
5. Also open the **Performance monitor** (press `Ctrl + Shift + P`, type "performance
   monitor"). Watch **JS heap size** while you play. If it climbs and then drops in a
   saw-tooth pattern, the game is making lots of short-lived objects. Remember that.

Write down your numbers (FPS, longest task) so you can compare after each change.

---

## The suspects

Ordered from "easiest to see the win" to "hardest but biggest". Try them in this order.

### 1 · The background is repainted from scratch every frame
- **Where:** `src/components/BuriedComplexGame.tsx`, function `render25DScene`. Look at the
  parts marked "Parallax Ceiling" and "Back Wall & Side-Angled Corridor Floor". The title
  screen has a similar loop in a `useEffect` near the top that draws grid lines.
- **What is happening:** every frame, the code makes a new gradient
  (`createLinearGradient`), fills big rectangles, and draws grid lines one at a time with a
  separate `beginPath` and `stroke` for each line.
- **Why it costs:** canvas drawing calls aren't free, and most of this picture doesn't change
  from one frame to the next while you stay in a room.
- **Ask yourself:** which parts of the background actually move? (Hint: look at what
  `parallaxShift` depends on.) Which parts only change when the biome changes?
- **Words to look up:** offscreen canvas, `drawImage`, static vs dynamic layers, caching.
- **You'll know it worked:** the Rendering/Painting part of your recording gets shorter.

### 2 · New copies of everything, every frame
- **Where:** `src/lib/deep-signal-engine.ts`, function `stepDeepSignalRun`. Read the first
  few lines of it: you will see `.map(...)` with `{ ...enemy }`, `{ ...proj }`, particles,
  pickups, arrays of gear, the profile, and the room's props.
- **What is happening:** the engine builds a brand-new copy of almost everything 60 times a
  second.
- **Why it costs:** making new objects isn't slow by itself, but the browser has to clean up
  the old ones with a **garbage collector**. When it does, the game freezes for a moment. That
  could be the "slow for a bit, then fixed itself" feeling. Copying is used here for a
  good reason (React notices changes by looking for new objects), so the answer isn't "never
  copy".
- **Ask yourself:** of all these things, which really change every frame? Does the room's list
  of props change at all while you fight? Could unchanged things be reused instead of copied?
- **Words to look up:** garbage collection, object allocation, structural sharing,
  object pooling.
- **You'll know it worked:** the JS heap saw-tooth from Step 0 gets flatter, and "GC" slices
  in the recording get smaller.

### 3 · React is asked to redraw the whole screen every frame
- **Where:** `src/components/BuriedComplexGame.tsx`, the `useEffect` that contains
  `const frame = (now: number)`. Inside it, find `setRunState(`. Also notice that you
  already have a `runStateRef`.
- **What is happening:** every frame, the loop calls `setRunState`. That tells React "my data
  changed, redraw the component". The component is about 2,500 lines of screen, buttons and
  HUD, so React re-checks all of it up to 60 times a second, even though the canvas picture is
  drawn separately and doesn't need React.
- **Why it costs:** React is great for buttons and text. It is not designed to be the engine of a
  60-frames-a-second simulation.
- **Ask yourself:** what is the difference between **state** and a **ref**? Which one should
  hold things that change 60 times a second? Which things on screen (health text, gold,
  buttons) really need React to update, and how often do *they* need to update, every frame
  or a few times a second?
- **Words to look up:** React state vs refs, re-rendering, mutable game state, throttling UI
  updates, React DevTools Profiler (a free Chrome extension called "React Developer
  Tools". Turn on "Highlight updates when components render" and watch the whole screen flash).
- **You'll know it worked:** far fewer renders in the Profiler, and Scripting time drops.
- **Heads up:** this is the biggest change and the easiest one to break. Make a save point
  first (see the rules at the bottom).

### 4 · The fonts load in a long chain
- **Where:** `src/index.css` line 1 (an `@import url('https://fonts.googleapis.com/...')`) and
  `index.html` (look for `preconnect`).
- **What is happening:** the browser downloads your CSS first, *then* finds the font request
  inside it, *then* downloads the font list, *then* the font files. Four steps in a row, and
  each waits for the one before.
- **Why it costs:** text can appear late or jump when the font finally arrives.
- **Ask yourself:** where else could the browser learn about the fonts earlier? Do you really use
  every weight listed (look at the numbers after `wght@`)?
- **Words to look up:** render-blocking resources, `<link rel="preload">`, self-hosting fonts,
  `font-display`.
- **You'll know it worked:** in DevTools, **Network** tab, filter by **Font**. The fonts start
  downloading sooner in the waterfall.

### 5 · A lot of one-time work happens right at the start
- **Where:** `src/lib/deep-signal-audio.ts` (`ensureContext`, `createBuffer`) and the code
  that sets up a new run and floor in `src/lib/deep-signal-engine.ts`
  (search for `startDeepSignalRun` and `createDeepSignalRun`).
- **What is happening:** when a run starts, the browser is compiling your code for the first
  time, creating audio, and building the dungeon, all while drawing the first frames.
- **Why it costs:** first-time work is always slower. That's why the first few seconds can be
  choppy and then settle down.
- **Ask yourself:** what **must** be ready for the very first frame? What could be prepared a
  moment earlier (on the title screen) or a moment later?
- **Words to look up:** JIT compilation and warm-up, lazy initialization.
- **You'll know it worked:** compare a recording of the first 5 seconds with one from minute 2.
  The gap gets smaller.

---

## Small things worth knowing

- **Side effects inside an updater.** In the main loop, `saveSurveyorProfile(next.profile)` is
  called *inside* the function you pass to `setRunState`. React expects those functions to
  only calculate and not do things like saving, and it may run them more than once in
  development. Not a speed problem, but a good habit to learn: *where does saving belong?*
- **Leftover files.** `src/components/ZombieSniperGame.tsx` isn't imported anywhere now, so it
  isn't downloaded by players. It doesn't slow the game, but you can decide if you still want it.
- **Unused CSS.** The CSS file is about 150 KB. DevTools has a **Coverage** tab (`Ctrl + Shift + P`,
  then "Show Coverage") that shows which CSS is never used. Old styles from removed games
  are good candidates. A small win, but a nice way to practice reading DevTools.

---

## Rules of the road

1. **Save point first.** Before each change: `git add -A && git commit -m "before speed fix"`.
   If it goes wrong, `git restore .` takes you back.
2. **One change at a time.** Then measure again. If you change three things, you won't know
   which one helped.
3. **Compare real numbers** from Step 0, not just how it feels.
4. **Stop when it feels smooth.** Fast enough is fast enough.
5. **Test the game** after each change: movement, fighting, loot, going down a floor, dying.

## Use Claude as a teacher, not a vending machine

Try prompts like these:

- "I'm reading `render25DScene` in `BuriedComplexGame.tsx`. Explain *why* repainting the
  background every frame is slow. Give me three questions to ask myself, and tell me how to
  measure it. **Don't write the fix.**"
- "Here is my change to the game loop (paste it). Review it like a teacher. What could break,
  and what should I test?"
- "Explain the difference between React state and a ref like I'm 14, with an example from my
  game."

## The order I'd go in

`Step 0 (measure)` → `1 (background)` → `2 (copies)` → `3 (React loop)` → `4 (fonts)` → `5 (start-up)`

Every one of these is something professional game developers deal with. If you can explain
**why** a fix works, you've learned something most people only pick up years later. Good luck!
