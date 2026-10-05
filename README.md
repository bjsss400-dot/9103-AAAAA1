
1. Inspiration
Our project is inspired by Piet Mondrian's Composition with Large Red Plane, Yellow, Black, Gray and Blue (1921), held by Kunstmuseum Den Haag. The painting's horizontal and vertical divisions, unequal rectangular areas and contrasting colors provide the starting point for our digital interpretation.
Rather than display a finished copy, we turn the composition into a process: watch the black divisions appear one stroke at a time, then explore color through personal choices or computer-generated variation. All the mechanics intend to work on the same canvas. The drawing order is our own interpretation, not a reconstruction of Mondrian's historical painting process.

2. Techniques

Aokun's automatic colour mechanic uses random() to select 10–14 of the 20 cells and choose target colours from a limited palette. Each cell stores its own starting noisePosition. Perlin noise varies transition speed and gentle shading, while lerpColor() blends between colour endpoints. Intermediate colours appear during transitions.

On this branch, the original timed grid draws first. Automatic colouring starts when the grid is complete. The sketch repaints completed black strokes after the colour layer so that the grid remains visible. time-lines.js and the bundled p5 libraries remain unchanged.

3. Mechanic ownership
CHUNG-EN CHEN	Time-based	Develops progressive grid drawing, stroke order, drawing speed and pauses. 
	User input	
AOKUN LIU	Perlin noise and randomness	Develops random cell/colour selection, noise-driven variation, and P/G playback controls in noise-mechanic-okun.js.
	Audio	

4. AI acknowledgement
ChatGPT (OpenAI) assisted with generating the initial prototype, explaining its JavaScript and p5.js logic, and suggesting the probable structure of the code. It also helped discuss interaction ideas, prepare presentation material and draft this README.

OpenAI Codex also assisted Aokun with the colour module, its explanations, and integration with the timed grid. AI assistance is acknowledged in the JavaScript files.

5. External references

- https://p5js.org/reference/p5/random/
- https://p5js.org/reference/p5/noise/
- https://p5js.org/reference/p5/lerpColor/

6. Interaction instructions

Open `9103 creative coding/index.html` in a browser, or open the folder in VS Code and use Live Server. Keep the bundled libraries with the page.

- Wait for the black grid to finish drawing.
- With the browser page focused, press P to pause or resume automatic colour changes. Pausing keeps the current colours and selected cells.
- Press G to select another set of cells and colours and resume playback. Deselected cells return to the paper background.
- Refresh the page to replay the opening grid animation.

This is Aokun's `perlin-noise-okun` contribution branch, built on `time-based` commit `74b40016646d89bb7f9f8483ca461c6fd8117b87`. The colour module is the same implementation used for Aokun's Week 9 slide excerpts. This page preserves the timed opening before showing the colours. Audio and manual-colouring integration remain future group work.
