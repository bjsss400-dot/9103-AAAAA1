// User-input mechanic: Jinsa Bai, implemented with ChatGPT (OpenAI) assistance.
// [14] user-input.js is the independent mechanic; sketch.js assembles it.
// AI assisted with hit testing, click-triggered colour filling, history and structure.
// p5.js mouse input reference: https://p5js.org/reference/p5/mousePressed/
// The standalone test layout is independent of teammate scripts.
const PAPER_COLOUR = [248, 246, 239];
const MAX_SHADE_CLICKS = 8;
// One distinct, fixed RGB colour per region, within red/yellow/blue families.
// Clicking changes its depth only; colours are never cycled or reassigned.
const BLOCK_COLOURS = [
  [160, 32, 38], [24, 61, 139], [181, 130, 12], [31, 94, 154],
  [171, 49, 25], [153, 21, 34], [26, 77, 119], [165, 138, 22],
  [140, 43, 59], [35, 50, 127], [19, 92, 137], [185, 149, 26],
  [182, 37, 52], [37, 79, 151], [158, 108, 17], [157, 55, 28],
  [175, 153, 35]
];
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

// [11] class, constructor() and new ColourBlock() model each existing region.
class ColourBlock {
  constructor(id, x, y, w, h) {
    this.id = id;
    this.x = x + GRID_GAP / 2;
    this.y = y + GRID_GAP / 2;
    this.w = w - GRID_GAP;
    this.h = h - GRID_GAP;
    this.baseColour = BLOCK_COLOURS[id % BLOCK_COLOURS.length];
    this.clickCount = 0;
    // [6] Instance variables record input and the height of its colour fill.
    this.currentHeight = this.h;
    this.targetHeight = this.h;
    this.previousClickCount = 0;
  }
  // [12] contains() checks whether a mouse press is inside this region.
  contains(x, y) {
    return x >= this.x && x < this.x + this.w &&
      y >= this.y && y < this.y + this.h;
  }
  // [12] grow() is started only by a click; there are no automatic colour events.
  grow() {
    this.previousClickCount = this.clickCount;
    this.clickCount++;
    this.currentHeight = 0;
    this.targetHeight = this.h;
  }
  // Blend paper into this block's fixed colour, in eight depth steps.
  colourAt(count) {
    // [4, 5] if / else and === separate untouched paper from coloured blocks.
    if (count === 0) {
      return PAPER_COLOUR;
    } else {
      const strength = Math.min(count, MAX_SHADE_CLICKS) / MAX_SHADE_CLICKS;
      return this.baseColour.map((channel, index) =>
        Math.round(PAPER_COLOUR[index] + (channel - PAPER_COLOUR[index]) * strength));
    }
  }
  // [12] update() advances the click-triggered fill, contained inside this block.
  update() {
    // [5] >, < and && ensure that only an unfinished fill advances.
    if (this.targetHeight > 0 && this.currentHeight < this.targetHeight) {
      // [13] Local variables exist only during this update; object state persists.
      const frameSeconds = Math.min(Math.max(deltaTime, 0), 50) / 1000;
      const growthSpeed = this.h / 0.35;
      this.currentHeight = Math.min(this.targetHeight,
        this.currentHeight + growthSpeed * frameSeconds);
    } else {
      this.currentHeight = this.targetHeight;
    }
  }
  reset() {
    this.clickCount = 0;
    this.previousClickCount = 0;
    this.currentHeight = this.h;
    this.targetHeight = this.h;
  }
  // [12] display() draws the previous colour and the rising new colour.
  display() {
    noStroke();
    fill(...this.colourAt(this.previousClickCount));
    rect(this.x * width / GRID_SIZE, this.y * height / GRID_SIZE,
      this.w * width / GRID_SIZE, this.h * height / GRID_SIZE);
    fill(...this.colourAt(this.clickCount));
    rect(this.x * width / GRID_SIZE,
      (this.y + this.h - this.currentHeight) * height / GRID_SIZE,
      this.w * width / GRID_SIZE, this.currentHeight * height / GRID_SIZE);
  }
}

// [7, 11] Custom factory function creates an instance with new.
function createBlock(id, geometry) { return new ColourBlock(id, ...geometry); }

class InputControls {
  constructor(canvas, layout = INPUT_LAYOUT) {
    this.canvas = canvas;
    this.blocks = []; // [8] An array stores all the existing square-canvas regions.
    this.undoStack = [];
    this.redoStack = [];
    // [9] push() adds a persistent object per region; clicks update that object.
    for (const geometry of layout) {
      this.blocks.push(createBlock(this.blocks.length, geometry));
    }
    canvas.style.cursor = 'pointer';
    document.addEventListener('keydown', event => this.keyDown(event));
  }
  snapshot() {
    return this.blocks.map(block => ({ clickCount: block.clickCount }));
  }
  restore(states) {
    for (let i = 0; i < this.blocks.length; i++) {
      this.blocks[i].clickCount = states[i].clickCount;
      this.blocks[i].previousClickCount = states[i].clickCount;
      this.blocks[i].currentHeight = this.blocks[i].h;
      this.blocks[i].targetHeight = this.blocks[i].h;
    }
  }
  recordChange(before) {
    this.undoStack.push(before);
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
  }
  handleClick(canvasX, canvasY) {
    // [5] || rejects a press if any boundary condition is outside the canvas.
    if (canvasX < 0 || canvasY < 0 || canvasX >= width || canvasY >= height) return;
    const gridX = canvasX * GRID_SIZE / width;
    const gridY = canvasY * GRID_SIZE / height;
    for (const block of this.blocks) {
      if (block.contains(gridX, gridY)) {
        const before = this.snapshot();
        block.grow();
        this.recordChange(before);
        break; // A press changes exactly one block, once.
      }
    }
  }
  reset() {
    if (!this.blocks.some(block => block.clickCount > 0)) return;
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
  // [10] for...of updates and displays every stored block.
  update() { for (const block of this.blocks) block.update(); }
  display() { for (const block of this.blocks) block.display(); }
}

// p5.js supplies mouseX/mouseY in canvas coordinates, including CSS scaling.
// [3] p5 calls mousePressed() when the user presses the mouse.
function mousePressed() {
  if (mouseButton !== LEFT) return;
  if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
    inputControls.handleClick(mouseX, mouseY);
    return false;
  }
}
// [7] Custom reset function is used by the invisible C keyboard shortcut.
function resetComposition() { inputControls.reset(); }
