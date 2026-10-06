/*
Growing Mondrian
Creative Coding Final Project

Main sketch file.

The Audio mechanic is stored separately in:
audio-mechanic.js

AI acknowledgement:
ChatGPT assisted with structuring, explaining and refining
parts of this code. The student reviewed and modified the
code and understands how the system works.
*/


// GLOBAL VARIABLES

let song;
let audioMechanic;

let artworkX;
let artworkY;
let artworkWidth;
let artworkHeight;


// PRELOAD

// AI-assisted: ChatGPT suggested using preload() so the
// sound file is loaded before setup() begins.
function preload() {
  song = loadSound("assets/music.mp3");
}


// SETUP

function setup() {
  let canvasWidth = Math.min(windowWidth * 0.9, 1000);
  let canvasHeight = canvasWidth * 0.65;

  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("canvas-container");

  updateArtworkFrame();

  audioMechanic = new AudioMechanic(song);
}


// DRAW

function draw() {
  background(225);

  // Artwork background
  noStroke();
  fill(245, 242, 232);
  rect(artworkX, artworkY, artworkWidth, artworkHeight);

  // Update and display the Audio mechanic
  audioMechanic.update();
  audioMechanic.display();

  // Outer artwork frame
  noFill();
  stroke(15);
  strokeWeight(10);
  rect(artworkX, artworkY, artworkWidth, artworkHeight);

  drawInterface();
}


// ARTWORK FRAME

function updateArtworkFrame() {
  artworkX = width * 0.06;
  artworkY = height * 0.07;
  artworkWidth = width * 0.88;
  artworkHeight = height * 0.82;
}


// INTERFACE

// AI-assisted: ChatGPT helped structure the interface logic
// for showing whether the music is playing or paused and
// displaying the number of generated blocks.
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


// KEYBOARD INTERACTION

function keyPressed() {
  if (key === " ") {
    audioMechanic.toggleMusic();
  }

  if (key === "r" || key === "R") {
    audioMechanic.reset();
  }
}


// RESPONSIVE CANVAS

function windowResized() {
  let canvasWidth = Math.min(windowWidth * 0.9, 1000);
  let canvasHeight = canvasWidth * 0.65;

  resizeCanvas(canvasWidth, canvasHeight);
  updateArtworkFrame();

  if (audioMechanic) {
    audioMechanic.reset();
  }
}