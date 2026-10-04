// Runs the actual callbacks with a small DOM/drawing adapter, not a browser.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const project = path.join(root, '9103 creative coding');
function element(tagName) {
  return {
    tagName: tagName.toUpperCase(), style: {}, attributes: {}, children: [], listeners: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    getAttribute(name) { return this.attributes[name]; },
    appendChild(child) { this.children.push(child); },
    addEventListener(name, listener) { this.listeners[name] = listener; },
    click() { this.listeners.click(); }
  };
}
const canvas = element('canvas');
const palette = element('div');
palette.hidden = true;
let context, nativeCanvas, colour, saved = false, canvasCount = 0;
const cssColour = channels => channels.length === 1 && typeof channels[0] === 'string'
  ? channels[0] : 'rgb(' + (channels.length === 1 ? [channels[0], channels[0], channels[0]] : channels).join(',') + ')';
if (process.env.RENDER_PREVIEW) {
  nativeCanvas = require('@napi-rs/canvas').createCanvas(500, 500);
  context = nativeCanvas.getContext('2d');
}
const sandbox = {
  console, width: 500, height: 500, deltaTime: 1000 / 60,
  mouseX: 0, mouseY: 0, mouseButton: 'left', LEFT: 'left',
  document: {
    addEventListener() {},
    getElementById(id) { assert.equal(id, 'colour-palette'); return palette; },
    createElement(tag) { assert.equal(tag, 'button'); return element(tag); }
  },
  createCanvas(w, h) { canvasCount++; sandbox.width = w; sandbox.height = h; return { elt: canvas, parent() {} }; },
  pixelDensity() {}, noStroke() {}, fill(...channels) { colour = cssColour(channels); },
  rect(x, y, w, h) { if (context) { context.fillStyle = colour; context.fillRect(x, y, w, h); } },
  background(...channels) { if (context) { context.fillStyle = cssColour(channels); context.fillRect(0, 0, 500, 500); } },
  saveCanvas(elt, name, type) { assert.equal(elt, canvas); assert.equal(type, 'png'); saved = true; }
};
vm.createContext(sandbox);
for (const file of ['time-lines.js', 'user-input.js', 'sketch.js']) {
  vm.runInContext(fs.readFileSync(path.join(project, file), 'utf8'), sandbox, { filename: file });
}
const run = code => vm.runInContext(code, sandbox);
const state = () => JSON.stringify(run('inputControls.snapshot()'));
const count = id => run(`inputControls.blocks[${id}].clickCount`);
const colourIndex = id => run(`inputControls.blocks[${id}].colourIndex`);
const shade = id => Array.from(run(`inputControls.blocks[${id}].colourAt(inputControls.blocks[${id}].clickCount)`));
function press(x = 170, y = 170, button = 'left') {
  sandbox.mouseX = x; sandbox.mouseY = y; sandbox.mouseButton = button; run('mousePressed()');
}
function key(value, extra = {}) {
  sandbox.event = { key: value, target: { tagName: 'BODY' }, preventDefault() {}, ...extra };
  run('inputControls.keyDown(event)');
}
function settle() { for (let frame = 0; frame < 30; frame++) run('draw()'); }
function fresh() {
  key('c'); key('1');
  run('inputControls.undoStack = []; inputControls.redoStack = []');
  settle();
}
let checks = 0;
function check(name, fn) { fn(); checks++; console.log('PASS', name); }
run('setup()');
check('one canvas retains the original 14 strokes and 20 white cells', () => {
  assert.equal(canvasCount, 1); assert.equal(run('lines.length'), 14);
  assert.equal(run('inputControls.blocks.length'), 20);
  assert.equal(run('inputControls.blocks.every(b => b.clickCount === 0 && b.colourIndex === null)'), true);
  const bytes = fs.readFileSync(path.join(project, 'time-lines.js'));
  const hash = require('node:crypto').createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
  assert.equal(hash, 'ec28eda04d521a3859e19076c7881a56194d265e');
});
check('palette and painting wait until all original strokes finish', () => {
  assert.equal(palette.hidden, true); assert.equal(canvas.style.cursor, 'default');
  const before = state(); press(); key('2'); palette.children[2].click();
  assert.equal(state(), before); assert.equal(run('inputControls.selectedColourIndex'), 0);
  run('for (let i = 0; i < 2000 && !isGridComplete(); i++) draw()'); run('draw()');
  assert.equal(run('currentLineIndex'), 14);
  assert.equal(palette.hidden, false); assert.equal(canvas.style.cursor, 'pointer');
});
check('seven swatches have the required colour order and one highlight', () => {
  assert.equal(palette.children.length, 7);
  assert.deepEqual(Array.from(run('COLOUR_PALETTE.map(c => c.name)')),
    ['Red', 'Yellow', 'Blue', 'Navy', 'Light blue', 'Near black', 'White eraser']);
  assert.equal(palette.children.filter(el => el.getAttribute('aria-pressed') === 'true').length, 1);
});
check('swatch clicks and keys 1–7 select and highlight the same colour without painting', () => {
  const before = state();
  for (let index = 0; index < 7; index++) {
    palette.children[index].click(); assert.equal(run('inputControls.selectedColourIndex'), index);
    key(String(7 - index)); assert.equal(run('inputControls.selectedColourIndex'), 6 - index);
    assert.equal(palette.children[6 - index].getAttribute('aria-pressed'), 'true');
    assert.equal(palette.children.filter(el => el.getAttribute('aria-pressed') === 'true').length, 1);
  }
  assert.equal(state(), before); assert.equal(run('inputControls.undoStack.length'), 0); key('1');
});
check('a click paints only the chosen cell at level one and starts upward growth', () => {
  fresh(); press(); assert.equal(count(5), 1); assert.equal(colourIndex(5), 0);
  assert.equal(run('inputControls.blocks.filter(b => b.clickCount > 0).length'), 1);
  assert.equal(run('inputControls.blocks[5].currentHeight'), 0); run('draw()');
  assert(run('inputControls.blocks[5].currentHeight > 0 && inputControls.blocks[5].currentHeight < inputControls.blocks[5].h'));
  settle(); assert.equal(run('inputControls.blocks[5].currentHeight'), 166);
});
check('each of the six paint colours deepens monotonically through eight actual clicks', () => {
  for (let index = 0; index < 6; index++) {
    fresh(); key(String(index + 1)); let previous = [255, 255, 255];
    for (let depth = 1; depth <= 8; depth++) {
      press(); const next = shade(5);
      assert.equal(count(5), depth); assert.equal(colourIndex(5), index);
      assert(next.every((channel, i) => channel <= previous[i]));
      assert(next.some((channel, i) => channel < previous[i])); previous = next;
    }
    assert.deepEqual(shade(5), Array.from(run(`COLOUR_PALETTE[${index}].rgb`)));
  }
});
check('extra clicks at level eight leave count, fill and undo history unchanged', () => {
  const before = state(), history = run('inputControls.undoStack.length');
  const height = run('inputControls.blocks[5].currentHeight');
  for (let click = 0; click < 12; click++) press();
  assert.equal(state(), before); assert.equal(run('inputControls.undoStack.length'), history);
  assert.equal(run('inputControls.blocks[5].currentHeight'), height);
  key('z', { ctrlKey: true }); assert.equal(count(5), 7);
  key('y', { ctrlKey: true }); assert.equal(count(5), 8);
});
check('a different colour replaces a full-depth colour starting at level one', () => {
  key('3'); press(); assert.equal(count(5), 1); assert.equal(colourIndex(5), 2);
  assert.deepEqual(shade(5), [228, 234, 244]);
  key('z', { ctrlKey: true }); assert.equal(count(5), 8); assert.equal(colourIndex(5), 5);
  key('y', { ctrlKey: true }); assert.equal(count(5), 1); assert.equal(colourIndex(5), 2);
});
check('rapid same-colour clicks retain the existing fill height', () => {
  fresh(); press(); run('draw()'); const height = run('inputControls.blocks[5].currentHeight');
  press(); assert.equal(count(5), 2); assert.equal(run('inputControls.blocks[5].currentHeight'), height);
  run('draw()'); assert(run(`inputControls.blocks[5].currentHeight > ${height}`));
});
check('colour changes during a fill restart depth and keep the earlier painted part', () => {
  key('3'); press(); assert.equal(count(5), 1); assert.equal(colourIndex(5), 2);
  assert.equal(run('inputControls.blocks[5].currentHeight'), 0);
  assert.equal(run('inputControls.blocks[5].previousLayers.length'), 2);
});
check('each cell retains its own colour and depth when the selection changes', () => {
  fresh(); press(); press(); key('5'); press(350, 25);
  assert.equal(count(5), 2); assert.equal(colourIndex(5), 0);
  assert.equal(count(2), 1); assert.equal(colourIndex(2), 4);
});
check('white erases, resets depth and can be undone and redone', () => {
  settle(); const before = state(); key('7'); press(); settle();
  assert.equal(count(5), 0); assert.equal(colourIndex(5), null);
  assert.deepEqual(shade(5), [255, 255, 255]);
  key('z', { ctrlKey: true }); assert.equal(state(), before);
  key('y', { ctrlKey: true }); assert.equal(count(5), 0);
});
check('erasing an already blank cell leaves undo and redo history untouched', () => {
  key('z', { ctrlKey: true });
  const history = run('inputControls.undoStack.length'), redo = run('inputControls.redoStack.length');
  key('7'); press(100, 25);
  assert.equal(run('inputControls.undoStack.length'), history);
  assert.equal(run('inputControls.redoStack.length'), redo);
  key('y', { ctrlKey: true }); assert.equal(count(5), 0);
});
check('painting an erased cell starts again at level one', () => {
  key('4'); press(); assert.equal(count(5), 1); assert.equal(colourIndex(5), 3);
});
check('new paint changes discard redo history but selecting a swatch does not', () => {
  key('z', { ctrlKey: true }); const redo = run('inputControls.redoStack.length');
  assert.equal(redo, 1); key('2'); assert.equal(run('inputControls.redoStack.length'), redo);
  press(); assert.equal(run('inputControls.redoStack.length'), 0);
});
check('dividers, frame, outside presses and non-left buttons do not paint', () => {
  const before = state();
  for (const point of [[310, 180], [47, 180], [1, 1], [499, 250], [-1, 40], [500, 40], [40, 500]]) press(...point);
  press(170, 170, 'right'); press(170, 170, 'middle'); assert.equal(state(), before);
});
check('C clears colours without replaying lines and undo restores colours and depths', () => {
  const before = state(); key('c');
  assert.equal(run('inputControls.blocks.every(b => b.clickCount === 0 && b.colourIndex === null)'), true);
  assert.equal(run('currentLineIndex'), 14); assert.equal(palette.hidden, false);
  key('z', { metaKey: true }); assert.equal(state(), before);
  key('z', { metaKey: true, shiftKey: true });
  assert.equal(run('inputControls.blocks.every(b => b.clickCount === 0)'), true);
});
check('S saves only the artwork canvas as a PNG', () => { key('s'); assert.equal(saved, true); });
check('keyboard input in editable fields does not change colour selection', () => {
  key('2'); key('6', { target: { tagName: 'INPUT' } });
  assert.equal(run('inputControls.selectedColourIndex'), 1);
});
check('hit testing works with a scaled p5 canvas', () => {
  fresh(); sandbox.width = 250; sandbox.height = 250; press(85, 85);
  assert.equal(count(5), 1); sandbox.width = 500; sandbox.height = 500;
});
check('both entry pages contain only the canvas holder, hidden palette and scripts', () => {
  for (const file of [path.join(root, 'index.html'), path.join(project, 'index.html')]) {
    const html = fs.readFileSync(file, 'utf8');
    const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
    assert.equal(body.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
      .replace(/<div id="canvas-holder"><\/div>/, '')
      .replace(/<div id="colour-palette"[^>]* hidden><\/div>/, '').trim(), '');
  }
  assert.equal(fs.readFileSync(path.join(root, 'style.css'), 'utf8'), fs.readFileSync(path.join(project, 'style.css'), 'utf8'));
});
check('offline preview embeds the current mechanic, line module, sketch and styles', () => {
  const html = fs.readFileSync(path.join(root, 'jinsa-team-grid.html'), 'utf8');
  assert(!/<script\s+src=/.test(html));
  for (const file of ['time-lines.js', 'user-input.js', 'sketch.js']) {
    const source = fs.readFileSync(path.join(project, file), 'utf8').replaceAll('\r\n', '\n').replaceAll('</script>', '<\\/script>');
    assert(html.includes('<script>\n' + source + '\n</script>'));
  }
  assert(html.includes(fs.readFileSync(path.join(root, 'style.css'), 'utf8')));
  const body = html.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '').match(/<body>([\s\S]*?)<\/body>/)[1];
  assert.equal(body.replace(/<div id="canvas-holder"><\/div>/, '').replace(/<div id="colour-palette"[^>]* hidden><\/div>/, '').trim(), '');
});
if (context) {
  const pixel = (x, y) => Array.from(context.getImageData(x, y, 1, 1).data);
  check('rapid clicks do not flash a new background colour across the unfilled area', () => {
    fresh(); press(); run('draw()'); press(); run('draw()');
    assert.deepEqual(pixel(170, 170), [255, 255, 255, 255]);
    assert.deepEqual(pixel(170, 310), [...shade(5), 255]);
    key('3'); press(); run('renderArtwork()');
    assert.deepEqual(pixel(170, 170), [255, 255, 255, 255]);
    assert.deepEqual(pixel(170, 310), [231, 199, 201, 255]);
    settle(); assert.deepEqual(pixel(170, 170), [...shade(5), 255]);
  });
  check('an interrupted colour change and white erase rise from the bottom', () => {
    fresh(); press(); run('draw()'); key('3'); press(); run('draw()');
    assert.deepEqual(pixel(170, 170), [255, 255, 255, 255]);
    assert.deepEqual(pixel(170, 310), [...shade(5), 255]);
    key('7'); press(); run('renderArtwork()');
    assert.deepEqual(pixel(170, 310), [228, 234, 244, 255]);
    run('draw()'); assert.deepEqual(pixel(170, 310), [255, 255, 255, 255]);
    settle(); assert.deepEqual(pixel(170, 170), [255, 255, 255, 255]);
  });
  check('colour changes preserve black dividers and the original gold frame', () => {
    fresh(); key('6'); for (let i = 0; i < 8; i++) press(); settle();
    assert.deepEqual(pixel(170, 170), [24, 25, 27, 255]);
    assert.deepEqual(pixel(310, 180), [0, 0, 0, 255]);
    assert.deepEqual(pixel(1, 1), [166, 137, 80, 255]);
  });
  fresh();
  const centres = run('inputControls.blocks.map(b => [(b.x + b.w / 2) * width / GRID_SIZE, (b.y + b.h / 2) * height / GRID_SIZE])');
  for (let id = 0; id < centres.length; id++) {
    key(String(1 + (id === 5 ? 0 : id % 6)));
    for (let depth = 0; depth < 1 + id % 8; depth++) press(...centres[id]);
  }
  settle(); fs.writeFileSync(path.join(root, 'preview', 'jinsa-demo.png'), nativeCanvas.toBuffer('image/png'));
  if (process.env.RENDER_DEPTH_SEQUENCE) {
    const output = process.env.RENDER_DEPTH_SEQUENCE; fs.mkdirSync(output, { recursive: true }); fresh();
    fs.writeFileSync(path.join(output, 'depth-0.png'), nativeCanvas.toBuffer('image/png'));
    for (let depth = 1; depth <= 8; depth++) {
      for (let id = 0; id < centres.length; id++) { key(String(1 + (id === 5 ? 0 : id % 6))); press(...centres[id]); }
      settle(); fs.writeFileSync(path.join(output, `depth-${depth}.png`), nativeCanvas.toBuffer('image/png'));
    }
  }
}
console.log(JSON.stringify({ passed: checks, browserTest: false, preview: !!context }));
