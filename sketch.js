let showStarted = false;
let bgColorPicker, ellipseColorPicker, startButton, infoText, spanBg, spanEllipse;
let musicFileInput, music;
let balls = [];
let amplitude;
let lastCircleTime = 0;
let circleInterval = 100; // Mindestabstand in ms zwischen Kreisen
let ampSlider, ampLabel;
let showAmpSliderCheckbox, showAmpSliderLabel;
let showAmpSlider = false;
let speedSlider, speedLabel, sizeSlider, sizeLabel;


function setup() {
  createCanvas(windowWidth, windowHeight);

  // Parameter-UI
  bgColorPicker = createColorPicker('#000004');
  bgColorPicker.position(20, 40);
  spanBg = createSpan('Hintergrundfarbe');
  spanBg.position(60, 40);

  ellipseColorPicker = createColorPicker('#ff6464');
  ellipseColorPicker.position(20, 80);
  spanEllipse = createSpan('Ellipse-Farbe');
  spanEllipse.position(60, 80);

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

  showAmpSliderCheckbox = createCheckbox('', false);
  showAmpSliderCheckbox.position(20, 230);
  showAmpSliderLabel = createSpan('Amplitude-Slider während der Show anzeigen');
  showAmpSliderLabel.position(50, 230);

  showAmpSliderCheckbox.changed(() => {
    showAmpSlider = showAmpSliderCheckbox.checked();
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
      showAmpSliderCheckbox.hide();
      showAmpSliderLabel.hide();
        speedSlider.hide();
        speedLabel.hide();
        sizeSlider.hide();
        sizeLabel.hide();
      // Slider nur ausblenden, wenn Checkbox nicht gesetzt ist
      if (!showAmpSliderCheckbox.checked()) {
        ampSlider.hide();
        ampLabel.hide();
      }
      music.play();
    }
  });

   infoText = createP('Parameter einstellen, Musik auswählen und dann "Show starten"');
  infoText.position(20, 300);
  infoText.style('color', '#fff');
  infoText.style('font-size', '24px');

  amplitude = new p5.Amplitude();
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
  if (!showStarted) {
    background(bgColorPicker.color());
  } else {
    // Schweif-Effekt
    let bgCol = color(bgColorPicker.color());
    bgCol.setAlpha(40); // 0 = komplett durchsichtig, 255 = voll sichtbar
    fill(bgCol);
    rect(0, 0, width, height);


    // Musikreaktion
    if (music && music.isPlaying()) {
      let level = amplitude.getLevel();
      let threshold = ampSlider.value();
      if (level > threshold && millis() - lastCircleTime > circleInterval) {
  let numBalls = int(random(15, 30)); // Zufällige Anzahl Bälle
  let minSpeed = speedSlider.value();
  let maxSpeed = minSpeed + 2;
  let ballSize = sizeSlider.value();
  for (let i = 0; i < numBalls; i++) {
    // Winkel mit Zufallsabweichung
    let angle = map(i, 0, numBalls, 0, TWO_PI) + random(-0.2, 0.2);
    let speed = random(minSpeed, maxSpeed);
    let dx = cos(angle) * speed;
    let dy = sin(angle) * speed;
    // Startposition leicht variieren
    let x = width / 2 + random(-20, 20);
    let y = height / 2 + random(-20, 20);
    // Farbe leicht variieren
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
  // Im startButton.mousePressed Callback die UI-Elemente für den Slider ausblenden:

}
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
    this.alpha *= 0.96;
  }

  draw() {
    let c = color(this.col);
    c.setAlpha(this.alpha);
    noStroke();
    fill(c);
    ellipse(this.x, this.y, this.radius);
  }
}