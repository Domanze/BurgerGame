// ════════════════════════════════════════
//  player.js — Jugador, plato, movimiento
// ════════════════════════════════════════

const Player = (() => {
  const PLATE_W   = 100;
  const PLATE_H   = 18;
  const SPEED     = 420;  // px/s con teclado
  const SMOOTH    = 0.18; // factor de suavizado para mouse/touch

  let x = 0;        // centro del plato
  let y = 0;
  let canvasW = 1;
  let canvasH = 1;
  let targetX = 0;
  let usingPointer = false;

  function init(cw, ch) {
    canvasW = cw;
    canvasH = ch;
    x = cw / 2;
    targetX = x;
    y = ch - 40;
  }

  function resize(cw, ch) {
    const ratioX = cw / canvasW;
    canvasW = cw;
    canvasH = ch;
    x = clamp(x * ratioX, PLATE_W / 2, canvasW - PLATE_W / 2);
    targetX = x;
    y = ch - 40;
  }

  function update(dt) {
    const mouseX = Input.mouseX();
    const touchX = Input.touchX();

    if (mouseX !== null || Input.isTouching()) {
      // Pointer control: seguimos suavemente al cursor/touch
      const rawX = (touchX !== null) ? touchX : mouseX;
      // Convertir a coordenadas de canvas
      const canvas = document.getElementById('game-canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvasW / rect.width;
        targetX = (rawX - rect.left) * scaleX;
      }
      usingPointer = true;
    } else {
      usingPointer = false;
    }

    if (usingPointer) {
      x = lerp(x, targetX, 1 - Math.pow(1 - SMOOTH, dt * 60));
    } else {
      // Teclado
      if (Input.isLeft())  x -= SPEED * dt;
      if (Input.isRight()) x += SPEED * dt;
    }

    x = clamp(x, PLATE_W / 2, canvasW - PLATE_W / 2);
  }

  function getRect() {
    return { x: x - PLATE_W / 2, y, w: PLATE_W, h: PLATE_H };
  }

  function getX() { return x; }
  function getY() { return y; }
  function getW() { return PLATE_W; }

  return { init, resize, update, getRect, getX, getY, getW };
})();
