// User-input mechanic: Jinsa Bai, implemented with assistance from ChatGPT (OpenAI).
// AI assisted with region detection, pointer interactions and code structure.
// This standalone mechanic uses its own static test layout; no teammate scripts are loaded.
const INPUT_PALETTE = [
  { name: 'Red', hex: '#c83b32' },
  { name: 'Yellow', hex: '#eac640' },
  { name: 'Blue', hex: '#24568b' },
  { name: 'White', hex: '#f8f6ef' },
  { name: 'Gray', hex: '#aaa79e' },
  { name: 'Black', hex: '#171817' }
];
const GRID_SIZE = 500;
const GRID_GAP = 6;

class ColourRegion {
  constructor(id, cells) {
    this.id = id;
    this.cells = cells;
    this.colour = INPUT_PALETTE[3].hex;
  }
  contains(x, y) {
    return this.cells.some(c => x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h);
  }
  draw(overlay = null) {
    fill(overlay || this.colour);
    noStroke();
    for (const c of this.cells) {
      // Overlap removes subpixel seams; the black lines are drawn above the fills.
      rect(c.x * width / GRID_SIZE, c.y * height / GRID_SIZE,
        c.w * width / GRID_SIZE + 0.2, c.h * height / GRID_SIZE + 0.2);
    }
  }
}

// Independently designed unequal rectangles for testing the user-input mechanic.
// These are an interpretation of Mondrian, not a reproduction of the painting.
// Each entry is [x, y, width, height] in a 500 × 500 coordinate system.
const INPUT_LAYOUT = [
  [0, 0, 80, 110], [80, 0, 230, 110], [310, 0, 110, 110],
  [420, 0, 80, 340], [0, 110, 130, 230], [130, 110, 180, 230],
  [310, 110, 55, 130], [365, 110, 55, 130],
  [310, 240, 55, 100], [365, 240, 55, 100],
  [0, 340, 130, 160], [130, 340, 180, 90], [130, 430, 180, 70],
  [310, 340, 110, 90], [310, 430, 110, 35], [310, 465, 110, 35],
  [420, 340, 80, 160]
];
function buildInputRegions(layout) {
  return layout.map(([x, y, w, h], id) => new ColourRegion(id, [{
    x: x + GRID_GAP / 2, y: y + GRID_GAP / 2,
    w: w - GRID_GAP, h: h - GRID_GAP
  }]));
}

