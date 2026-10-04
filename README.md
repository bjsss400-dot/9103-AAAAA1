
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

The `jinsa` branch starts from `main`, independently of `time-based`. It contains an independent user-input mechanic and a separately designed static Mondrian-inspired test grid. No teammate JavaScript is imported or modified. The test layout is an interpretation, not a faithful reproduction of the painting or the final shared grid.

### Run

Download [jinsa-preview.html](jinsa-preview.html) and open it in a browser. This self-contained offline preview displays **only the square canvas**. For development, open `index.html` with the bundled `libraries/p5.min.js`, or run `python -m http.server 8000`.

### Interaction instructions

- Click a block directly to change its colour. Each block follows **white → red → yellow → blue → white** independently.
- Each press changes exactly one block once. Clicking a black divider or outside the canvas does nothing.
- Colour choices require no palette, keyboard selection, labels or buttons. There is no drag painting or swap mode.
- Optional keyboard controls: **Ctrl/⌘ + Z** to undo, **Ctrl/⌘ + Shift + Z** or **Ctrl/⌘ + Y** to redo, **C** to clear, and **S** to save a 500 × 500 PNG.

### Structure and techniques

`input-controls.js` contains the user-input mechanic. `ColourBlock` stores position, size, `colorIndex` and `clickCount`. Its `contains()` method uses bounds comparisons and logical operators; `changeColour()` uses `if / else` to advance or wrap the colour cycle; `display()` draws the current colour. `createBlock()` creates an instance and the controller adds it to the `blocks` array with `push()`. `for...of` loops find the clicked block and display all blocks. The global p5 `mousePressed()` callback receives canvas coordinates and delegates to the controller. `resetComposition()` resets the objects; snapshot history supports undo/redo. `sketch.js` uses `setup()` and `draw()` to assemble and render the mechanic. No time, audio or noise mechanic is implemented here.

**Ownership:** Jinsa Bai — User input, implemented with AI assistance. The static layout tests this individual contribution; team integration can pass shared region data to the constructor.

### AI and external references

ChatGPT (OpenAI) assisted in generating and explaining the user-input code, test layout, click cycling, history, tests and these notes. Assistance is also acknowledged in the JavaScript and CSS files. A hit test identifies the block under the click, its colour index advances through a fixed array, and snapshots restore colours and click counts for undo/redo. The contributor should review and understand the code before assessment.

- p5.js mouse input: https://p5js.org/reference/p5/mousePressed/
- p5.js reference: https://p5js.org/reference/ — canvas, colour fills, rectangles and PNG export. The library is bundled locally.
- Piet Mondrian's painting, named in Inspiration, informs the palette and unequal rectangular areas. The standalone layout was created separately for this mechanic.

### Validation

Run `node tests/input-controls.test.cjs`. Tests invoke the actual p5 callbacks with a minimal DOM/drawing adapter and check click cycling, independent blocks, divider/outside rejection, undo/redo, reset, export and a canvas-only page. These are logic tests, not a full browser test. To also render the demonstration PNG, install `@napi-rs/canvas` in your test environment and run `RENDER_PREVIEW=1 node tests/input-controls.test.cjs`.

![Composition created by clicking individual blocks](preview/jinsa-demo.png)
