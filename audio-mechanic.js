/*
Growing Mondrian
Audio Mechanic

This file analyses music amplitude and uses detected peaks
to generate overlapping geometric rectangles.

AI acknowledgement:
ChatGPT assisted with explaining and refining the audio analysis,
peak detection, rectangle sizing, positioning, storage, and
playback logic. The student reviewed and modified the code and
understands how the system works.

External reference:
p5.sound is used for audio playback and amplitude analysis.
https://p5js.org/reference/p5.Amplitude/
*/


class AudioMechanic {

  constructor(soundFile) {
    /*
    ChatGPT assisted with explaining how the sound file is passed
    into the class and how p5.Amplitude() can be used to measure
    the overall loudness of the music.
    */

    this.song = soundFile;

    this.amplitude = new p5.Amplitude();
    this.amplitude.setInput(this.song);

    this.currentLevel = 0;
    this.previousLevel = 0;

    // Peak detection settings
    this.threshold = 0.12;
    this.changeThreshold = 0.025;
    this.cooldown = 1;
    this.lastPeakTime = 0;

    // Generated rectangles are stored so they can be redrawn.
    this.blocks = [];

    // Mondrian-inspired colour palette.
    // Repeating off-white increases its probability.
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


  // --------------------------------------------------
  // AUDIO ANALYSIS
  // --------------------------------------------------

  /*
  ChatGPT assisted with the peak detection logic by comparing
  current and previous amplitude values and adding a cooldown
  condition to prevent repeated block creation from the same peak.
  */

  update() {
    this.previousLevel = this.currentLevel;
    this.currentLevel = this.amplitude.getLevel();

    if (!this.song.isPlaying()) {
      return;
    }

    let volumeChange = this.currentLevel - this.previousLevel;

    let loudEnough = this.currentLevel > this.threshold;
    let suddenIncrease = volumeChange > this.changeThreshold;
    let cooldownFinished = millis() - this.lastPeakTime > this.cooldown;

    if (loudEnough && suddenIncrease && cooldownFinished) {
      this.createBlock();
      this.lastPeakTime = millis();
    }
  }


  // --------------------------------------------------
  // BLOCK GENERATION
  // --------------------------------------------------

  /*
  ChatGPT assisted with mapping amplitude to rectangle size,
  using anchor positions instead of completely random placement,
  and constraining blocks so they remain inside the artwork frame.
  */

  createBlock() {
    let soundStrength = constrain(this.currentLevel, 0.05, 0.4);

    // Randomly choose horizontal or vertical orientation.
    let horizontal = random() > 0.5;

    let blockWidth;
    let blockHeight;

    if (horizontal) {
      blockWidth =
        ((soundStrength - 0.05) / (0.4 - 0.05)) *
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
        ((soundStrength - 0.05) / (0.4 - 0.05)) *
        (artworkHeight * 0.70 - artworkHeight * 0.15) +
        artworkHeight * 0.15;
    }

    blockWidth = constrain(blockWidth, 35, artworkWidth);
    blockHeight = constrain(blockHeight, 35, artworkHeight);

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

    let selectedXIndex = Math.floor(random(0, xAnchors.length));
    let selectedYIndex = Math.floor(random(0, yAnchors.length));

    let selectedX = xAnchors[selectedXIndex];
    let selectedY = yAnchors[selectedYIndex];

    let blockX = artworkX + selectedX * artworkWidth;
    let blockY = artworkY + selectedY * artworkHeight;

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

    let colourIndex = Math.floor(random(0, this.palette.length));
    let blockColour = this.palette[colourIndex];

    let newBlock = {
      x: blockX,
      y: blockY,
      w: blockWidth,
      h: blockHeight,
      colour: blockColour
    };

    this.blocks.push(newBlock);

    // Limit stored blocks so the array does not grow indefinitely.
    if (this.blocks.length > 120) {
      for (let i = 0; i < this.blocks.length - 1; i++) {
        this.blocks[i] = this.blocks[i + 1];
      }

      this.blocks.pop();
    }
  }


  // --------------------------------------------------
  // DISPLAY
  // --------------------------------------------------

  display() {
    for (let block of this.blocks) {
      fill(block.colour);
      stroke(15);
      strokeWeight(8);

      rect(block.x, block.y, block.w, block.h);
    }
  }


  // --------------------------------------------------
  // PLAY / PAUSE
  // --------------------------------------------------

  /*
  ChatGPT assisted with structuring the play/pause logic.
  userStartAudio() is used because browsers normally require
  user interaction before Web Audio can begin.
  */

  toggleMusic() {
    userStartAudio();

    if (this.song.isPlaying()) {
      this.song.pause();
    } else {
      this.song.play();
    }
  }


  // --------------------------------------------------
  // RESET
  // --------------------------------------------------

  reset() {
    this.blocks = [];

    this.currentLevel = 0;
    this.previousLevel = 0;
    this.lastPeakTime = 0;
  }
}