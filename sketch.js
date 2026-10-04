// Independent User input prototype by Jinsa Bai, implemented with ChatGPT assistance.
// Main sketch assembles the mechanic and displays only its square canvas.
let inputControls;
function setup() {
  const canvas = createCanvas(500, 500);
  canvas.parent('canvas-holder');
  pixelDensity(1);
  inputControls = new InputControls(canvas.elt);
}
function draw() { renderArtwork(); }
function renderArtwork() {
  background('#171817');
  inputControls.display();
}
