/*
Growing Mondrian
Creative Coding Final Project

Main sketch file.

The Audio mechanic is stored separately in:
audio-mechanic.js

AI acknowledgement:
ChatGPT was used to assist with structuring and explaining
parts of this code. The student reviewed and modified the
code and understands how the system works.
*/


// --------------------------------------------------
// GLOBAL VARIABLES
// --------------------------------------------------

let song;
let audioMechanic;

let artworkX;
let artworkY;
let artworkWidth;
let artworkHeight;


// --------------------------------------------------
// PRELOAD
// --------------------------------------------------

// ChatGPT suggested using preload() so the audio file
// is loaded before the sketch begins.

function preload() {
  song = loadSound("assets/music.mp3");
}


// --------------------------------------------------
// SETUP
// --------------------------------------------------

function setup() {
  let canvasWidth = Math.min(windowWidth * 0.9, 1000);
  let canvasHeight = canvasWidth * 0.65;

  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("canvas-container");

  updateArtworkFrame();

  audioMechanic = new AudioMechanic(song);
}


// --------------------------------------------------
// DRAW
// --------------------------------------------------

function draw() {
  background(225);

  // Artwork background
  noStroke();
  fill(245, 242, 232);
  rect(artworkX, artworkY, artworkWidth, artworkHeight);

  // Update and display the Audio mechanic
  audioMechanic.update();
  audioMechanic.display();

  // Artwork frame
  noFill();
  stroke(15);
  strokeWeight(10);
  rect(artworkX, artworkY, artworkWidth, artworkHeight);

  drawInterface();
}


// --------------------------------------------------
// ARTWORK FRAME
// --------------------------------------------------

function updateArtworkFrame() {
  artworkX = width * 0.06;
  artworkY = height * 0.07;

  artworkWidth = width * 0.88;
  artworkHeight = height * 0.82;
}


// --------------------------------------------------
// INTERFACE
// --------------------------------------------------

/*
ChatGPT assisted with the conditional logic used to show
whether the audio is playing or paused, as well as the
number of blocks currently generated.
*/

function drawInterface() {
  noStroke();
  fill(20);

  textSize(14);
  textAlign(LEFT);

  let statusText;

  if (song.isPlaying()) {
    statusText = "Playing";
  } else {
    statusText = "Paused";
  }

  text(statusText, artworkX, height - 12);

  textAlign(RIGHT);

  text(
    "Blocks: " + audioMechanic.blocks.length,
    artworkX + artworkWidth,
    height - 12
  );
}


// --------------------------------------------------
// KEYBOARD INTERACTION
// --------------------------------------------------

function keyPressed() {
  // SPACE: play or pause audio
  if (key === " ") {
    audioMechanic.toggleMusic();
  }

  // R: reset the composition
  if (key === "r" || key === "R") {
    audioMechanic.reset();
  }
}


// --------------------------------------------------
// RESPONSIVE CANVAS
// --------------------------------------------------

function windowResized() {
  let canvasWidth = Math.min(windowWidth * 0.9, 1000);
  let canvasHeight = canvasWidth * 0.65;

  resizeCanvas(canvasWidth, canvasHeight);

  updateArtworkFrame();

  if (audioMechanic) {
    audioMechanic.reset();
  }
}