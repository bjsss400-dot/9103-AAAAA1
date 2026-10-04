
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

Download [jinsa-square-only.html](jinsa-square-only.html) and open it in a browser. This self-contained offline preview displays **only the square canvas**. For development, open `index.html` with the bundled `libraries/p5.min.js`, or run `python -m http.server 8000`.

### Interaction instructions

- Each of the 17 blocks has a different fixed colour in a red, yellow or blue family. The first click produces a pale tint; each further click deepens that same colour. Eight clicks reach its darkest shade, and further clicks keep that shade while still recording the click count. There is no colour cycling. Each new shade fills upward inside its block in approximately 0.35 seconds.
- Each press changes exactly one block once. Clicking a black divider or outside the canvas does nothing.
- Colour choices require no palette, keyboard selection, labels or buttons. There is no drag painting or swap mode.
- Optional keyboard controls: **Ctrl/⌘ + Z** to undo, **Ctrl/⌘ + Shift + Z** or **Ctrl/⌘ + Y** to redo, **C** to clear, and **S** to save a 500 × 500 PNG.

### Structure and techniques

`user-input.js` contains the mechanic. `sketch.js` creates one canvas and calls the controller's update and display methods. Colour changes start only when a region is clicked; there are no scheduled changes, audio or noise mechanics. The animation stays inside the existing region and leaves the black dividers fixed. Plant examples from the presentation are adapted to `ColourBlock` objects, not additional plant drawings.

All 14 presentation techniques are actually called, with numbered comments in the source:

| # | Technique | Use in this artwork |
|---|---|---|
| 1 | `setup()` | Creates the single 500 × 500 square canvas and controller. |
| 2 | `draw()` | Calls update and draws the same canvas every frame. |
| 3 | `mousePressed()` | Passes a left click to the region hit test. |
| 4 | `if / else` | Returns paper for zero clicks; otherwise calculates colour depth from the count. |
| 5 | `>`, `<`, `===`, `&&`, `\|\|` | Tests growth, zero-click state, and canvas/region boundaries. |
| 6 | `clickCount`, `currentHeight`, `targetHeight` | Stores each block's click count and fill progress. |
| 7 | Custom functions | `createBlock()` creates objects; `resetComposition()` clears via C. |
| 8 | Arrays | `blocks = []` stores all existing regions. |
| 9 | `push()` | Adds each new block to the array. |
| 10 | `for...of` | Finds, updates and displays blocks. |
| 11 | Class, constructor, `new` | `class ColourBlock`, `constructor()` and `new ColourBlock()`. |
| 12 | Class methods | `contains()` tests clicks; `grow()` starts filling; `update()` advances it; `display()` renders it. |
| 13 | Global/local variables | Global `inputControls`; local canvas, grid coordinates, frame time and speed. |
| 14 | Separate script | `user-input.js`, loaded before `sketch.js`. |

**Ownership:** Jinsa Bai — User input, implemented with AI assistance. The static layout tests this individual contribution; team integration can pass shared region data to the constructor.

### AI and external references

ChatGPT (OpenAI) assisted in generating and explaining the user-input code, test layout, fixed colours, progressive colour depth, upward colour filling, history, tests and these notes. Assistance is also acknowledged in the JavaScript and CSS files. A hit test identifies the block under the click, its click count blends paper towards its own fixed RGB colour, and snapshots restore click counts (and therefore colour depth) for undo/redo. The contributor should review and understand the code before assessment.

- p5.js mouse input: https://p5js.org/reference/p5/mousePressed/
- p5.js reference: https://p5js.org/reference/ — canvas, colour fills, rectangles and PNG export. The library is bundled locally.
- Piet Mondrian's painting, named in Inspiration, informs the palette and unequal rectangular areas. The standalone layout was created separately for this mechanic.

### Validation

Run `node tests/user-input.test.cjs`. Tests invoke the actual p5 callbacks with a minimal DOM/drawing adapter and check 17 distinct fixed colours, progressively darker shades, the eight-click limit, actual grow/update progress and fill boundaries, independent blocks, divider/outside rejection, undo/redo, reset, export and both canvas-only entry pages. These are logic tests, not a full browser test. To also render the demonstration PNG, install `@napi-rs/canvas` in your test environment and run `RENDER_PREVIEW=1 node tests/user-input.test.cjs`.

![Composition created by clicking individual blocks](preview/jinsa-demo.png)
