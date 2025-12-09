let sound;
let fft;
let stars = [];
let numStars = 300;

let isPlaying = false;
let mode = 0; // 0: 기본, 1: 강한 흔들림, 2: 컬러 모드

// 중앙 코어(원) 애니메이션용 변수
let centerR = 200;        // 실제 반지름
let centerTargetR = 200;  // 사운드 기반 목표 반지름
let centerAngle = 0;      // 회전 각도

function preload() {
  // 같은 폴더에 있는 음악 파일 로드
  sound = loadSound("nmixx.mp3");
}

function setup() {
  createCanvas(1000, 700);
  angleMode(DEGREES);
  noStroke();

  // FFT 분석 객체 (주파수 분석용)
  fft = new p5.FFT(0.8, 64); // (smoothing, bins)

  // 별들 생성
  for (let i = 0; i < numStars; i++) {
    stars.push(new Star());
  }

  textAlign(CENTER, TOP);
  textSize(16);
}

function draw() {
  background(5, 5, 20); // 어두운 밤하늘 느낌

  // FFT로 스펙트럼 얻기
  let spectrum = fft.analyze();
  // 전체 에너지를 하나의 값으로 요약 (0~255)
  let energy = fft.getEnergy("bass", "treble"); // 대충 전체 느낌
  // 0~255 → 0~1 로 정규화
  let level = map(energy, 0, 255, 0, 1);
  level = constrain(level, 0, 1);

  // 별 업데이트 & 그리기
  for (let s of stars) {
    s.update(level, spectrum);
    s.show();
  }

  // ===== 중앙 에너지 코어(더 역동적으로) =====
  // 1) level 값으로 목표 반지름 계산
  centerTargetR = map(level, 0, 1, 140, 420);

  // 2) lerp로 부드럽게 따라가게 하기 (갑자기 확 튀지 않게)
  centerR = lerp(centerR, centerTargetR, 0.15);

  // 3) 음악이 셀수록 회전도 빨라지게 (회전 링용)
  centerAngle += level * 6;

  push();
  translate(width / 2, height / 2);

  // 4) 호흡하는 듯한 펄스 효과 (sin 사용)
  let pulse = sin(frameCount * 2) * 15 * level;  // level이 클수록 더 크게 출렁
  let r = centerR + pulse;

  // 5) 색은 level에 따라 차가운 색 → 따뜻한 색으로 보간
  let cold = color(80, 120, 255, 60);   // 차가운 푸른빛
  let warm = color(255, 200, 150, 80);  // 따뜻한 주황빛
  let baseC = lerpColor(cold, warm, level);
  if (mode === 2) baseC = warm;         // 모드 2에서는 더 따뜻하게 고정

  // 안쪽 부드러운 코어
  noStroke();
  fill(baseC);
  ellipse(0, 0, r, r);

  // 6) 바깥에 회전하는 링 추가 (arc)
  noFill();
  stroke(
    red(baseC),
    green(baseC),
    blue(baseC),
    180
  );
  strokeWeight(2 + level * 4);  // 음악 세질수록 링이 두꺼워짐

  push();
  rotate(centerAngle);
  // r+30 크기의 링에서 180도짜리 호만 그려서 "돌아가는 조각" 느낌
  arc(0, 0, r + 30, r + 30, -60, 120);
  pop();

  pop();

  // UI
  drawUI(level);
}

// ====== Star 클래스 ======
class Star {
  constructor() {
    this.reset();
  }

  reset() {
    // 화면 중앙 기준, 랜덤 위치에 배치
    this.x = random(-width, width);
    this.y = random(-height, height);
    this.z = random(width); // 깊이감
    this.pz = this.z;

    // 기본 밝기와 크기
    this.baseSize = random(1, 3);
    this.baseBright = random(150, 255);
  }

  update(level, spectrum) {
    // 음악 레벨에 따라 별이 화면 중앙에서 밖으로 튀어나가는 느낌
    this.z = this.z - map(level, 0, 1, 5, 20);

    if (this.z < 1) {
      this.reset();
      this.z = width;
      this.pz = this.z;
    }

    // 모드에 따라 흔들림 강도 조절
    let jitterAmount;
    if (mode === 0) jitterAmount = 0.3;
    else if (mode === 1) jitterAmount = 1.2;
    else jitterAmount = 0.6;

    // 약간의 흔들림 (음악 레벨에 비례)
    this.x += random(-jitterAmount, jitterAmount) * level * 10;
    this.y += random(-jitterAmount, jitterAmount) * level * 10;

    // 별 크기: 깊이 + 음악레벨 반영
    this.size = this.baseSize + level * 5;

    // 별 밝기: 음악레벨 반영
    this.bright = this.baseBright + level * 200;
    this.bright = constrain(this.bright, 0, 255);

    // 색상 모드
    if (mode === 2) {
      // high freq 쪽 에너지 사용해서 색 만들기 (대충 느낌용)
      let high = spectrum[spectrum.length - 1] || 0;
      let hueVal = map(high, 0, 255, 180, 360);
      this.col = color(hueVal, 80, this.bright);
    } else {
      // 기본: 흰/푸른 별
      this.col = color(180, 200, this.bright);
    }
  }

  show() {
    // 3D 좌표를 2D 화면으로 투영 (starfield 기본 공식)
    let sx = map(this.x / this.z, 0, 1, 0, width);
    let sy = map(this.y / this.z, 0, 1, 0, height);

    this.pz = this.z;

    // 별 그리기
    fill(this.col);
    ellipse(sx, sy, this.size, this.size);
  }
}

// ====== UI & 텍스트 ======
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

// ====== 인터랙션 ======
function mousePressed() {
  // 클릭으로 재생/정지 토글
  if (sound.isPlaying()) {
    sound.pause();
    isPlaying = false;
  } else {
    // 첫 재생 시 오디오 컨텍스트 시작(브라우저 정책 대응)
    userStartAudio();
    sound.loop();
    isPlaying = true;
  }
}

function keyPressed() {
  // 모드 변경
  if (key === "1") mode = 0;
  if (key === "2") mode = 1;
  if (key === "3") mode = 2;
}
