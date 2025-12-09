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

  let pulseBase = sin(frameCount * 2) * 15 * level;

  if (mode === 2) {

    let pulse = pulseBase * random(0.5, 1.5);
    let r = centerR + pulse;

    let baseC = color(
      random(150, 255),
      random(100, 255),
      random(150, 255),
      random(50, 120)
    );

    noStroke();
    fill(baseC);
    ellipse(0, 0, r, r);

    noFill();
    stroke(
      red(baseC) + random(-30, 30),
      green(baseC) + random(-30, 30),
      blue(baseC) + random(-30, 30),
      random(150, 255)
    );

    let sw = 1.5 + level * random(2, 6);
    strokeWeight(sw);

    push();
    rotate(centerAngle * random(0.5, 1.5));
    let start = random(-180, 180);
    let span = random(60, 200);
    let rr = r + random(-20, 40);
    arc(0, 0, rr, rr, start, start + span);
    pop();

  } else {

    let pulse = pulseBase;
    let r = centerR + pulse;

    let cold, warm;
    if (mode === 0) {

      cold = color(130, 90, 255, 70);
      warm = color(255, 110, 200, 90);
    } else {

      cold = color(255, 130, 210, 70);
      warm = color(255, 190, 240, 90);
    }

    let baseC = lerpColor(cold, warm, level);


    noStroke();
    fill(baseC);
    ellipse(0, 0, r, r);

    noFill();
    stroke(red(baseC), green(baseC), blue(baseC), 180);
    strokeWeight(2 + level * 4);

    push();
    rotate(centerAngle);
    arc(0, 0, r + 30, r + 30, -60, 120);
    pop();
  }

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

    this.bright = this.baseBright + level * 200;
    this.bright = constrain(this.bright, 0, 255);
    let alpha = map(this.bright, 0, 255, 80, 255);


    this.size = this.baseSize + level * 5;

    if (mode === 0) {

      let jitter = 0.3;
      this.x += random(-jitter, jitter) * level * 10;
      this.y += random(-jitter, jitter) * level * 10;

      this.col = color(240, 240, 255, alpha);

    } else if (mode === 1) {
      
      this.size *= 1.8;

      let angle = atan2(this.y, this.x); 
      let speed = map(level, 0, 1, 2, 10);

      this.x += cos(angle + 90) * speed;
      this.y += sin(angle + 90) * speed;

      this.x += random(-0.5, 0.5) * level * 5;
      this.y += random(-0.5, 0.5) * level * 5;

      this.col = color(255, 150, 220, alpha);

    } else {

      // 랜덤 방향
      let dirAngle = random(0, 360);
      let speed = level * random(5, 20);
      this.x += cos(dirAngle) * speed;
      this.y += sin(dirAngle) * speed;

      // 랜덤 색상
      this.col = color(
        random(150, 255),
        random(100, 255),
        random(150, 255),
        alpha
      );
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

// ===== UI =====
function drawUI(level) {
  fill(255);
  textSize(14);

  let status = isPlaying ? "Playing" : "Stopped";
  let modeNumber = mode + 1;

  text(
    "Click: 재생 / 정지   |   키보드 1,2,3: 모드 변경   |   Level: " +
      level.toFixed(2) +
      "   |   상태: " + status,
    width / 2,
    10
  );

  text("Mode " + modeNumber + " – " + modeText(), width / 2, 30);
}

function modeText() {
  if (mode === 0) return "기본 별자리";
  if (mode === 1) return "역동적 별자리";
  if (mode === 2) return "랜덤 별자리";
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