class InputControls {
  constructor(canvas, layout = INPUT_LAYOUT) {
    this.canvas = canvas;
    this.regions = buildInputRegions(layout);
    this.selectedColour = INPUT_PALETTE[0].hex;
    this.ready = false;
    this.hovered = null;
    this.strokeStart = null;
    this.previousPoint = null;
    this.mode = 'paint';
    this.swapSource = null;
    this.undoStack = [];
    this.redoStack = [];
    this.status = 'Choose a colour, then click or drag to paint.';
    this.activePointer = null;
    canvas.addEventListener('pointerdown', event => this.pointerDown(event));
    canvas.addEventListener('pointermove', event => this.pointerMove(event));
    canvas.addEventListener('pointerup', () => this.endStroke());
    canvas.addEventListener('pointercancel', () => this.endStroke());
    canvas.addEventListener('lostpointercapture', () => this.endStroke());
    canvas.addEventListener('pointerleave', () => { this.hovered = null; });
    document.addEventListener('keydown', event => this.keyDown(event));

  }
  snapshot() { return this.regions.map(r => r.colour); }
  restore(colours) { this.regions.forEach((region, i) => { region.colour = colours[i]; }); }
  recordChange(before) {
    if (before.some((colour, i) => colour !== this.regions[i].colour)) {
      this.undoStack.push(before);
      if (this.undoStack.length > 100) this.undoStack.shift();
      this.redoStack = [];
    }
    this.updateUI();
  }
  selectColour(index) {
    this.selectedColour = INPUT_PALETTE[index].hex;
    this.setMode('paint');
  }
  setMode(mode) {
    this.endStroke();
    this.mode = mode;
    this.swapSource = null;
    this.status = mode === 'swap' ? 'Choose two regions to exchange their colours.' : 'Click or drag across the grid to paint.';
    this.updateUI();
  }
  swap(region) {
    if (!this.swapSource) {
      this.swapSource = region;
      this.status = 'Now choose a second region. Esc cancels.';
    } else if (this.swapSource === region) {
      this.swapSource = null;
      this.status = 'Selection cancelled. Choose two regions.';
    } else {
      const before = this.snapshot();
      [this.swapSource.colour, region.colour] = [region.colour, this.swapSource.colour];
      this.swapSource = null;
      this.recordChange(before);
      this.status = 'Colours exchanged. Try another pair.';
    }
    this.updateUI();
  }
  undo() {
    if (!this.ready) return;
    this.endStroke();
    if (!this.undoStack.length) return;
    this.redoStack.push(this.snapshot());
    this.restore(this.undoStack.pop());
    this.swapSource = null;
    this.status = 'Last change undone.';
    this.updateUI();
  }
  redo() {
    if (!this.ready) return;
    this.endStroke();
    if (!this.redoStack.length) return;
    this.undoStack.push(this.snapshot());
    this.restore(this.redoStack.pop());
    this.swapSource = null;
    this.status = 'Change restored.';
    this.updateUI();
  }
  clear() {
    if (!this.ready) return;
    this.endStroke();
    const before = this.snapshot();
    this.regions.forEach(region => { region.colour = INPUT_PALETTE[3].hex; });
    this.swapSource = null;
    this.recordChange(before);
    this.status = 'A fresh canvas. Your previous colours can be restored with Undo.';
    this.updateUI();
  }
  keyDown(event) {
    if (!this.ready || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      event.shiftKey ? this.redo() : this.undo();
    } else if (modifier && event.key.toLowerCase() === 'y') {
      event.preventDefault(); this.redo();
    } else if (!modifier && /^[1-6]$/.test(event.key)) {
      this.selectColour(Number(event.key) - 1);
    } else if (!modifier && event.key.toLowerCase() === 'x') {
      this.setMode(this.mode === 'swap' ? 'paint' : 'swap');
    } else if (event.key === 'Escape') {
      this.swapSource = null;
      this.status = 'Selection cancelled.';
      this.updateUI();
    }
  }
  updateUI() {} // Bound to visible controls in the interface stage.
  regionAt(point) { return this.regions.find(r => r.contains(point.x, point.y)) || null; }
  pointFromEvent(event) {
    const bounds = this.canvas.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) / bounds.width * GRID_SIZE,
      y: (event.clientY - bounds.top) / bounds.height * GRID_SIZE };
  }
  pointerDown(event) {
    if (!this.ready || event.button !== 0 || this.strokeStart) return;
    event.preventDefault();
    const point = this.pointFromEvent(event), region = this.regionAt(point);
    if (!region) return;
    if (this.mode === 'swap' || event.shiftKey) { this.swap(region); return; }
    this.swapSource = null;
    this.canvas.setPointerCapture(event.pointerId);
    this.activePointer = event.pointerId;
    this.strokeStart = this.snapshot();
    this.previousPoint = point;
    region.colour = this.selectedColour;
  }
  pointerMove(event) {
    const point = this.pointFromEvent(event);
    this.hovered = this.ready ? this.regionAt(point) : null;
    if (!this.strokeStart || event.pointerId !== this.activePointer) return;
    // Sample between pointer events so fast drags also paint narrow regions.
    const previous = this.previousPoint, distance = Math.hypot(point.x - previous.x, point.y - previous.y);
    const steps = Math.max(1, Math.ceil(distance / 2));
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      const region = this.regionAt({ x: previous.x + (point.x - previous.x) * t,
        y: previous.y + (point.y - previous.y) * t });
      if (region) region.colour = this.selectedColour;
    }
    this.previousPoint = point;
  }
  endStroke() {
    const before = this.strokeStart;
    this.strokeStart = null;
    this.previousPoint = null;
    this.activePointer = null;
    if (before) this.recordChange(before);
  }
  draw(showHover = true) {
    for (const region of this.regions) region.draw();
    if (showHover && this.hovered) this.hovered.draw('rgba(0, 0, 0, 0.07)');
    if (showHover && this.swapSource) this.swapSource.draw('rgba(234, 198, 64, 0.4)');
  }
}
