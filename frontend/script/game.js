import { snakeHeadImg, fruitImg, snakeBodyImg } from './assets.js';
import { initControls, getDirection } from './controls.js';
import { getDirectionString } from './controls.js';
import { spawnFood } from './utils.js';

let playground, context;
let rows = 17, cols = 17, unitSize = 25;
let interval, movesPerSec = 8;
let playerX, playerY, foodX, foodY, score = 0;
let playerBody = [], gameOver = false;

export function startGame() {
  playground = document.getElementById("playground");
  playground.width = cols * unitSize;
  playground.height = rows * unitSize;
  context = playground.getContext("2d");

  playerX = Math.floor(Math.random() * 10) * unitSize;
  playerY = Math.floor(Math.random() * 10) * unitSize;
  ({ x: foodX, y: foodY } = spawnFood(cols, rows, unitSize));

  initControls();
  interval = setInterval(() => { draw(); }, 1000 / movesPerSec);
}

async function draw() {
  if (gameOver) return;

  // limpia pantalla…
  context.fillRect(0, 0, playground.width, playground.height);

  // 1) Prepara segmentos como objetos
  const segmentsIn = [
    { x: playerX, y: playerY },
    ...playerBody.map(([x,y]) => ({ x, y }))
  ];
  const direction = getDirectionString();

  // 2) Llama a next-move
  const segmentsOut = await fetchNextMove(segmentsIn, direction);
  [playerX, playerY] = [segmentsOut[0].x, segmentsOut[0].y];
  playerBody = segmentsOut.slice(1).map(o => [o.x, o.y]);

  // 3) Colisión/comida
  const collision = await fetchCollision(segmentsOut, { x: foodX, y: foodY });
  if (collision.dead) { endGame(); return; }
  if (collision.ate) {
  score++;
  document.getElementById("score").innerText = score;

  // Duplicar último segmento del cuerpo (posición anterior)
  if (playerBody.length > 0) {
    const lastSegment = playerBody[playerBody.length - 1];
    playerBody.push([...lastSegment]);
  } else {
    playerBody.push([playerX, playerY]);
  }

  const nf = await fetchFood(segmentsOut);
  foodX = nf.x; foodY = nf.y;
}

  // 4) Dibujar imágenes
  context.drawImage(fruitImg,    foodX,    foodY,    unitSize, unitSize);
  context.drawImage(snakeHeadImg, playerX,  playerY,  unitSize, unitSize);
  playerBody.forEach(([x,y]) =>
    context.drawImage(snakeBodyImg, x, y, unitSize, unitSize)
  );
}


// Llama a /next-move y devuelve el array de segmentos
async function fetchNextMove(segments, direction) {
  const res = await fetch("http://localhost:8000/next-move", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segments, direction })
  });
  if (!res.ok) throw new Error("next-move error");
  const data = await res.json();
  return data.segments;
}

// Llama a /generate-food y devuelve { x, y }
async function fetchFood(segments) {
  const res = await fetch("http://localhost:8000/generate-food", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segments })
  });
  if (!res.ok) throw new Error("generate-food error");
  return await res.json();
}

// Llama a /check-collision y devuelve { dead, ate }
async function fetchCollision(segments, food) {
  const res = await fetch("http://localhost:8000/check-collision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ segments, food })
  });
  if (!res.ok) throw new Error("check-collision error");
  return await res.json();
}
 

function endGame() {
  gameOver = true;
  clearInterval(interval);
  document.getElementById("game-over").classList.remove("hidden");
}

window.restartGame = function () {
  location.reload();
};