// User-input mechanic: Jinsa Bai, implemented with ChatGPT (OpenAI) assistance.
// [14] user-input.js is the independent mechanic; sketch.js assembles it.
// AI assisted with hit testing, click-triggered colour filling, history and structure.
// p5.js mouse input reference: https://p5js.org/reference/p5/mousePressed/
// This mechanic uses the 20 cells defined by the team time-based branch.
const PAPER_COLOUR = [255, 255, 255];
const MAX_SHADE_CLICKS = 8;
// One distinct, fixed RGB colour per region, within red/yellow/blue families.
// Clicking changes its depth only; colours are never cycled or reassigned.
const BLOCK_COLOURS = [
  [160, 32, 38], [24, 61, 139], [181, 130, 12], [31, 94, 154],
  [171, 49, 25], [153, 21, 34], [26, 77, 119], [165, 138, 22],
  [140, 43, 59], [35, 50, 127], [19, 92, 137], [185, 149, 26],
  [182, 37, 52], [37, 79, 151], [158, 108, 17], [157, 55, 28],
  [175, 153, 35], [146, 64, 42], [18, 105, 117], [195, 115, 24]
];
const GRID_SIZE = 320;
const FRAME_THICKNESS = 4;

// Cell bounds come from the team's existing 14 line objects, in 320-unit space.
// Black strokes start at x/y and occupy Thickness units, rather than being centred.
function createSharedRegions(lineData, thickness) {
  const top = lineData[0].y;
  const left = lineData[1].x;
  const main = lineData[2].x;
  const right = lineData[3].x;
  const middle = lineData[4].y;
  const topSplit = lineData[5].x;
  const leftUpper = lineData[6].y;
  const rightUpper = lineData[7].y;
  const rightSplit = lineData[8].x;
  const bottomSplit = lineData[9].x;
  const leftLower = lineData[10].y;
  const bottomMiddle = lineData[11].y;
  const bottomLeft = lineData[12].y;
  const lowest = lineData[13].y;
  const t = thickness;
  function region(x1, y1, x2, y2) { return [x1, y1, x2 - x1, y2 - y1]; }
  return [
    region(0, 0, topSplit, top),
    region(topSplit + t, 0, main, top),
    region(main + t, 0, right, top),
    region(right + t, 0, GRID_SIZE, bottomMiddle),
    region(0, top + t, left, leftUpper),
    region(left + t, top + t, main, middle),
    region(main + t, top + t, right, rightUpper),
    region(main + t, rightUpper + t, rightSplit, middle),
    region(rightSplit + t, rightUpper + t, right, middle),
    region(0, leftUpper + t, left, leftLower),
    region(left + t, middle + t, bottomSplit, bottomLeft),
    region(bottomSplit + t, middle + t, main, bottomMiddle),
    region(main + t, middle + t, right, bottomMiddle),
    region(0, leftLower + t, left, GRID_SIZE),
    region(bottomSplit + t, bottomMiddle + t, main, bottomLeft),
    region(main + t, bottomMiddle + t, right, lowest),
    region(right + t, bottomMiddle + t, GRID_SIZE, GRID_SIZE),
    region(left + t, bottomLeft + t, bottomSplit, GRID_SIZE),
    region(bottomSplit + t, bottomLeft + t, main, lowest),
    region(bottomSplit + t, lowest + t, right, GRID_SIZE)
  ];
}

// [11] class, constructor() and new ColourBlock() model each existing region.
class ColourBlock {
  constructor(id, x, y, w, h) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
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
  constructor(canvas, layout) {
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
    if (!isGridComplete()) return;
    if (canvasX < FRAME_THICKNESS || canvasY < FRAME_THICKNESS ||
      canvasX >= width - FRAME_THICKNESS || canvasY >= height - FRAME_THICKNESS) return;
    const gridX = canvasX * GRID_SIZE / width;
    const gridY = canvasY * GRID_SIZE / height;
    // A divider always wins the hit test, including the team's final stroke length.
    for (const line of lines) {
      const length = completedStrokeLength(line);
      const w = line.type === 'h' ? length : Thickness;
      const h = line.type === 'v' ? length : Thickness;
      if (gridX >= line.x && gridX < line.x + w &&
        gridY >= line.y && gridY < line.y + h) return;
    }
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
