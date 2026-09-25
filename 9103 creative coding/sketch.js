function setup() {
  createCanvas(500, 500);
  noStroke();
  setupLines();
}

function draw() {
  drawLines();
  drawBorder();
}

function drawBorder() {
  let borderThickness = 4;
  fill(166, 137, 80);
  rect(0, 0, width, borderThickness);
  rect(0, height - borderThickness, width, borderThickness);
  rect(0, 0, borderThickness, height);
  rect(width - borderThickness, 0, borderThickness, height);
}