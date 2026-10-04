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
  console, width:500, height:500, deltaTime:1000/60, mouseX:0, mouseY:0, mouseButton:'left', LEFT:'left',
  document:{ addEventListener(){}, createElement(){throw Error('No extra UI allowed');} },
  createCanvas(w,h){sandbox.width=w;sandbox.height=h;return {elt:canvas,parent(){}};},
  pixelDensity(){}, noStroke(){}, fill(...channels){colour=channels.length === 1 ? channels[0] : "rgb("+channels.join(",")+")";},
  rect(x,y,w,h){if(context){context.fillStyle=colour;context.fillRect(x,y,w,h);}},
  background(c){if(context){context.fillStyle=c;context.fillRect(0,0,500,500);}},
  saveCanvas(elt,name,type){assert.equal(elt,canvas);assert.equal(type,'png');saved=true;}
};
vm.createContext(sandbox);
for(const file of ['user-input.js','sketch.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
const run=code=>vm.runInContext(code,sandbox);
run('setup()');
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS',name);}
function press(x,y,button='left'){sandbox.mouseX=x;sandbox.mouseY=y;sandbox.mouseButton=button;run('mousePressed()');}
const state=()=>JSON.stringify(run('inputControls.snapshot()'));
const block=id=>run(`inputControls.blocks[${id}].clickCount`);
const shade=(id,count)=>Array.from(run(`inputControls.blocks[${id}].colourAt(${count})`));
function settle(){for(let frame=0;frame<30;frame++)run('draw()');}
function key(value,extra={}){sandbox.event={key:value,target:{tagName:'BODY'},preventDefault(){},...extra};run('inputControls.keyDown(event)');}
check('initial composition contains 17 independent white blocks',()=>{assert.equal(run('inputControls.blocks.length'),17);assert.equal(run('inputControls.blocks.every(b=>b.clickCount===0)'),true);});
check('one press adds a pale fixed colour to only the selected block',()=>{press(170,170);assert.equal(block(5),1);assert.equal(run('inputControls.blocks.filter(b=>b.clickCount!==0).length'),1);});
check('click starts growth, draw updates height and fill stops at the block edge',()=>{
 assert.equal(run('inputControls.blocks[5].currentHeight'),0);
 assert.equal(run('inputControls.blocks[5].targetHeight'),224);
 run('draw()');
 assert(run('inputControls.blocks[5].currentHeight > 0 && inputControls.blocks[5].currentHeight < inputControls.blocks[5].targetHeight'));
 settle();assert.equal(run('inputControls.blocks[5].currentHeight'),224);
 const before=state();settle();assert.equal(state(),before);
});
check('all 17 blocks have different fixed colours at the same click depth',()=>{
 for(const count of [1,4,8])assert.equal(new Set(Array.from({length:17},(_,id)=>shade(id,count).join(','))).size,17);
});
check('every colour deepens monotonically for the first eight clicks and never cycles',()=>{
 for(let id=0;id<17;id++){
  let previous=shade(id,0);
  for(let count=1;count<=8;count++){
   const next=shade(id,count);
   assert(next.every((channel,i)=>channel<=previous[i]));
   assert(next.some((channel,i)=>channel<previous[i]));previous=next;
  }
  assert.deepEqual(shade(id,9),shade(id,8));
  assert.deepEqual(shade(id,30),shade(id,8));
 }
});
check('repeated actual clicks keep the same base colour and accumulate depth',()=>{
 const before=Array.from(run('inputControls.blocks[5].baseColour'));
 for(let count=2;count<=10;count++){press(170,170);assert.equal(block(5),count);}
 assert.deepEqual(Array.from(run('inputControls.blocks[5].baseColour')),before);
 assert.equal(run('inputControls.blocks[5].clickCount'),10);
});
check('click counts and colour depth are independent between blocks',()=>{
 press(350,60);assert.equal(block(2),1);assert.equal(block(5),10);
});
check('black grid gaps and outside presses do not change any block',()=>{const before=state();for(const p of [[130,180],[-1,40],[500,40],[40,500]])press(...p);assert.equal(state(),before);});
check('right and middle presses do not change any block',()=>{const before=state();press(170,170,'right');press(170,170,'middle');assert.equal(state(),before);});
check('undo and redo restore the colour depth through its click count',()=>{const before=state();press(170,170);const after=state();run('inputControls.undo()');assert.equal(state(),before);run('inputControls.redo()');assert.equal(state(),after);});
check('new colour changes discard redo history',()=>{run('inputControls.undo()');assert.equal(run('inputControls.redoStack.length'),1);press(50,400);assert.equal(run('inputControls.redoStack.length'),0);});
check('keyboard colour selection is unnecessary and inactive',()=>{const before=state();key('3');assert.equal(state(),before);});
check('C clears the composition and can be undone',()=>{const before=state();key('c');assert.equal(run('inputControls.blocks.every(b=>b.clickCount===0&&b.clickCount===0)'),true);run('inputControls.undo()');assert.equal(state(),before);});
check('S invokes PNG export',()=>{key('s');assert.equal(saved,true);});
check('hit detection also works at a different p5 canvas size',()=>{sandbox.width=250;sandbox.height=250;const before=block(5);press(85,85);assert.equal(block(5),before+1);sandbox.width=500;sandbox.height=500;});
check('page body has only the canvas holder and scripts',()=>{const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const body=html.match(/<body>([\s\S]*?)<\/body>/)[1];assert(!/<(?:button|p|h[1-6]|header|aside|footer|span)\b/i.test(body));assert.equal(body.replace(/<script[^>]*>[\s\S]*?<\/script>/g,'').replace(/<div id="canvas-holder"><\/div>/,'').trim(),'');});
check('downloadable offline page has only the canvas holder and no external scripts',()=>{
 const html=fs.readFileSync(path.join(root,'jinsa-colour-depth-v2.html'),'utf8');
 const withoutScripts=html.replace(/<script[^>]*>[\s\S]*?<\/script>/g,'');
 const body=withoutScripts.match(/<body>([\s\S]*?)<\/body>/)[1];
 assert.equal(body.replace(/<div id="canvas-holder"><\/div>/,'').trim(),'');
 assert(!/<script\s+src=/.test(html));
});
check('downloadable preview embeds exactly the current fixed-colour mechanic',()=>{
 const html=fs.readFileSync(path.join(root,'jinsa-colour-depth-v2.html'),'utf8');
 for(const file of ['user-input.js','sketch.js']){
  const source=fs.readFileSync(path.join(root,file),'utf8').replaceAll('</script>','<\\/script>');
  assert(html.includes('<script>\n'+source+'\n</script>'));
 }
});
if(context){
 check('rendering keeps the divider black and colours inside a block',()=>{
  run('resetComposition()');press(170,170);run('draw()');
  const pixel=(x,y)=>Array.from(context.getImageData(x,y,1,1).data);
  assert.deepEqual(pixel(170,170),[248,246,239,255]);
  assert.deepEqual(pixel(170,335),[...shade(5,1),255]);
  assert.deepEqual(pixel(130,180),[23,24,23,255]);
  settle();assert.deepEqual(pixel(170,170),[...shade(5,1),255]);
 });
 run('resetComposition()');
 for(const [x,y,n] of [[40,55,1],[190,55,2],[350,60,3],[460,160,2],[60,220,2],[170,170,7],[337,175,2],[390,175,4],[337,290,3],[390,290,2],[60,400,6],[220,380,2],[220,465,3],[350,380,4],[380,450,6],[350,480,2],[460,420,4]])for(let i=0;i<n;i++)press(x,y);
 settle();
 fs.writeFileSync(path.join(root,'preview','jinsa-demo.png'),nativeCanvas.toBuffer('image/png'));
 if(process.env.RENDER_DEPTH_SEQUENCE){
  const output=process.env.RENDER_DEPTH_SEQUENCE;
  fs.mkdirSync(output,{recursive:true});
  run('resetComposition()');settle();
  fs.writeFileSync(path.join(output,'depth-0.png'),nativeCanvas.toBuffer('image/png'));
  for(let count=1;count<=8;count++){
   const centres=run('inputControls.blocks.map(b=>[b.x+b.w/2,b.y+b.h/2])');
   for(const [x,y]of centres)press(x,y);
   settle();
   fs.writeFileSync(path.join(output,`depth-${count}.png`),nativeCanvas.toBuffer('image/png'));
  }
 }

}
console.log(JSON.stringify({passed:checks,browserTest:false,preview:!!context}));
