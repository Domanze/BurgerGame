// ════════════════════════════════════════
//  renderer.js — Canvas rendering
// ════════════════════════════════════════

const Renderer = (() => {
  let canvas, ctx;
  let W = 0, H = 0;

  // Particle system
  const particles = [];

  function init(c) {
    canvas = c;
    ctx = canvas.getContext('2d');
  }

  function resize(w, h) {
    W = w; H = h;
  }

  // ── Background ──────────────────────
  function drawBackground() {
    ctx.fillStyle = '#0f0d0a';
    ctx.fillRect(0, 0, W, H);

    // Sutil gradiente superior
    const grad = ctx.createLinearGradient(0, 0, 0, H * 0.4);
    grad.addColorStop(0, 'rgba(247,127,0,0.06)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Grid lines muy sutiles
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    const spacing = 60;
    for (let gx = 0; gx < W; gx += spacing) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += spacing) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }
  }

  // ── Ingredient falling item ──────────
  function drawIngredient(item) {
    const ing = INGREDIENTS[item.id];
    if (!ing) return;

    const x = item.x;
    const y = item.y;
    const w = ing.w;
    const h = 34;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(item.angle || 0);

    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    // Background pill
    ctx.fillStyle = ing.color;
    roundRect(ctx, -w/2, -h/2, w, h, 10);
    ctx.fill();

    // Shine
    const shine = ctx.createLinearGradient(-w/2, -h/2, -w/2, 0);
    shine.addColorStop(0, 'rgba(255,255,255,0.25)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    roundRect(ctx, -w/2, -h/2, w, h/2, 10);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, -w/2, -h/2, w, h, 10);
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Emoji
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ing.emoji, 0, 0);

    ctx.restore();
  }

  // ── Player (plate + stacked burger) ──
  function drawPlayer(gameState) {
    const pr = Player.getRect();
    const px = pr.x;
    const py = pr.y;
    const pw = pr.w;
    const ph = pr.h;

    ctx.save();

    // Plate glow
    if (gameState && gameState.goodCatch) {
      ctx.shadowColor = '#06d6a0';
      ctx.shadowBlur = 20;
    } else if (gameState && gameState.badCatch) {
      ctx.shadowColor = '#e63946';
      ctx.shadowBlur = 20;
    } else {
      ctx.shadowColor = 'rgba(247,127,0,0.6)';
      ctx.shadowBlur = 12;
    }

    // Plate body
    const plateGrad = ctx.createLinearGradient(px, py, px, py + ph);
    plateGrad.addColorStop(0, '#d4c5a9');
    plateGrad.addColorStop(1, '#a89880');
    ctx.fillStyle = plateGrad;
    roundRect(ctx, px, py, pw, ph, 9);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, px, py, pw, ph, 9);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // ── Stack display on player ──────────
  // (capas de ingredientes encima del plato)
  function drawStack(stack) {
    if (!stack || stack.length === 0) return;
    const pr = Player.getRect();
    const centerX = pr.x + pr.w / 2;
    let baseY = pr.y - 4;

    ctx.save();
    // Cada capa
    stack.forEach((id, i) => {
      const ing = INGREDIENTS[id];
      if (!ing) return;
      const layerH = 10;
      const layerW = Math.min(ing.w, pr.w - 4);
      const lx = centerX - layerW / 2;
      const ly = baseY - layerH;

      ctx.fillStyle = ing.color;
      roundRect(ctx, lx, ly, layerW, layerH, 3);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      roundRect(ctx, lx, ly, layerW, layerH, 3);
      ctx.stroke();

      // Emoji small
      ctx.font = '9px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ing.emoji, centerX, ly + layerH / 2);

      baseY = ly;
    });
    ctx.restore();
  }

  // ── Particles ───────────────────────
  function spawnParticles(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 60 + Math.random() * 120;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        life: 1,
        color,
        size: 4 + Math.random() * 5,
      });
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt; // gravity
      p.life -= dt * 2;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ── Missing zone warning ─────────────
  function drawDangerFloor() {
    const grad = ctx.createLinearGradient(0, H - 30, 0, H);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, 'rgba(230,57,70,0.12)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, H - 30, W, 30);
  }

  // ── Util: rounded rect ───────────────
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function clear() {
    ctx.clearRect(0, 0, W, H);
  }

  function getCtx() { return ctx; }

  return {
    init, resize, clear,
    drawBackground, drawIngredient,
    drawPlayer, drawStack,
    drawParticles, updateParticles,
    drawDangerFloor, spawnParticles,
  };
})();
