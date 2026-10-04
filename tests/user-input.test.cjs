// Run the actual p5 callbacks and mechanic with a minimal drawing/DOM adapter.
// These are logic/render checks, not a real browser test.
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const project = path.join(root, '9103 creative coding');
const canvas = { style: {} };
let context, nativeCanvas, colour, saved = false, canvasCount = 0;
const cssColour = channels => channels.length === 1 && typeof channels[0] === 'string' ? channels[0] : 'rgb('+(channels.length === 1 ? [channels[0],channels[0],channels[0]] : channels).join(',')+')';
if (process.env.RENDER_PREVIEW) {
  nativeCanvas = require('@napi-rs/canvas').createCanvas(500, 500);
  context = nativeCanvas.getContext('2d');
}
const sandbox = {
  console, width:500, height:500, deltaTime:1000/60, mouseX:0, mouseY:0, mouseButton:'left', LEFT:'left',
  document:{ addEventListener(){}, createElement(){throw Error('No extra UI allowed');} },
  createCanvas(w,h){canvasCount++;sandbox.width=w;sandbox.height=h;return {elt:canvas,parent(){}};},
  pixelDensity(){}, noStroke(){}, fill(...channels){colour=cssColour(channels);},
  rect(x,y,w,h){if(context){context.fillStyle=colour;context.fillRect(x,y,w,h);}},
  background(...channels){if(context){context.fillStyle=cssColour(channels);context.fillRect(0,0,500,500);}},
  saveCanvas(elt,name,type){assert.equal(elt,canvas);assert.equal(type,'png');saved=true;}
};
vm.createContext(sandbox);
for(const file of ['time-lines.js','user-input.js','sketch.js'])vm.runInContext(fs.readFileSync(path.join(project,file),'utf8'),sandbox,{filename:file});
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
check('initial composition contains 20 independent white blocks',()=>{assert.equal(run('inputControls.blocks.length'),20);assert.equal(run('inputControls.blocks.every(b=>b.clickCount===0)'),true);});
check('the team sketch creates exactly one canvas and preserves the original line module',()=>{
 assert.equal(canvasCount,1);assert.equal(run('lines.length'),14);
 const bytes=fs.readFileSync(path.join(project,'time-lines.js'));
 const hash=require('node:crypto').createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
 assert.equal(hash,'ec28eda04d521a3859e19076c7881a56194d265e');
});
check('clicks wait until the team line sequence is complete',()=>{
 const before=state();press(170,170);assert.equal(state(),before);
 run('for(let i=0;i<2000&&!isGridComplete();i++)draw()');
 assert.equal(run('isGridComplete()'),true);assert.equal(run('currentLineIndex'),14);
});
check('one press adds a pale fixed colour to only the selected block',()=>{press(170,170);assert.equal(block(5),1);assert.equal(run('inputControls.blocks.filter(b=>b.clickCount!==0).length'),1);});
check('click starts growth, draw updates height and fill stops at the block edge',()=>{
 assert.equal(run('inputControls.blocks[5].currentHeight'),0);
 assert.equal(run('inputControls.blocks[5].targetHeight'),166);
 run('draw()');
 assert(run('inputControls.blocks[5].currentHeight > 0 && inputControls.blocks[5].currentHeight < inputControls.blocks[5].targetHeight'));
 settle();assert.equal(run('inputControls.blocks[5].currentHeight'),166);
 const before=state();settle();assert.equal(state(),before);
});
check('all 20 blocks have different fixed colours at the same click depth',()=>{
 for(const count of [1,4,8])assert.equal(new Set(Array.from({length:20},(_,id)=>shade(id,count).join(','))).size,20);
});
check('every colour deepens monotonically for the first eight clicks and never cycles',()=>{
 for(let id=0;id<20;id++){
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
 press(350,25);assert.equal(block(2),1);assert.equal(block(5),10);
});
check('black grid gaps and outside presses do not change any block',()=>{const before=state();for(const p of [[310,180],[47,180],[1,1],[499,250],[-1,40],[500,40],[40,500]])press(...p);assert.equal(state(),before);});
check('right and middle presses do not change any block',()=>{const before=state();press(170,170,'right');press(170,170,'middle');assert.equal(state(),before);});
check('undo and redo restore the colour depth through its click count',()=>{const before=state();press(170,170);const after=state();run('inputControls.undo()');assert.equal(state(),before);run('inputControls.redo()');assert.equal(state(),after);});
check('new colour changes discard redo history',()=>{run('inputControls.undo()');assert.equal(run('inputControls.redoStack.length'),1);press(20,420);assert.equal(run('inputControls.redoStack.length'),0);});
check('keyboard colour selection is unnecessary and inactive',()=>{const before=state();key('3');assert.equal(state(),before);});
check('C clears the composition and can be undone',()=>{const before=state();key('c');assert.equal(run('inputControls.blocks.every(b=>b.clickCount===0)'),true);run('inputControls.undo()');assert.equal(state(),before);});
check('S invokes PNG export',()=>{key('s');assert.equal(saved,true);});
check('hit detection also works at a different p5 canvas size',()=>{sandbox.width=250;sandbox.height=250;const before=block(5);press(85,85);assert.equal(block(5),before+1);sandbox.width=500;sandbox.height=500;});
check('page body has only the canvas holder and scripts',()=>{const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const body=html.match(/<body>([\s\S]*?)<\/body>/)[1];assert(!/<(?:button|p|h[1-6]|header|aside|footer|span)\b/i.test(body));assert.equal(body.replace(/<script[^>]*>[\s\S]*?<\/script>/g,'').replace(/<div id="canvas-holder"><\/div>/,'').trim(),'');});
check('downloadable offline page has only the canvas holder and no external scripts',()=>{
 const html=fs.readFileSync(path.join(root,'jinsa-team-grid.html'),'utf8');
 const withoutScripts=html.replace(/<script[^>]*>[\s\S]*?<\/script>/g,'');
 const body=withoutScripts.match(/<body>([\s\S]*?)<\/body>/)[1];
 assert.equal(body.replace(/<div id="canvas-holder"><\/div>/,'').trim(),'');
 assert(!/<script\s+src=/.test(html));
});
check('downloadable preview embeds exactly the current fixed-colour mechanic',()=>{
 const html=fs.readFileSync(path.join(root,'jinsa-team-grid.html'),'utf8');
 for(const file of ['time-lines.js','user-input.js','sketch.js']){
  const source=fs.readFileSync(path.join(project,file),'utf8').replaceAll('\r\n','\n').replaceAll('</script>','<\\/script>');
  assert(html.includes('<script>\n'+source+'\n</script>'));
 }
});
if(context){
 check('rendering keeps the divider black and colours inside a block',()=>{
  run('resetComposition()');press(170,170);run('draw()');
  const pixel=(x,y)=>Array.from(context.getImageData(x,y,1,1).data);
  assert.deepEqual(pixel(170,170),[255,255,255,255]);
  assert.deepEqual(pixel(170,310),[...shade(5,1),255]);
  assert.deepEqual(pixel(310,180),[0,0,0,255]);
  settle();assert.deepEqual(pixel(170,170),[...shade(5,1),255]);
  assert.deepEqual(pixel(1,1),[166,137,80,255]);
 });
 run('resetComposition()');
 const centres=run('inputControls.blocks.map(b=>[(b.x+b.w/2)*width/GRID_SIZE,(b.y+b.h/2)*height/GRID_SIZE])');
 for(let id=0;id<centres.length;id++)for(let count=0;count<1+id%8;count++)press(...centres[id]);
 settle();
 fs.writeFileSync(path.join(root,'preview','jinsa-demo.png'),nativeCanvas.toBuffer('image/png'));
 if(process.env.RENDER_DEPTH_SEQUENCE){
  const output=process.env.RENDER_DEPTH_SEQUENCE;
  fs.mkdirSync(output,{recursive:true});
  run('resetComposition()');settle();
  fs.writeFileSync(path.join(output,'depth-0.png'),nativeCanvas.toBuffer('image/png'));
  for(let count=1;count<=8;count++){
   const centres=run('inputControls.blocks.map(b=>[(b.x+b.w/2)*width/GRID_SIZE,(b.y+b.h/2)*height/GRID_SIZE])');
   for(const [x,y]of centres)press(x,y);
   settle();
   fs.writeFileSync(path.join(output,`depth-${count}.png`),nativeCanvas.toBuffer('image/png'));
  }
 }

}
console.log(JSON.stringify({passed:checks,browserTest:false,preview:!!context}));
