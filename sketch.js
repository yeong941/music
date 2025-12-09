let sound;
let fft;
let stars = [];
let numStars = 300;

let isPlaying = false;
let mode = 0; 

let centerR = 200;        
let centerTargetR = 200;  
let centerAngle = 0;      

function preload() {
  sound = loadSound("nmixx.mp3");
}

function setup() {
  createCanvas(1000, 700);
  angleMode(DEGREES);
  noStroke();

  fft = new p5.FFT(0.8, 64); 

  for (let i = 0; i < numStars; i++) {
    stars.push(new Star());
  }

  textAlign(CENTER, TOP);
  textSize(16);
}

function draw() {
  background(5, 5, 20); 

  let spectrum = fft.analyze();
  let energy = fft.getEnergy("bass", "treble"); 
  let level = map(energy, 0, 255, 0, 1);
  level = constrain(level, 0, 1);

  for (let s of stars) {
    s.update(level, spectrum);
    s.show();
  }

  centerTargetR = map(level, 0, 1, 140, 420);

  centerR = lerp(centerR, centerTargetR, 0.15);

  centerAngle += level * 6;

  push();
  translate(width / 2, height / 2);

  let pulse = sin(frameCount * 2) * 15 * level;  
  let r = centerR + pulse;

  let cold = color(80, 120, 255, 60);   
  let warm = color(255, 200, 150, 80);  
  let baseC = lerpColor(cold, warm, level);
  if (mode === 2) baseC = warm;         

  noStroke();
  fill(baseC);
  ellipse(0, 0, r, r);

  noFill();
  stroke(
    red(baseC),
    green(baseC),
    blue(baseC),
    180
  );
  strokeWeight(2 + level * 4);  

  push();
  rotate(centerAngle);

  arc(0, 0, r + 30, r + 30, -60, 120);
  pop();

  pop();

  drawUI(level);
}

class Star {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = random(-width, width);
    this.y = random(-height, height);
    this.z = random(width); 
    this.pz = this.z;

    this.baseSize = random(1, 3);
    this.baseBright = random(150, 255);
  }

  update(level, spectrum) {
    this.z = this.z - map(level, 0, 1, 5, 20);

    if (this.z < 1) {
      this.reset();
      this.z = width;
      this.pz = this.z;
    }

    let jitterAmount;
    if (mode === 0) jitterAmount = 0.3;
    else if (mode === 1) jitterAmount = 1.2;
    else jitterAmount = 0.6;

    this.x += random(-jitterAmount, jitterAmount) * level * 10;
    this.y += random(-jitterAmount, jitterAmount) * level * 10;

    this.size = this.baseSize + level * 5;

    this.bright = this.baseBright + level * 200;
    this.bright = constrain(this.bright, 0, 255);

    if (mode === 2) {
      let high = spectrum[spectrum.length - 1] || 0;
      let hueVal = map(high, 0, 255, 180, 360);
      this.col = color(hueVal, 80, this.bright);
    } else {
      this.col = color(180, 200, this.bright);
    }
  }

  show() {
    let sx = map(this.x / this.z, 0, 1, 0, width);
    let sy = map(this.y / this.z, 0, 1, 0, height);

    this.pz = this.z;

    fill(this.col);
    ellipse(sx, sy, this.size, this.size);
  }
}

function drawUI(level) {
  fill(255);
  textSize(14);

  let status = isPlaying ? "Playing" : "Stopped";
  text(
    "Click: 재생 / 정지   |   키보드 1,2,3: 모드 변경   |   Level: " + level.toFixed(2) +
      "   |   상태: " + status,
    width / 2,
    10
  );

  text("Mode: " + modeText(), width / 2, 30);
}

function modeText() {
  if (mode === 0) return "0 – 기본 별자리";
  if (mode === 1) return "1 – 강한 흔들림 (폭발감)";
  if (mode === 2) return "2 – 컬러 스펙트럼 별";
}

function mousePressed() {
  if (sound.isPlaying()) {
    sound.pause();
    isPlaying = false;
  } else {
    userStartAudio();
    sound.loop();
    isPlaying = true;
  }
}

function keyPressed() {
  if (key === "1") mode = 0;
  if (key === "2") mode = 1;
  if (key === "3") mode = 2;
}
