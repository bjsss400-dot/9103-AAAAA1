
1. Inspiration
Our project is inspired by Piet Mondrian's Composition with Large Red Plane, Yellow, Black, Gray and Blue (1921), held by Kunstmuseum Den Haag. The painting's horizontal and vertical divisions, unequal rectangular areas and contrasting colors provide the starting point for our digital interpretation.
Rather than display a finished copy, we turn the composition into a process: watch the black divisions appear one stroke at a time, then explore color through personal choices or computer-generated variation. All the mechanics intend to work on the same canvas. The drawing order is our own interpretation, not a reconstruction of Mondrian's historical painting process.

2. Techniques

3. Mechanic ownership
CHUNG-EN CHEN	Time-based	Develops progressive grid drawing, stroke order, drawing speed and pauses. 
	User input	
	Perlin noise and randomness	
	Audio	

4. AI acknowledgement
ChatGPT (OpenAI) assisted with generating the initial prototype, explaining its JavaScript and p5.js logic, and suggesting the probable structure of the code. It also helped discuss interaction ideas, prepare presentation material and draft this README.

5. External references

6. Interaction instructions


## Jinsa — independent User input prototype

This `jinsa` branch starts from `main`, independently of `time-based`. It contains Jinsa Bai's standalone user-input mechanic and a separately designed static Mondrian-inspired test grid. No teammate JavaScript is imported or modified. The test layout is a creative interpretation, not a faithful copy of the painting or the final shared grid.

### Run

Download [jinsa-preview.html](jinsa-preview.html) and open it in a browser. It is a self-contained, offline preview. For development, open `index.html` with the bundled `libraries/p5.min.js`, or use a local server such as `python -m http.server 8000`.

### Controls

- Press **1–6** to select red, yellow, blue, white, gray or black. The page displays only the canvas; no palette, buttons, labels or sidebars are added.
- **Paint:** click a region or hold and drag across several regions.
- **Swap colours:** select two regions to exchange their colours. **Shift + click** also swaps; **X** switches tools. Click the source again or press **Esc** to cancel.
- Undo/redo with **Ctrl/⌘ + Z** or **Ctrl/⌘ + Shift + Z**. A whole drag is one undo step. A new edit clears redo history.
- **C** returns regions to white and can be undone.
- **S** exports a 500 × 500 PNG without hover or selection overlays.

### Structure and techniques

`input-controls.js` contains the entire user-input mechanic: `ColourRegion` stores each region's geometry and colour; `InputControls` handles palette selection, hit testing, pointer capture, drag-path sampling, colour exchanges and snapshot history (up to 100 steps). Mouse/touch coordinates are converted from the canvas's displayed size into the 500 × 500 layout. `sketch.js` only assembles the mechanic and renders the static canvas. Input operates immediately; no time, audio or noise mechanic is implemented in this standalone preview. `index.html` and `style.css` display only the responsive canvas. All controls use mouse/keyboard input, and these instructions remain in the README rather than appearing on the artwork.

**Ownership:** Jinsa Bai — User input, implemented with AI assistance. Future team integration should pass shared region data to the constructor and coordinate rendering with the other mechanics; the current independent layout is for testing this contribution.

### AI and external references

ChatGPT (OpenAI) assisted in generating this user-input code, explaining its logic, designing the test layout and interface, writing history and drag logic, creating tests and drafting these notes. The relevant JavaScript and CSS files also acknowledge the assistance. Region hit testing finds which rectangle contains a pointer, dragging samples points along the pointer path, and saved colour arrays support undo/redo. The contributor should review and understand the code before assessment.

- p5.js reference: https://p5js.org/reference/ — canvas creation, fills, rectangles and PNG export. The p5.js library is included locally.
- MDN Pointer Events: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events — mouse/touch events and pointer capture.
- Piet Mondrian's painting, named in Inspiration above, informs the palette and unequal rectangular divisions. The standalone test layout was created separately for this mechanic.

### Validation

Run `node tests/input-controls.test.cjs`. The tests run the actual mechanic and renderer with a minimal DOM/p5 adapter and check scaled input coordinates, grid-gap rejection, drag history, no-op edits, colour exchanges, clear/undo, keyboard controls and the export call. They are logic tests, not a full browser test. To additionally render the demonstration PNG, install `@napi-rs/canvas` in your test environment and run `RENDER_PREVIEW=1 node tests/input-controls.test.cjs`.

![Demonstration arrangement created through the input handlers](preview/jinsa-demo.png)
