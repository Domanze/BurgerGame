// ════════════════════════════════════════
//  main.js — Game loop, pantallas, botones
// ════════════════════════════════════════

const Main = (() => {
  let canvas;
  let lastTime = 0;
  let animId = null;
  let activeScreen = 'menu';

  // ── Screen management ─────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`screen-${id}`);
    if (el) el.classList.add('active');
    activeScreen = id;
  }

  // ── Canvas resize ─────────────────────
  function resizeCanvas() {
    const gameScreen = document.getElementById('screen-game');
    if (!gameScreen) return;

    const hud       = document.getElementById('hud');
    const order     = document.getElementById('order-panel');
    const pause     = document.getElementById('btn-pause');

    const topH    = (hud?.offsetHeight || 0) + (order?.offsetHeight || 0);
    const availH = window.innerHeight - topH;
    const availW  = window.innerWidth;

    canvas.width  = availW;
    canvas.height = Math.max(200, availH);

    Renderer.resize(canvas.width, canvas.height);
    Player.resize(canvas.width, canvas.height);
    Game.resize(canvas.width, canvas.height);
  }

  // ── Game loop ─────────────────────────
  function loop(ts) {
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    if (activeScreen === 'game') {
      // Update
      Player.update(dt);
      Game.update(dt);
      Renderer.updateParticles(dt);

      // Render
      Renderer.clear();
      Renderer.drawBackground();
      Renderer.drawDangerFloor();

      const fallingItems = Game.getFallingItems();
      fallingItems.forEach(item => Renderer.drawIngredient(item));

      Renderer.drawPlayer(Game.getState());
      Renderer.drawStack(Game.getPlayerStack());
      Renderer.drawParticles();
    }

    animId = requestAnimationFrame(loop);
  }

  // ── Start game ────────────────────────
  function startGame() {
    showScreen('game');
    Input.setEnabled(true);

    // Small delay para que el layout se calcule
    setTimeout(() => {
      resizeCanvas();
      Player.init(canvas.width, canvas.height);
      Game.init(canvas.width, canvas.height, (stats) => {
        // Game over callback
        showScreen('gameover');
        document.getElementById('go-score').textContent   = stats.score;
        document.getElementById('go-orders').textContent  = stats.ordersCompleted;
        document.getElementById('go-level').textContent   = stats.level;
      });
    }, 50);
  }

  // ── Init ─────────────────────────────
  function init() {
    canvas = document.getElementById('game-canvas');
    Renderer.init(canvas);

    // Resize listener
    window.addEventListener('resize', () => {
      if (activeScreen === 'game') resizeCanvas();
    });

    // ── Button wiring ──────────────────
    document.getElementById('btn-play').addEventListener('click', () => {
      startGame();
    });

    document.getElementById('btn-how').addEventListener('click', () => {
      showScreen('howto');
    });

    document.getElementById('btn-back').addEventListener('click', () => {
      showScreen('menu');
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
      Game.setPaused(false);
      showScreen('game');
    });

    document.getElementById('btn-menu-from-pause').addEventListener('click', () => {
      Game.setPaused(false);
      showScreen('menu');
    });

    document.getElementById('btn-retry').addEventListener('click', () => {
      startGame();
    });

    document.getElementById('btn-menu-go').addEventListener('click', () => {
      showScreen('menu');
    });

    // Keyboard pause
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (activeScreen === 'game' && Game.isRunning()) {
          Game.setPaused(true);
          showScreen('pause');
        } else if (activeScreen === 'pause') {
          Game.setPaused(false);
          showScreen('game');
        }
      }
    });

    // Start loop
    showScreen('menu');
    requestAnimationFrame(ts => {
      lastTime = ts;
      animId = requestAnimationFrame(loop);
    });
  }

  return { init };
})();

// ── Boot ──────────────────────────────────
window.addEventListener('DOMContentLoaded', () => Main.init());
