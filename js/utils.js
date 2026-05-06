// ════════════════════════════════════════
//  utils.js — Ingredientes, órdenes, helpers
// ════════════════════════════════════════

const INGREDIENTS = {
  bun_bottom: { id: 'bun_bottom', emoji: '🍞', label: 'Pan abajo',  color: '#f4a226', w: 70, h: 20, baseSpeed: 0 },
  bun_top:    { id: 'bun_top',    emoji: '🍔', label: 'Pan arriba', color: '#e8902e', w: 70, h: 20, baseSpeed: 230 },
  meat:       { id: 'meat',       emoji: '🥩', label: 'Carne',      color: '#8b2020', w: 64, h: 14, baseSpeed: 200 },
  lettuce:    { id: 'lettuce',    emoji: '🥬', label: 'Lechuga',    color: '#2d9e2d', w: 66, h: 12, baseSpeed: 280 },
  tomato:     { id: 'tomato',     emoji: '🍅', label: 'Tomate',     color: '#d62828', w: 60, h: 12, baseSpeed: 250 },
  cheese:     { id: 'cheese',     emoji: '🧀', label: 'Queso',      color: '#f9c74f', w: 64, h: 10, baseSpeed: 240 },
  onion:      { id: 'onion',      emoji: '🧅', label: 'Cebolla',    color: '#d4a5de', w: 60, h: 10, baseSpeed: 260 },
};

// Los que pueden caer (sin panes)
const DROPPABLE_IDS = ['meat','lettuce','tomato','cheese','onion','bun_top'];
// Niveles: qué ingredientes se usan y sus rangos de cantidad
const LEVEL_CONFIGS = [
  // Nivel 1 — sencillo
  { ingredients: ['meat','onion','cheese'],        range: [1,2], layers: 2 },
  // Nivel 2
  { ingredients: ['meat','onion','cheese'], range: [1,2], layers: 3 },
  // Nivel 3
  { ingredients: ['meat','cheese','tomato','onion'], range: [1,3], layers: 4 },
  // Nivel 4+
  { ingredients: ['meat','lettuce','cheese','tomato','onion'], range: [1,3], layers: 5 },
  { ingredients: ['meat','lettuce','cheese','tomato','onion'], range: [1,3], layers: 6 },
];

/**
 * Genera un pedido random dado el nivel (1-based).
 * Devuelve array de { id, count } para cada capa (excluyendo panes).
 */
function generateOrder(level) {
  const cfg = LEVEL_CONFIGS[Math.min(level - 1, LEVEL_CONFIGS.length - 1)];
  const pool = [...cfg.ingredients];
  shuffle(pool);

  const numLayers = cfg.layers;
  const order = [];

  // Elegir ingredientes únicos para el pedido
  const chosen = pool.slice(0, Math.min(numLayers, pool.length));

  chosen.forEach(id => {
    const count = randInt(cfg.range[0], cfg.range[1]);
    order.push({ id, count });
  });

  return order; // ej: [{id:'meat',count:2},{id:'lettuce',count:1},...]
}

/**
 * Expande el pedido a una lista plana de capas en orden
 * (sin panes; bun_bottom y bun_top se manejan aparte).
 * Baraja las capas para que no sea siempre el mismo orden.
 */
function expandOrderToLayers(order) {
  const layers = [];
  order.forEach(item => {
    for (let i = 0; i < item.count; i++) {
      layers.push(item.id);
    }
  });
  // No barajamos: el jugador debe poner los ingredientes en el orden del pedido
  return layers;
}

// ── helpers ──────────────────────────────
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Colisión AABB
function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx &&
         ay < by + bh && ay + ah > by;
}
