let lines = [];
let currentLineIndex = 0;
let currentLength = 0;
let lineSpeed = 6;
let pauseFrames = 20;
let pauseCount = 0;
let Thickness = 5

// this code was generated with the help of ChatGPT, it helps calculate the
// exact location and length for each of the rectangles
function setupLines() {
  lines = [
    { type: "h", x: 0,   y: 32,  len: 302,},
    { type: "v", x: 28,  y: 32,  len: 288,},
    { type: "v", x: 196, y: 0,   len: 310,},
    { type: "v", x: 301, y: 0,   len: 320,},
    { type: "h", x: 28,  y: 203, len: 275,},
    { type: "v", x: 70,  y: 0,   len: 32,},
    { type: "h", x: 0,   y: 118, len: 30,},
    { type: "h", x: 196, y: 117, len: 105,},
    { type: "v", x: 250, y: 117, len: 90,},
    { type: "v", x: 114, y: 203, len: 117,},
    { type: "h", x: 0,   y: 246, len: 30,},
    { type: "h", x: 114, y: 246, len: 206,},
    { type: "h", x: 28,  y: 287, len: 167,},
    { type: "h", x: 114, y: 307, len: 190,}
  ];
}

// this code was generated with the help of ChatGPT, it give me suggection of
// how to define a function to make the line draw as the way I want it to be
function drawLines() {
  if (currentLineIndex < lines.length) {
//this code was generated with the help of ChatGPT, it helps me with structuring the line-drawing part
    if (pauseCount > 0) 
    pauseCount--;
    else {
    let currentLine = lines[currentLineIndex];
    currentLength = currentLength + lineSpeed;
    drawPartialLine(currentLine, currentLength);
//this code was generated with the help of ChatGPT, it inform me of how to reset the timer
    if (currentLength >= currentLine.len) {
     currentLineIndex++;
     currentLength = 0;
     pauseCount = pauseFrames;
     }
   }
 }
}


function drawPartialLine(Line, Length) {
  fill(0)
// this code was generated with the help of ChatGPT, it inform me the
// necessity of divided 320 as the scale was originaly created in 320*320
  let scaleX = width / 320;
  let scaleY = height / 320;

  if (Line.type == "h") {
    rect(
      Line.x * scaleX,
      Line.y * scaleY,
      Length * scaleX,
      Thickness * scaleY
    );
  }

  if (Line.type == "v") {
    rect(
      Line.x * scaleX,
      Line.y * scaleY,
      Thickness* scaleX,
      Length * scaleY
    );
  }
}
