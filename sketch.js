// Independent User input prototype by Jinsa Bai, implemented with ChatGPT assistance.
// setup/draw only assemble the input mechanic and its own static test grid.
let inputControls;
function setup() {
  const canvas = createCanvas(500, 500);
  canvas.parent('canvas-holder');
  pixelDensity(1);
  inputControls = new InputControls(canvas.elt);
  inputControls.ready = true;
}
function draw() { renderArtwork(); }
function renderArtwork(showHover = true) {
  background('#171817');
  inputControls.draw(showHover);
}
