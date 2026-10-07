// Team canvas: CHUNG-EN CHEN's time-based grid plus Jinsa Bai's User input.
// ChatGPT assisted with integrating the drawing order and the shared cell bounds.
// [13] Global controller used by setup(), draw() and mousePressed().
let inputControls;

// [1] One canvas, using the original team's dimensions and setupLines().
function setup() {
  const canvas = createCanvas(500, 500);
  canvas.parent('canvas-holder');
  pixelDensity(1);
  noStroke();
  setupLines();
  inputControls = new InputControls(canvas.elt, createSharedRegions(lines, Thickness));
}

// [2] Colours sit underneath the team's visible strokes on the same canvas.
function draw() {
  inputControls.update();
  renderArtwork();
  drawLines();
  drawBorder();
}

function isGridComplete() { return currentLineIndex >= lines.length; }

// The original module advances by lineSpeed, so its last frame can pass len.
// Repaint the same reached length to preserve the original visible geometry.
function completedStrokeLength(line) {
  return Math.ceil(line.len / lineSpeed) * lineSpeed;
}

function renderArtwork() {
  background(...PAPER_COLOUR);
  if (isGridComplete()) inputControls.display();
  for (let i = 0; i < currentLineIndex; i++) {
    drawPartialLine(lines[i], completedStrokeLength(lines[i]));
  }
  if (currentLineIndex < lines.length && currentLength > 0) {
    drawPartialLine(lines[currentLineIndex], currentLength);
  }
  drawBorder();
}

// Original dark-gold frame from the teammate's sketch.
// this code was generated with the help of ChatGPT, it gives the RGB number of dark gold
function drawBorder() {
  let borderThickness = 4;
  fill(166, 137, 80);
  rect(0, 0, width, borderThickness);
  rect(0, height - borderThickness, width, borderThickness);
  rect(0, 0, borderThickness, height);
  rect(width - borderThickness, 0, borderThickness, height);
}
