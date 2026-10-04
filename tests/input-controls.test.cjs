// Run the actual p5 callbacks and mechanic with a minimal drawing/DOM adapter.
// These are logic/render checks, not a real browser test.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const canvas = { style: {} };
let context, nativeCanvas, colour, saved = false;
if (process.env.RENDER_PREVIEW) {
  nativeCanvas = require('@napi-rs/canvas').createCanvas(500, 500);
  context = nativeCanvas.getContext('2d');
}
const sandbox = {
  console, width:500, height:500, mouseX:0, mouseY:0, mouseButton:'left', LEFT:'left',
  document:{ addEventListener(){}, createElement(){throw Error('No extra UI allowed');} },
  createCanvas(w,h){sandbox.width=w;sandbox.height=h;return {elt:canvas,parent(){}};},
  pixelDensity(){}, noStroke(){}, fill(c){colour=c;},
  rect(x,y,w,h){if(context){context.fillStyle=colour;context.fillRect(x,y,w,h);}},
  background(c){if(context){context.fillStyle=c;context.fillRect(0,0,500,500);}},
  saveCanvas(elt,name,type){assert.equal(elt,canvas);assert.equal(type,'png');saved=true;}
};
vm.createContext(sandbox);
for(const file of ['input-controls.js','sketch.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
const run=code=>vm.runInContext(code,sandbox);
run('setup()');
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS',name);}
function press(x,y,button='left'){sandbox.mouseX=x;sandbox.mouseY=y;sandbox.mouseButton=button;run('mousePressed()');}
const state=()=>JSON.stringify(run('inputControls.snapshot()'));
const block=id=>run(`inputControls.blocks[${id}].colorIndex`);
function key(value,extra={}){sandbox.event={key:value,target:{tagName:'BODY'},preventDefault(){},...extra};run('inputControls.keyDown(event)');}
check('initial composition contains 17 independent white blocks',()=>{assert.equal(run('inputControls.blocks.length'),17);assert.equal(run('inputControls.blocks.every(b=>b.colorIndex===0)'),true);});
check('one press changes only the selected block to red',()=>{press(170,170);assert.equal(block(5),1);assert.equal(run('inputControls.blocks.filter(b=>b.colorIndex!==0).length'),1);});
check('repeated presses cycle red, yellow, blue and white',()=>{for(const expected of [2,3,0]){press(170,170);assert.equal(block(5),expected);}assert.equal(run('inputControls.blocks[5].clickCount'),4);});
check('click counts and colours are independent between blocks',()=>{press(350,60);assert.equal(block(2),1);assert.equal(block(5),0);assert.equal(run('inputControls.blocks[2].clickCount'),1);});
check('black grid gaps and outside presses do not change any block',()=>{const before=state();for(const p of [[130,180],[-1,40],[500,40],[40,500]])press(...p);assert.equal(state(),before);});
check('right and middle presses do not change any block',()=>{const before=state();press(170,170,'right');press(170,170,'middle');assert.equal(state(),before);});
check('undo and redo restore both colour and click count',()=>{const before=state();press(170,170);const after=state();run('inputControls.undo()');assert.equal(state(),before);run('inputControls.redo()');assert.equal(state(),after);});
check('new colour changes discard redo history',()=>{run('inputControls.undo()');assert.equal(run('inputControls.redoStack.length'),1);press(50,400);assert.equal(run('inputControls.redoStack.length'),0);});
check('keyboard colour selection is unnecessary and inactive',()=>{const before=state();key('3');assert.equal(state(),before);});
check('C clears the composition and can be undone',()=>{const before=state();key('c');assert.equal(run('inputControls.blocks.every(b=>b.colorIndex===0&&b.clickCount===0)'),true);run('inputControls.undo()');assert.equal(state(),before);});
check('S invokes PNG export',()=>{key('s');assert.equal(saved,true);});
check('hit detection also works at a different p5 canvas size',()=>{sandbox.width=250;sandbox.height=250;const before=block(5);press(85,85);assert.equal(block(5),(before+1)%4);sandbox.width=500;sandbox.height=500;});
check('page body has only the canvas holder and scripts',()=>{const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const body=html.match(/<body>([\s\S]*?)<\/body>/)[1];assert(!/<(?:button|p|h[1-6]|header|aside|footer|span)\b/i.test(body));assert.equal(body.replace(/<script[^>]*>[\s\S]*?<\/script>/g,'').replace(/<div id="canvas-holder"><\/div>/,'').trim(),'');});
if(context){
 check('rendering keeps the divider black and colours inside a block',()=>{run('resetComposition()');press(170,170);run('draw()');const pixel=(x,y)=>Array.from(context.getImageData(x,y,1,1).data);assert.deepEqual(pixel(170,170),[200,59,50,255]);assert.deepEqual(pixel(130,180),[23,24,23,255]);});
 run('resetComposition()');
 for(const [x,y,n] of [[170,170,1],[350,60,2],[60,400,3],[350,280,3],[380,450,2]])for(let i=0;i<n;i++)press(x,y);
 run('draw()');
 fs.writeFileSync(path.join(root,'preview','jinsa-demo.png'),nativeCanvas.toBuffer('image/png'));
}
console.log(JSON.stringify({passed:checks,browserTest:false,preview:!!context}));
