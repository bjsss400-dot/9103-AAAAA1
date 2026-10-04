// Independent User input prototype by Jinsa Bai, implemented with ChatGPT assistance.
// Main sketch assembles the mechanic and displays only its square canvas.
// [13] Global variable: setup(), draw() and mousePressed() share this controller.
let inputControls;
// [1] setup() creates exactly one square canvas, once.
function setup() {
  const canvas = createCanvas(500, 500);
  canvas.parent('canvas-holder');
  pixelDensity(1);
  inputControls = new InputControls(canvas.elt);
}
// [2] draw() updates and renders the same artwork each frame.
function draw() {
  inputControls.update();
  renderArtwork();
}
function renderArtwork() {
  background('#171817');
  inputControls.display();
}
