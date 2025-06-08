let showStarted = false;
let bgColorPicker, ellipseColorPicker, startButton, infoText, spanBg, spanEllipse;
let musicFileInput, music;
let balls = [];
let amplitude;
let lastCircleTime = 0;
let circleInterval = 100; // Mindestabstand in ms zwischen Kreisen
let ampSlider, ampLabel;
let showRegieModeCheckbox, showRegieModeLabel;
let showRegieMode = false;
let speedSlider, speedLabel, sizeSlider, sizeLabel;
let originX;
let originY;

let px;
let py;

let detector, video, poses = [];
let useTracking = true; // Zum Umschalten Tracking/Maus

let showVideo = false; // Zum Umschalten Video anzeigen/verstecken
let showVideoCheckbox, showVideoLabel;



async function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(30); //cap von 30FPS

  // Parameter-UI
  bgColorPicker = createColorPicker('#000004');
  bgColorPicker.position(20, 40);
  spanBg = createSpan('Hintergrundfarbe');
  spanBg.position(60, 40);

  ellipseColorPicker = createColorPicker('#ff6464');
  ellipseColorPicker.position(20, 80);
  spanEllipse = createSpan('Ellipse-Farbe');
  spanEllipse.position(60, 80);

  // Webcam-Video einrichten (versteckt)
  video = createCapture(VIDEO);
  video.size(320, 240);
  if (showVideo == true) {
    video.show();
  }else{
    video.hide();
  }


  originX = width / 2;
  originY = height / 2;


   // Pose-Detection initialisieren
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
  );

  // Ball-Geschwindigkeit
  speedSlider = createSlider(1, 15, 6, 0.1); // min, max, start, step
  speedSlider.position(20, 340);
  speedLabel = createSpan('Ball-Geschwindigkeit');
  speedLabel.position(160, 340);

  // Ball-Größe
  sizeSlider = createSlider(10, 100, 40, 1); // min, max, start, step
  sizeSlider.position(20, 380);
  sizeLabel = createSpan('Ball-Größe');
  sizeLabel.position(160, 380);


  musicFileInput = createFileInput(handleFile);
  musicFileInput.position(20, 160);

   ampSlider = createSlider(0, 0.5, 0.15, 0.01);
  ampSlider.position(20, 200);
  ampLabel = createSpan('Amplitude-Schwelle');
  ampLabel.position(160, 200);

  showRegieModeCheckbox = createCheckbox('', false);
  showRegieModeCheckbox.position(20, 230);
  showRegieModeLabel = createSpan('Regie-Modus während der Show anzeigen');
  showRegieModeLabel.position(50, 230);

  showRegieModeCheckbox.changed(() => {
    showRegieMode = showRegieModeCheckbox.checked();
  });

  showVideoCheckbox = createCheckbox('', false);
  showVideoCheckbox.position(20, 290);
  showVideoLabel = createSpan('Video während der Show anzeigen');
  showVideoLabel.position(50, 290);
  // Video-Checkbox ändert Sichtbarkeit des Videos
  showVideoCheckbox.changed(() => {
    showVideo = showVideoCheckbox.checked();
    if (showVideo) {
      video.show();
    } else {
      video.hide();
    }
  });

  startButton = createButton('Show starten');
  startButton.position(20, 260);
  startButton.attribute('disabled', '');
  startButton.mousePressed(() => {
    if (music && music.isLoaded()) {
      showStarted = true;
      bgColorPicker.hide();
      ellipseColorPicker.hide();
      startButton.hide();
      spanBg.hide();
      spanEllipse.hide();
      infoText.hide();
      musicFileInput.hide();
      showRegieModeCheckbox.hide();
      showRegieModeLabel.hide();
      speedSlider.hide();
      speedLabel.hide();
      sizeSlider.hide();
      sizeLabel.hide();
      // Slider nur ausblenden, wenn Checkbox nicht gesetzt ist
      if (!showRegieModeCheckbox.checked()) {
        ampSlider.hide();
        ampLabel.hide();
        showVideoCheckbox.hide();
        showVideoLabel.hide();
      }
      music.play();
    }
  });

   infoText = createP('Parameter einstellen, Musik auswählen und dann "Show starten"');
  infoText.position(20, 300);
  infoText.style('color', '#fff');
  infoText.style('font-size', '24px');

  amplitude = new p5.Amplitude();

  // Video-Tracking starten
  detectPose();
}

