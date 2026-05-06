// ════════════════════════════════════════
//  game.js — Lógica principal del juego
// ════════════════════════════════════════

const Game = (() => {
  // ── Estado ────────────────────────────
  let score       = 0;
  let lives       = 3;
  let level       = 1;
  let timeLeft    = 60;
  let ordersCompleted = 0;

  let currentOrder  = [];   // [{id, count}] — pedido actual
  let targetLayers  = [];   // lista plana de IDs que debe atrapar en orden
  let playerStack   = [];   // lo que el jugador lleva encima del plato
  let nextLayerIdx  = 0;    // índice en targetLayers del siguiente ingrediente a atrapar

  let fallingItems  = [];   // {id, x, y, vy, angle, spin, w, h}
  let spawnTimer    = 0;
  let minSpawnInterval = 1.0;  // Minimum seconds between spawns
  let maxSpawnInterval = 1.8;  // Maximum seconds between spawns
  let spawnInterval = 1.5;     // Current interval (will be randomized)

  let goodCatch = false;    // para efecto visual
  let badCatch  = false;
  let catchTimer = 0;

  let paused    = false;
  let gameOver  = false;
  let running   = false;

  let onGameOver = null;

  // ── Canvas dims ───────────────────────
  let canvasW = 1, canvasH = 1;

  // ── Init ─────────────────────────────
  function init(w, h, _onGameOver) {
    canvasW = w; canvasH = h;
    onGameOver = _onGameOver;
    reset();
  }

  function reset() {
    score = 0; lives = 3; level = 1;
    timeLeft = 60; ordersCompleted = 0;
    fallingItems = []; playerStack = [];
    goodCatch = false; badCatch = false;
    spawnTimer = 0;
    spawnInterval = minSpawnInterval + Math.random() * (maxSpawnInterval - minSpawnInterval);  // Randomize initial interval
    paused = false; gameOver = false; running = true;
    newOrder();
    updateHUD();
  }

  // ── Nuevo pedido ──────────────────────
  function newOrder() {
    playerStack = [];
    fallingItems = [];
    spawnTimer = 0;
    nextLayerIdx = 0;

    currentOrder = generateOrder(level);
    targetLayers = expandOrderToLayers(currentOrder);

    renderOrderPanel();
    showFeedback('📋 ¡Nuevo pedido!', 'neutral', 1200);
  }

  // ── Render panels HTML ────────────────
  function renderOrderPanel() {
    const list = document.getElementById('order-list');
    list.innerHTML = '';

    currentOrder.forEach((item, i) => {
      const ing = INGREDIENTS[item.id];
      const el = document.createElement('span');
      el.className = 'order-item';
      el.id = `order-item-${i}`;
      el.textContent = `${ing.emoji}×${item.count}`;
      list.appendChild(el);
    });

    updateOrderHighlight();
  }

  function updateOrderHighlight() {
    const got = {};
    playerStack.forEach(id => { got[id] = (got[id] || 0) + 1; });

    currentOrder.forEach((item, i) => {
      const el = document.getElementById(`order-item-${i}`);
      if (!el) return;
      const have = got[item.id] || 0;
      const remaining = item.count - have;
      const ing = INGREDIENTS[item.id];
      if (remaining <= 0) {
        el.remove();
      } else {
        el.textContent = `${ing.emoji}×${remaining}`;
      }
    });

    // aviso tapa
    const existing = document.getElementById('order-cap-notice');
    if (nextLayerIdx >= targetLayers.length) {
      if (!existing) {
        const notice = document.createElement('span');
        notice.className = 'order-item next';
        notice.id = 'order-cap-notice';
        notice.textContent = '🍔 ¡Pon la tapa!';
        document.getElementById('order-list').appendChild(notice);
      }
    } else {
      if (existing) existing.remove();
    }
  }

  // ── Spawner ───────────────────────────
  function spawnIngredient() {
    if (!running || gameOver || paused) return;

    // Determinar qué ingredientes pueden caer:
    // - Los que aún faltan en el pedido (para que sea completable)
    // - Más algunos random incorrectos para dificultad
    const needed = [];
    const remaining = {}; // cuántos necesita aún

    currentOrder.forEach(item => {
      const have = playerStack.filter(id => id === item.id).length;
      const diff = item.count - have;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) needed.push(item.id);
      }
    });
    const isFinal = nextLayerIdx >= targetLayers.length;

    if (isFinal) {
      const pool = [...DROPPABLE_IDS];
      const bunSlots = Math.floor(pool.length * 0.35 / 0.65);
      for (let i = 0; i < bunSlots; i++) pool.push('bun_top');
      spawnItem(pool[Math.floor(Math.random() * pool.length)]);
      return;
    }

    let id;
    if (needed.length > 0 && Math.random() < 0.7) {
      id = needed[Math.floor(Math.random() * needed.length)];
    } else {
      const allIds = [...DROPPABLE_IDS];
      shuffle(allIds);
      id = allIds.find(d => !needed.includes(d)) || allIds[0];
    }
    spawnItem(id);
  }

  function spawnItem(id) {
    const ing = INGREDIENTS[id];
    let x;
    let attempts = 0;
    const minDistance = 60;  // Minimum pixels apart horizontally
    do {
      x = 30 + Math.random() * (canvasW - 60);
      attempts++;
    } while (attempts < 10 && fallingItems.some(item => Math.abs(x - item.x) < minDistance));

    fallingItems.push({
      id,
      x,
      y: -40,
      vy: ing.baseSpeed + level * 15 + Math.random() * 60,
      angle: (Math.random() - 0.5) * 0.3,
      spin: (Math.random() - 0.5) * 1.5,
      w: ing.w,
      h: 34,
    });
  }

  // ── Update ────────────────────────────
  function update(dt) {
    if (!running || paused || gameOver) return;

    // Temporizador
    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      triggerGameOver();
      return;
    }

    // Urgency visual
    const hudTime = document.getElementById('hud-time');
    if (timeLeft <= 10) hudTime.classList.add('urgent');
    else hudTime.classList.remove('urgent');

    // Catch timer
    if (catchTimer > 0) {
      catchTimer -= dt;
      if (catchTimer <= 0) { goodCatch = false; badCatch = false; }
    }

    // Spawner
    spawnTimer += dt;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      // Spawn 1 or 2 ingredients randomly
      let numToSpawn = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numToSpawn; i++) {
        spawnIngredient();
      }
      // Set next interval randomly within range
      spawnInterval = minSpawnInterval + Math.random() * (maxSpawnInterval - minSpawnInterval);
    }

    // Mover ingredientes
    const pr = Player.getRect();

    for (let i = fallingItems.length - 1; i >= 0; i--) {
      const item = fallingItems[i];
      item.y += item.vy * dt;
      item.angle += item.spin * dt;

      // Colisión con plato
      if (rectsOverlap(
        item.x - item.w / 2, item.y - 17, item.w, 34,
        pr.x, pr.y, pr.w, pr.h
      )) {
        handleCatch(item);
        fallingItems.splice(i, 1);
        continue;
      }

      // Fuera de pantalla (miss)
      if (item.y > canvasH + 50) {
        fallingItems.splice(i, 1);
      }
    }

    updateHUD();
    updateOrderHighlight();
  }

  // ── Catch logic ───────────────────────
  function handleCatch(item) {
    if (item.id === 'bun_top') {
      if (nextLayerIdx >= targetLayers.length) {
        completeOrder();
      } else {
        penalizeBadCatch('¡El pan va al final! -1❤️');
      }
      return;
    }

    // Buscar si este ingrediente aún se necesita (sin importar orden)
    const got = {};
    playerStack.forEach(id => { got[id] = (got[id] || 0) + 1; });
    const needed = currentOrder.find(item2 =>
      item2.id === item.id && (got[item.id] || 0) < item2.count
    );

    if (needed) {
      playerStack.push(item.id);
      // Avanzar nextLayerIdx para que coincida con lo que falta
      nextLayerIdx = playerStack.length;
      score += 10;
      goodCatch = true; badCatch = false;
      catchTimer = 0.25;
      Renderer.spawnParticles(item.x, item.y, '#06d6a0', 10);
      showFeedback('✓ +10', 'good', 600);
    } else {
      Renderer.spawnParticles(item.x, item.y, '#e63946', 8);
      penalizeBadCatch(`¡Ingrediente no necesario!`);
    }
  }

  function penalizeBadCatch(msg) {
    badCatch = true; goodCatch = false;
    catchTimer = 0.4;
    loseLife();
    showFeedback(msg, 'bad', 1000);
  }

  function loseLife() {
    lives = Math.max(0, lives - 1);
    const canvas = document.getElementById('game-canvas');
    canvas.style.animation = 'none';
    canvas.offsetHeight;
    canvas.style.animation = 'shakeX 0.3s';
    if (lives <= 0) triggerGameOver();
    else updateHUD();
  }

  // ── Complete order ─────────────────────
  function completeOrder() {
    playerStack.push('bun_top');
    ordersCompleted++;
    const bonus = level * 50;
    score += 100 + bonus;
    goodCatch = true;
    catchTimer = 0.5;
    Renderer.spawnParticles(canvasW / 2, canvasH / 2, '#ffd166', 24);
    showFeedback(`🎉 ¡Pedido completo! +${100 + bonus}`, 'good', 1500);
    levelUp();

  }

  function levelUp() {
    level++;
    // Tighten the spawn interval range for higher difficulty
    minSpawnInterval = Math.max(0.5, minSpawnInterval - 0.1);
    maxSpawnInterval = Math.max(1.0, maxSpawnInterval - 0.2);
    timeLeft = Math.min(timeLeft + 20, 60); // bonus de tiempo

    const luScreen = document.getElementById('screen-levelup');
    document.getElementById('lu-level').textContent = level;
    document.getElementById('lu-bonus').textContent = level * 100;
    luScreen.classList.add('active');

    setTimeout(() => {
      luScreen.classList.remove('active');
      newOrder();
    }, 2000);
  }
  // ── HUD ───────────────────────────────
  function updateHUD() {
    document.getElementById('hud-score').textContent = score;
    document.getElementById('hud-time').textContent = Math.ceil(timeLeft);
    const heartsMap = ['', '❤️', '❤️❤️', '❤️❤️❤️'];
    document.getElementById('hud-lives').textContent = heartsMap[lives] || '';
  }

  // ── Feedback toast ────────────────────
  let feedbackTimeout;
  function showFeedback(msg, type = 'neutral', duration = 800) {
    const el = document.getElementById('feedback');
    clearTimeout(feedbackTimeout);
    el.textContent = msg;
    el.className = `feedback ${type}`;
    feedbackTimeout = setTimeout(() => {
      el.className = 'feedback hidden';
    }, duration);
  }

  // ── Game Over ─────────────────────────
  function triggerGameOver() {
    running = false; gameOver = true;
    Input.setEnabled(false);
    if (onGameOver) onGameOver({ score, ordersCompleted, level });
  }

  function setPaused(v) {
    paused = v;
    Input.setEnabled(!v);
  }

  function resize(w, h) { canvasW = w; canvasH = h; }

  function getState() { return { goodCatch, badCatch }; }
  function getFallingItems() { return fallingItems; }
  function getPlayerStack() { return playerStack; }
  function isRunning() { return running; }

  return {
    init, reset, update, resize,
    setPaused, getState,
    getFallingItems, getPlayerStack,
    isRunning,
  };
})();
