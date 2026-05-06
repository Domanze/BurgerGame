// ════════════════════════════════════════
//  input.js — Teclado, mouse drag, touch
// ════════════════════════════════════════

const Input = (() => {
  const keys = {};
  let mouseX = null;
  let touching = false;
  let touchX = null;
  let enabled = true;

  // ── Keyboard ──────────────────────────
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (['ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // ── Mouse ─────────────────────────────
  window.addEventListener('mousemove', e => {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
  });
  window.addEventListener('mouseleave', () => { mouseX = null; });

  // ── Touch ─────────────────────────────
  window.addEventListener('touchstart', e => {
    touching = true;
    touchX = e.touches[0].clientX;
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('touchmove', e => {
    if (e.touches.length > 0) {
      touchX = e.touches[0].clientX;
    }
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('touchend', () => {
    touching = false;
    touchX = null;
  });

  return {
    isLeft()  { return enabled && (keys['ArrowLeft'] || keys['a'] || keys['A']); },
    isRight() { return enabled && (keys['ArrowRight'] || keys['d'] || keys['D']); },
    mouseX()  { return enabled ? mouseX : null; },
    touchX()  { return enabled ? touchX : null; },
    isTouching() { return touching; },
    setEnabled(v) { enabled = v; if (!v) Object.keys(keys).forEach(k => keys[k] = false); },
  };
})();
