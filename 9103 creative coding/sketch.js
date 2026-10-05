// Shared sketch: CHUNG-EN CHEN's timed grid + AOKUN LIU's colour mechanic.
// ChatGPT/OpenAI Codex assisted with this integration and its explanation.
let colourGridReady = false;

function setup() {
  const canvas = createCanvas(500, 500);
  canvas.parent('canvas-container');
  canvas.attribute('role', 'img');
  canvas.attribute('aria-label', 'A Mondrian grid with changing colour cells');
  noStroke();
  setupLines();
  setupNoiseMechanic();
}

function draw() {
  // Clear old colours so cells deselected by G return to the paper background.
  background('#F7F5ED');
  if (currentLineIndex >= lines.length) drawNoiseMechanic();

  // Clearing the canvas also clears the lines. Restore completed strokes
  // before the original time-based function draws the next part of a line.
  redrawCompletedLines();
  drawLines();
  drawBorder();

  if (!colourGridReady && currentLineIndex >= lines.length) {
    colourGridReady = true;
    updateColourStatus();
  }
}

function redrawCompletedLines() {
  for (let i = 0; i < currentLineIndex; i++) {
    // Match the original lineSpeed steps, including their final small overshoot.
    const finishedLength = Math.ceil(lines[i].len / lineSpeed) * lineSpeed;
    drawPartialLine(lines[i], finishedLength);
  }
}

function keyPressed(event) {
  if (!colourGridReady) return;
  if (event && (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.isComposing)) return;
  const target = event && event.target;
  if (target && (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName))) return;

  if (key === 'p' || key === 'P') {
    toggleNoiseMotion();
    updateColourStatus();
    return false;
  }
  if (key === 'g' || key === 'G') {
    regenerateNoiseColours();
    updateColourStatus();
    return false;
  }
}

function updateColourStatus() {
  const state = noiseMoving ? 'Playing' : 'Paused';
  const count = noiseCells.filter(cell => cell.active).length;
  document.getElementById('colour-status').textContent =
    state + ' · ' + count + ' coloured cells. P pauses or resumes. G generates new colours.';
}

// this code was generated with the help of ChatGPT, it gives the RGB number of dark gold
function drawBorder() {
  let borderThickness = 4;
  fill(166, 137, 80);
  rect(0, 0, width, borderThickness);
  rect(0, height - borderThickness, width, borderThickness);
  rect(0, 0, borderThickness, height);
  rect(width - borderThickness, 0, borderThickness, height);
}
