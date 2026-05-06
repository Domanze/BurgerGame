# 🍔 Burger Drop

Juego de navegador donde debes atrapar ingredientes que caen del cielo para armar pedidos de hamburguesas.

## Estructura

```
burger-game/
├── index.html          ← Pantallas: menú, cómo jugar, juego, pausa, game over
├── css/
│   └── style.css       ← Tema oscuro anaranjado, paneles, feedback, responsive
├── js/
│   ├── main.js         ← Game loop (requestAnimationFrame), resize, botones
│   ├── game.js         ← Spawner, validación de pedido, scoring, HUD
│   ├── player.js       ← Movimiento, clamp, plateRect
│   ├── input.js        ← Teclado, mouse, touch
│   ├── renderer.js     ← Canvas: fondo, ingredientes, plato, partículas
│   └── utils.js        ← Definición de ingredientes, generador de órdenes, helpers
└── assets/             ← Listo para imágenes y audio propios
```

## Cómo jugar

- **← / → / A / D**: Mueve el plato con teclado
- **Mouse / Touch**: Arrastra el plato siguiendo el cursor
- **ESC / P**: Pausa

### Reglas
1. Aparece un **pedido** en el panel superior con los ingredientes y cantidades exactas
2. El **pan de abajo** se pone automáticamente al inicio
3. Atrapa los ingredientes **en el orden del pedido** con tu plato
4. Cuando hayas atrapado todos, atrapa el **pan de arriba** para completar la hamburguesa
5. Atrapar un ingrediente incorrecto o fuera de orden = **-1 vida**
6. Tienes **60 segundos** por sesión, cada 3 pedidos completos subes de nivel

### Puntuación
- +10 por cada ingrediente correcto
- +100 por completar un pedido
- Bonus según nivel al completar pedido

## Abrir

Simplemente abre `index.html` en tu navegador. No requiere servidor.

## Ingredientes disponibles

🥩 Carne · 🥬 Lechuga · 🍅 Tomate · 🧀 Queso · 🧅 Cebolla
