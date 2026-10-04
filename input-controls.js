// User-input mechanic: Jinsa Bai, implemented with ChatGPT (OpenAI) assistance.
// AI assisted with hit testing, colour cycling, undo/redo and code structure.
// p5.js mouse input reference: https://p5js.org/reference/p5/mousePressed/
// The standalone test layout is independent of teammate scripts.
const COLOUR_CYCLE = ['#f8f6ef', '#c83b32', '#eac640', '#24568b'];
const GRID_SIZE = 500;
const GRID_GAP = 6;

// Unequal rectangles in a separately designed Mondrian-inspired test composition.
// Each entry is [x, y, width, height]. All interactions remain inside the square.
const INPUT_LAYOUT = [
  [0, 0, 80, 110], [80, 0, 230, 110], [310, 0, 110, 110],
  [420, 0, 80, 340], [0, 110, 130, 230], [130, 110, 180, 230],
  [310, 110, 55, 130], [365, 110, 55, 130],
  [310, 240, 55, 100], [365, 240, 55, 100],
  [0, 340, 130, 160], [130, 340, 180, 90], [130, 430, 180, 70],
  [310, 340, 110, 90], [310, 430, 110, 35], [310, 465, 110, 35],
  [420, 340, 80, 160]
];

class ColourBlock {
  constructor(id, x, y, w, h) {
    this.id = id;
    this.x = x + GRID_GAP / 2;
    this.y = y + GRID_GAP / 2;
    this.w = w - GRID_GAP;
    this.h = h - GRID_GAP;
    this.colorIndex = 0;
    this.clickCount = 0;
  }
  contains(x, y) {
    return x >= this.x && x < this.x + this.w &&
      y >= this.y && y < this.y + this.h;
  }
  changeColour() {
    this.clickCount++;
    if (this.colorIndex === COLOUR_CYCLE.length - 1) {
      this.colorIndex = 0;
    } else {
      this.colorIndex++;
    }
  }
  reset() { this.colorIndex = 0; this.clickCount = 0; }
  display() {
    noStroke();
    fill(COLOUR_CYCLE[this.colorIndex]);
    // Grid coordinates are scaled to the p5 canvas dimensions.
    rect(this.x * width / GRID_SIZE, this.y * height / GRID_SIZE,
      this.w * width / GRID_SIZE, this.h * height / GRID_SIZE);
  }
}

function createBlock(id, geometry) { return new ColourBlock(id, ...geometry); }

class InputControls {
  constructor(canvas, layout = INPUT_LAYOUT) {
    this.canvas = canvas;
    this.blocks = [];
    this.undoStack = [];
    this.redoStack = [];
    // push() creates one persistent object per region; clicks update that object.
    for (const geometry of layout) {
      this.blocks.push(createBlock(this.blocks.length, geometry));
    }
    canvas.style.cursor = 'pointer';
    document.addEventListener('keydown', event => this.keyDown(event));
  }
  snapshot() {
    return this.blocks.map(block => ({ colorIndex: block.colorIndex, clickCount: block.clickCount }));
  }
  restore(states) {
    for (let i = 0; i < this.blocks.length; i++) {
      this.blocks[i].colorIndex = states[i].colorIndex;
      this.blocks[i].clickCount = states[i].clickCount;
    }
  }
  recordChange(before) {
    this.undoStack.push(before);
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
  }
  handleClick(canvasX, canvasY) {
    if (canvasX < 0 || canvasY < 0 || canvasX >= width || canvasY >= height) return;
    const gridX = canvasX * GRID_SIZE / width;
    const gridY = canvasY * GRID_SIZE / height;
    for (const block of this.blocks) {
      if (block.contains(gridX, gridY)) {
        const before = this.snapshot();
        block.changeColour();
        this.recordChange(before);
        break; // A press changes exactly one block, once.
      }
    }
  }
  reset() {
    if (!this.blocks.some(block => block.colorIndex !== 0 || block.clickCount !== 0)) return;
    const before = this.snapshot();
    for (const block of this.blocks) block.reset();
    this.recordChange(before);
  }
  undo() {
    if (this.undoStack.length === 0) return;
    this.redoStack.push(this.snapshot());
    this.restore(this.undoStack.pop());
  }
  redo() {
    if (this.redoStack.length === 0) return;
    this.undoStack.push(this.snapshot());
    this.restore(this.redoStack.pop());
  }
  save() {
    renderArtwork();
    saveCanvas(this.canvas, 'my-mondrian-composition', 'png');
  }
  keyDown(event) {
    if (/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
    const key = event.key.toLowerCase();
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) this.redo();
      else this.undo();
    } else if (modifier && key === 'y') {
      event.preventDefault();
      this.redo();
    } else if (!modifier && !event.altKey && key === 'c') {
      resetComposition();
    } else if (!modifier && !event.altKey && key === 's' && !event.repeat) {
      event.preventDefault();
      this.save();
    }
  }
  display() { for (const block of this.blocks) block.display(); }
}

// p5.js supplies mouseX/mouseY in canvas coordinates, including CSS scaling.
function mousePressed() {
  if (mouseButton !== LEFT) return;
  if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
    inputControls.handleClick(mouseX, mouseY);
    return false;
  }
}
function resetComposition() { inputControls.reset(); }
