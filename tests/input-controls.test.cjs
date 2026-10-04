// Logic tests run the actual input script with a minimal DOM and p5 drawing adapter.
// They do not replace a manual browser check of the final prototype.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const swatches = [], nodes = new Map();
function node() {
  return { style: {}, dataset: {}, attributes: {}, disabled: false, textContent: '',
    classList: { toggle() {} }, setAttribute(k,v) { this.attributes[k] = v; },
    addEventListener() {}, appendChild(child) { swatches.push(child); } };
}
const canvas = { style: {}, events: {},
  addEventListener(type, fn) { this.events[type] = fn; }, setPointerCapture() {},
  getBoundingClientRect() { return { left: 40, top: 80, width: 250, height: 250 }; }
};
let nativeCanvas, context, fillColour, saved = false;
if (process.env.RENDER_PREVIEW) {
  nativeCanvas = require('@napi-rs/canvas').createCanvas(500,500);
  context = nativeCanvas.getContext('2d');
}
const sandbox = {
  console,
  document: { getElementById(id) { if (!nodes.has(id)) nodes.set(id,node()); return nodes.get(id); },
    querySelectorAll() { return swatches; }, createElement: node, addEventListener() {} },
  createCanvas(w,h) { sandbox.width=w; sandbox.height=h; return { elt:canvas, parent(){} }; },
  width:500, height:500, pixelDensity(){}, noStroke(){},
  fill(colour) { fillColour=colour; },
  rect(x,y,w,h) { if (context) { context.fillStyle=fillColour; context.fillRect(x,y,w,h); } },
  background(colour) { if (context) { context.fillStyle=colour; context.fillRect(0,0,500,500); } },
  saveCanvas(elt,name,extension) { assert.equal(elt,canvas); assert.equal(extension,'png'); saved=true; }
};
vm.createContext(sandbox);
for (const file of ['input-controls.js','sketch.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
const run = code => vm.runInContext(code,sandbox);
run('setup()');
let checks=0;
function check(name,fn) { fn(); checks++; console.log('PASS',name); }
function event(x,y,extra={}) { return { clientX:40+x/2,clientY:80+y/2,button:0,pointerId:1,preventDefault(){},...extra }; }
function click(x,y,extra={}) { sandbox.e=event(x,y,extra); run('inputControls.pointerDown(e); inputControls.endStroke()'); }
function colourAt(x,y) { return run(`inputControls.regionAt({x:${x},y:${y}})?.colour`); }
const white=run('INPUT_PALETTE[3].hex'), red=run('INPUT_PALETTE[0].hex'), blue=run('INPUT_PALETTE[2].hex');
check('standalone canvas has 17 distinct regions and starts ready',()=>{ assert.equal(run('inputControls.regions.length'),17); assert.equal(run('inputControls.ready'),true); });
check('click mapping works on a half-size displayed canvas',()=>{ click(170,170); assert.equal(colourAt(170,170),red); });
check('a completed click creates one history entry',()=>assert.equal(run('inputControls.undoStack.length'),1));
check('grid gaps do not accept paint or create history',()=>{ click(130,180); assert.equal(run('inputControls.regionAt({x:130,y:180})'),null); assert.equal(run('inputControls.undoStack.length'),1); });
check('same-colour click is a no-op',()=>{ click(170,170); assert.equal(run('inputControls.undoStack.length'),1); });
check('undo restores white and redo restores red',()=>{ run('inputControls.undo()');assert.equal(colourAt(170,170),white);run('inputControls.redo()');assert.equal(colourAt(170,170),red); });
check('fast drag paints all crossed regions as a single step',()=>{
  run('inputControls.selectColour(2)'); sandbox.e=event(40,60);run('inputControls.pointerDown(e)');
  sandbox.e=event(460,60);run('inputControls.pointerMove(e);inputControls.endStroke()');
  for(const x of [40,150,350,460]) assert.equal(colourAt(x,60),blue);
  assert.equal(run('inputControls.undoStack.length'),2);
  run('inputControls.undo()'); for(const x of [40,150,350,460]) assert.equal(colourAt(x,60),white);
});
check('new painting clears the redo stack',()=>{ click(350,170);assert.equal(run('inputControls.redoStack.length'),0); });
check('two selected regions exchange colours',()=>{ run("inputControls.setMode('swap')");click(170,170);click(350,170);assert.equal(colourAt(170,170),blue);assert.equal(colourAt(350,170),red); });
check('colour exchange can be undone',()=>{run('inputControls.undo()');assert.equal(colourAt(170,170),red);assert.equal(colourAt(350,170),blue);});
check('clicking the same swap source cancels without a history entry',()=>{const n=run('inputControls.undoStack.length');click(170,170);click(170,170);assert.equal(run('inputControls.swapSource'),null);assert.equal(run('inputControls.undoStack.length'),n);});
check('clear is reversible',()=>{run('inputControls.clear()');assert.equal(run('inputControls.regions.every(r=>r.colour===INPUT_PALETTE[3].hex)'),true);run('inputControls.undo()');assert.equal(colourAt(170,170),red);});
check('right clicks and out-of-canvas clicks leave colours unchanged',()=>{const before=JSON.stringify(run('inputControls.snapshot()'));click(40,60,{button:2});click(-20,-20);assert.equal(JSON.stringify(run('inputControls.snapshot()')),before);});
check('keyboard colour and Escape controls work',()=>{sandbox.e={key:'2',target:{tagName:'BODY'}};run('inputControls.keyDown(e)');assert.equal(run('inputControls.selectedColour'),run('INPUT_PALETTE[1].hex'));run("inputControls.setMode('swap')");click(170,170);sandbox.e={key:'Escape',target:{tagName:'BODY'}};run('inputControls.keyDown(e)');assert.equal(run('inputControls.swapSource'),null);});
check('S key invokes the artwork renderer and PNG export API',()=>{sandbox.e={key:'s',target:{tagName:'BODY'},preventDefault(){}};run('inputControls.keyDown(e)');assert.equal(saved,true);});
check('C key clears colours and undo restores them',()=>{const before=JSON.stringify(run('inputControls.snapshot()'));sandbox.e={key:'c',target:{tagName:'BODY'}};run('inputControls.keyDown(e)');assert.equal(run('inputControls.regions.every(r=>r.colour===INPUT_PALETTE[3].hex)'),true);run('inputControls.undo()');assert.equal(JSON.stringify(run('inputControls.snapshot()')),before);});
check('canvas-only mechanic creates no controls or text nodes',()=>{assert.equal(swatches.length,0);assert.equal(nodes.size,0);});
check('colours are drawn above a black gap background',()=>{
  run("inputControls.setMode('paint');inputControls.selectColour(0)");click(170,170);
  run('renderArtwork(false)');
  if(context){ const pixel=(x,y)=>Array.from(context.getImageData(x,y,1,1).data);assert.deepEqual(pixel(170,170),[200,59,50,255]);assert.deepEqual(pixel(130,180),[23,24,23,255]); }
});
if(nativeCanvas) {
  // Demonstration arrangement created via the actual click/selection handlers.
  const paint=(index,x,y)=>{run(`inputControls.selectColour(${index})`);click(x,y);};
  run('inputControls.clear()');
  paint(0,170,170);paint(1,350,60);paint(2,60,400);paint(4,40,60);paint(2,350,280);paint(1,380,450);paint(5,460,400);
  run('renderArtwork(false)');
  fs.mkdirSync(path.join(root,'preview'),{recursive:true});
  fs.writeFileSync(path.join(root,'preview','jinsa-demo.png'),nativeCanvas.toBuffer('image/png'));
}
console.log(JSON.stringify({passed:checks,browserTest:false,preview:!!nativeCanvas}));
