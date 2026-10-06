/*
Growing Mondrian
Audio Mechanic

This file analyses music amplitude and uses detected peaks
to generate overlapping geometric rectangles.

AI acknowledgement:
ChatGPT assisted with explaining and refining parts of the
audio analysis, peak detection, rectangle sizing, positioning,
storage and playback logic. The student reviewed and modified
the code and understands how the system works.

External reference:
p5.sound is used for audio playback and amplitude analysis.
https://p5js.org/reference/p5.Amplitude/
*/


class AudioMechanic {

  constructor(soundFile) {

    // AI-assisted: ChatGPT explained why the constructor
    // receives soundFile and stores it as this.song.
    this.song = soundFile;


    // AI-assisted: ChatGPT suggested using p5.Amplitude()
    // to measure the overall loudness of the music.
    this.amplitude = new p5.Amplitude();
    this.amplitude.setInput(this.song);


    this.currentLevel = 0;
    this.previousLevel = 0;


    // Peak detection settings
    this.threshold = 0.12;
    this.changeThreshold = 0.025;

    // AI-assisted: ChatGPT suggested using a cooldown to
    // prevent repeated block creation from the same peak.
    this.cooldown = 1;

    this.lastPeakTime = 0;


    // AI-assisted: ChatGPT explained why generated rectangles
    // need to be stored in an array so they can be redrawn.
    this.blocks = [];


    // Mondrian-inspired colour palette.
    // Repeating the off-white colour makes it more likely.
    this.palette = [
      "#F5F2E8",
      "#F5F2E8",
      "#F5F2E8",
      "#F5F2E8",
      "#D7352A",
      "#F2C63D",
      "#164D95"
    ];
  }


  // UPDATE AUDIO

  // AI-assisted: ChatGPT helped complete the audio update logic.
  // The original idea compared current and previous amplitude;
  // this version also stops block creation when music is paused.
  update() {
    this.previousLevel = this.currentLevel;
    this.currentLevel = this.amplitude.getLevel();

    if (!this.song.isPlaying()) {
      return;
    }

    let volumeChange = this.currentLevel - this.previousLevel;

    let loudEnough = this.currentLevel > this.threshold;
    let suddenIncrease = volumeChange > this.changeThreshold;

    // AI-assisted: ChatGPT suggested cooldownFinished as an
    // additional condition for peak detection.
    let cooldownFinished =
      millis() - this.lastPeakTime > this.cooldown;


    if (loudEnough && suddenIncrease && cooldownFinished) {
      this.createBlock();

      // AI-assisted: ChatGPT suggested recording the time of
      // the detected peak so the cooldown logic has an endpoint.
      this.lastPeakTime = millis();
    }
  }


  // CREATE NEW RECTANGLE

  createBlock() {

    // AI-assisted: ChatGPT suggested mapping amplitude across
    // a controlled range rather than using only two fixed sizes.
    let soundStrength = constrain(this.currentLevel, 0.05, 0.4);


    // Randomly choose horizontal or vertical orientation
    let horizontal = random() > 0.5;

    let blockWidth;
    let blockHeight;


    if (horizontal) {
      blockWidth =
        (soundStrength - 0.05) /
        (0.4 - 0.05) *
        (artworkWidth * 0.70 - artworkWidth * 0.15) +
        artworkWidth * 0.15;

      blockHeight = random(
        artworkHeight * 0.08,
        artworkHeight * 0.30
      );

    } else {
      blockWidth = random(
        artworkWidth * 0.08,
        artworkWidth * 0.30
      );

      blockHeight =
        (soundStrength - 0.05) /
        (0.4 - 0.05) *
        (artworkHeight * 0.70 - artworkHeight * 0.15) +
        artworkHeight * 0.15;
    }


    // AI-assisted: ChatGPT helped add size limits so blocks
    // remain usable within the artwork area.
    blockWidth = constrain(blockWidth, 35, artworkWidth);
    blockHeight = constrain(blockHeight, 35, artworkHeight);


    // POSITION

    // AI-assisted: ChatGPT suggested using anchor positions
    // instead of completely random placement.
    let xAnchors = [
      0,
      0.10,
      0.24,
      0.41,
      0.58,
      0.73,
      0.86
    ];

    let yAnchors = [
      0,
      0.12,
      0.29,
      0.45,
      0.66,
      0.82
    ];


    // AI-assisted: ChatGPT explained how Math.floor(),
    // random() and an array index can select an anchor.
    let selectedXIndex = Math.floor(random(0, xAnchors.length));
    let selectedYIndex = Math.floor(random(0, yAnchors.length));

    let selectedX = xAnchors[selectedXIndex];
    let selectedY = yAnchors[selectedYIndex];


    let blockX = artworkX + selectedX * artworkWidth;
    let blockY = artworkY + selectedY * artworkHeight;


    // AI-assisted: ChatGPT helped constrain each position so
    // even a large rectangle cannot extend outside the frame.
    blockX = constrain(
      blockX,
      artworkX,
      artworkX + artworkWidth - blockWidth
    );

    blockY = constrain(
      blockY,
      artworkY,
      artworkY + artworkHeight - blockHeight
    );


    // COLOUR

    let colourIndex = Math.floor(
      random(0, this.palette.length)
    );

    let blockColour = this.palette[colourIndex];


    // CREATE AND STORE BLOCK

    let newBlock = {
      x: blockX,
      y: blockY,
      w: blockWidth,
      h: blockHeight,
      colour: blockColour
    };


    // AI-assisted: ChatGPT suggested storing each generated
    // rectangle as an object inside the blocks array.
    this.blocks.push(newBlock);


    // AI-assisted: ChatGPT suggested limiting the number of
    // stored blocks so the array does not grow indefinitely.
    if (this.blocks.length > 120) {

      for (let i = 0; i < this.blocks.length - 1; i++) {
        this.blocks[i] = this.blocks[i + 1];
      }

      this.blocks.pop();
    }
  }


  // DISPLAY

  display() {
    for (let block of this.blocks) {
      fill(block.colour);
      stroke(15);
      strokeWeight(8);

      rect(
        block.x,
        block.y,
        block.w,
        block.h
      );
    }
  }


  // PLAY / PAUSE

  // AI-assisted: ChatGPT helped structure the play/pause logic.
  // userStartAudio() is required because browsers normally need
  // user interaction before starting Web Audio.
  toggleMusic() {
    userStartAudio();

    if (this.song.isPlaying()) {
      this.song.pause();
    } else {
      this.song.play();
    }
  }


  // RESET

  reset() {
    this.blocks = [];

    this.currentLevel = 0;
    this.previousLevel = 0;
    this.lastPeakTime = 0;
  }
}