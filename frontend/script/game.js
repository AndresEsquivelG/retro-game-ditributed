import { snakeHeadImg, fruitImg, snakeBodyImg } from './assets.js';
import { initControls, getDirection } from './controls.js';
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
  interval = setInterval(draw, 1000 / movesPerSec);
}

function draw() {
  if (gameOver) return;

  context.fillStyle = "#222";
  context.fillRect(0, 0, playground.width, playground.height);

  if (playerX === foodX && playerY === foodY) {
    playerBody.push([foodX, foodY]);
    ({ x: foodX, y: foodY } = spawnFood(cols, rows, unitSize));
    score++;
    document.getElementById("score").innerText = score;
  }

  for (let i = playerBody.length - 1; i > 0; i--) {
    playerBody[i] = playerBody[i - 1];
  }

  if (playerBody.length) {
    playerBody[0] = [playerX, playerY];
  }

  const { movementX, movementY } = getDirection();
  playerX += movementX * unitSize;
  playerY += movementY * unitSize;

  context.drawImage(fruitImg, foodX, foodY, unitSize, unitSize);
  context.drawImage(snakeHeadImg, playerX, playerY, unitSize, unitSize);

  playerBody.forEach(([x, y]) => {
    context.drawImage(snakeBodyImg, x, y, unitSize, unitSize);
  });

  if (
    playerX < 0 || playerY < 0 ||
    playerX >= cols * unitSize || playerY >= rows * unitSize ||
    playerBody.some(([x, y]) => x === playerX && y === playerY)
  ) {
    endGame();
  }
}

function endGame() {
  gameOver = true;
  clearInterval(interval);
  document.getElementById("game-over").classList.remove("hidden");
}

window.restartGame = function () {
  location.reload();
};