async function detectPose() {
  if (video.loadedmetadata) {
    poses = await detector.estimatePoses(video.elt);
  }
  setTimeout(detectPose, 1000 / 12); // 12 FPS
}

function handleFile(file) {
  if (file.type === 'audio') {
    if (music) {
      music.stop();
    }
    music = loadSound(file.data, () => {
      amplitude.setInput(music);
      startButton.removeAttribute('disabled'); // Button aktivieren, wenn Musik geladen
    });
  }
}

function draw() {
  // Video anzeigen
  if (showVideo) {
    image(video, width/2, 0, width/2, height/2);
    //image(video, 0, 0, width, height); FULLSCREEN
  }

  if (showStarted) {
    let targetX = originX;
    let targetY = originY;

    if (useTracking && poses.length > 0 && poses[0].keypoints) {
      let nose = poses[0].keypoints.find(k => k.name === "nose" || k.part === "nose");
      if (nose && nose.score > 0.3) {
        // Selfie-Effekt (üblich): X spiegeln
        px = nose.x / video.width;
        py = nose.y / video.height;
        targetX = px * width;
        targetY = py * height;

        originX = targetX;
        originY = targetY;
      }
    }
    //originX = lerp(originX, targetX, 0.15);
    //originY = lerp(originY, targetY, 0.15);
    originX = constrain(originX, 0, width);
    originY = constrain(originY, 0, height);
  }

  if (!showStarted) {
    background(bgColorPicker.color());
  } else {
    let bgCol = color(bgColorPicker.color());
    bgCol.setAlpha(40);
    fill(bgCol);
    rect(0, 0, width, height);

    drawSpotlight((px * width)/2, (py * height)/2, 200);

    // Musikreaktion
    if (music && music.isPlaying()) {
      let level = amplitude.getLevel();
      let threshold = ampSlider.value();
      if (level > threshold && millis() - lastCircleTime > circleInterval) {
        let numBalls = int(random(15, 30));
        let minSpeed = speedSlider.value();
        let maxSpeed = minSpeed + 2;
        let ballSize = sizeSlider.value();
        for (let i = 0; i < numBalls; i++) {
          let angle = map(i, 0, numBalls, 0, TWO_PI) + random(-0.2, 0.2);
          let speed = random(minSpeed, maxSpeed);
          let dx = cos(angle) * speed;
          let dy = sin(angle) * speed;
          let x = (width * px)/2 + random(-20, 20);
          let y = (height * py)/2 + random(-20, 20);
          let baseCol = color(ellipseColorPicker.color());
          baseCol.setRed(red(baseCol) + random(-20, 20));
          baseCol.setGreen(green(baseCol) + random(-20, 20));
          baseCol.setBlue(blue(baseCol) + random(-20, 20));
          balls.push(new Ball(x, y, dx, dy, baseCol, ballSize + random(-10, 10)));
        }
        lastCircleTime = millis();
      }
    }

    // Bälle updaten und zeichnen
    for (let i = balls.length - 1; i >= 0; i--) {
      balls[i].update();
      balls[i].draw();
      if (balls[i].alpha <= 0 || balls[i].radius <= 1) {
        balls.splice(i, 1);
      }
    }
  }
  drawSpotlight((px * width)/2, (py * height)/2, 200);
}
  
  // Im startButton.mousePressed Callback die UI-Elemente für den Slider ausblenden:


function mousePressed() {
  /*if (showStarted) {
    let numBalls = 20;
    for (let i = 0; i < numBalls; i++) {
      let angle = map(i, 0, numBalls, 0, TWO_PI);
      let speed = random(4, 8);
      let dx = cos(angle) * speed;
      let dy = sin(angle) * speed;
      balls.push(new Ball(mouseX, mouseY, dx, dy, ellipseColorPicker.color()));
    }
  }*/
}
function drawSpotlight(x, y, r) {
    noStroke();
    fill(255, 255, 200, 255);
    ellipse(x, y, r);
  
}

class Ball {
  constructor(x, y, dx, dy, col, radius) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.radius = radius !== undefined ? radius : random(30, 50);
    this.col = color(col);
    this.alpha = 255;
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.dx *= 0.97;
    this.dy *= 0.97;
    this.radius *= 0.97;
    this.alpha *= 0.94;
  }

  draw() {
    let c = color(this.col);
    c.setAlpha(this.alpha);
    noStroke();
    fill(c);
    ellipse(this.x, this.y, this.radius);
  }
}