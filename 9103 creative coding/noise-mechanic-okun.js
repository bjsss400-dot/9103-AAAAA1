// Member C / Okun: Perlin noise AND randomness, multiple colour cells.
// AI acknowledgement: ChatGPT helped draft, explain and test this mechanic.
// Week 8 Tutorial: saved random properties and continuous noise sampling.
// Additional p5.js function: https://p5js.org/reference/p5/lerpColor/
// These 20 rectangles match the team's CURRENT fixed grid (time-based 74b4001).
// If line positions change in future, both members must update shared geometry.
const noiseCellLayout = [
  [0,0,70,32], [75,0,121,32], [201,0,100,32], [306,0,14,246],
  [0,37,28,81], [33,37,163,166], [201,37,100,80],
  [201,122,49,81], [255,122,46,81], [0,123,28,123],
  [33,208,81,79], [119,208,77,38], [201,208,100,38],
  [0,251,28,69], [119,251,77,36], [201,251,100,56],
  [306,251,14,69], [33,292,81,28], [119,292,77,15], [119,312,182,8]
];

// Limited endpoint palette: red, yellow, blue, navy, pale blue, near-black.
// RGB blending creates intermediate colours between these endpoints.
const noisePalette = ['#E43D30', '#F4D329', '#2866CE', '#173B79', '#BDDCEB', '#23272E'];
let noiseCells = [];
let noiseMoving = true;

class ColourCell {
  constructor(bounds) {
    [this.x, this.y, this.w, this.h] = bounds;
    this.noisePosition = random(1000); // Different starting point for each cell.
    this.active = false; // Inactive cells keep the paper background this round.
    this.fromHex = null;
    this.toHex = null;
    this.progress = 0;
    this.light = 1;
  }

  randomiseColour(startHex) {
    // G deliberately jumps to a new start and interrupts the previous journey.
    this.fromHex = startHex;
    this.chooseTarget();
    this.progress = 0;
    this.light = 1;
  }

  chooseTarget() {
    const choices = noisePalette.filter(c => c !== this.fromHex);
    this.toHex = random(choices);
  }

  update(seconds) {
    if (this.progress >= 1) {
      this.fromHex = this.toHex; // Continue from the colour just reached.
      this.chooseTarget();
      this.progress = 0;
    }
    this.noisePosition += seconds * 0.35;
    const noiseValue = noise(this.noisePosition);
    const speed = 0.14 + noiseValue * 0.18;
    this.progress = Math.min(1, this.progress + seconds * speed);
    this.light = 0.90 + noise(this.noisePosition + 200) * 0.10;
  }

  display() {
    const mixed = lerpColor(color(this.fromHex), color(this.toHex), this.progress);
    fill(red(mixed) * this.light, green(mixed) * this.light, blue(mixed) * this.light);
    rect(this.x, this.y, this.w, this.h);
  }
}

// Call once after the group's createCanvas() and setupLines().
function setupNoiseMechanic() {
  noiseCells = noiseCellLayout.map(bounds => new ColourCell(bounds));
  randomiseNoiseColours();
}

// Reassign 10-14 cells, keeping the remaining cells white for this round.
// Every round starts with the six endpoint colours distributed across the grid.
function randomiseNoiseColours() {
  const order = shuffle(noiseCells);
  const colours = shuffle(noisePalette);
  const count = Math.floor(random(10, 15));
  for (let i = 0; i < order.length; i++) {
    order[i].active = i < count;
    if (order[i].active) order[i].randomiseColour(colours[i % colours.length]);
  }
}

// P pauses or resumes only this colour mechanic. The current cells and RGB stay.
function toggleNoiseMotion() {
  noiseMoving = !noiseMoving;
}

// G begins a fresh colour round and resumes motion, even after a pause.
function regenerateNoiseColours() {
  randomiseNoiseColours();
  noiseMoving = true;
}

// Paint before the visible black strokes; preserve the other members' settings.
function drawNoiseMechanic() {
  const seconds = Math.min(deltaTime / 1000, 0.05);
  push();
  colorMode(RGB, 255);
  noStroke();
  scale(width / 320, height / 320);
  for (const cell of noiseCells) {
    if (!cell.active) continue;
    if (noiseMoving) cell.update(seconds);
    cell.display();
  }
  pop();
}
