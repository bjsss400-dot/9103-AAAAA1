let lines = [];
let currentLineIndex = 0;
let currentLength = 0;
let lineSpeed = 6;
let pauseFrames = 20;
let pauseCount = 0;
let Thickness = 5

//設定線的屬性(位置、長度etc)
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

//設定畫線的邏輯
function drawLines() {
//讓她不會數到第14條線
  if (currentLineIndex < lines.length) {
//讓pausecount倒數，到0時用else執行畫線
    if (pauseCount > 0) 
    pauseCount--;
    else {
//鎖定其中一個lines
    let currentLine = lines[currentLineIndex];
//這是讓currentlength會慢慢變長
    currentLength = currentLength + lineSpeed;
//畫線，但是對於每條lines的長度只畫到currrentlength的長度
    drawPartialLine(currentLine, currentLength);

    if (currentLength >= currentLine.len) {
//如果currentLength畫完了，就把Index數加1繼續畫下一條線
     currentLineIndex++;
     currentLength = 0;
//重設倒數讓線條不會馬上開始
     pauseCount = pauseFrames;
     }
   }
 }
}

//實際繪製線條
function drawPartialLine(Line, Length) {
  fill(0)
//因為在計算線條方位時是用320*320
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