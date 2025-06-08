let playground;
let rows = 17;
let cols = 17;
let unitSize = 25;
let context;
let movementX = 0;
let movementY = 0;
let movesPerSec = 8;
let playerBody = [];
let gameOver = false;
let interval;
let score = 0;

const snakeHeadImg = new Image();
snakeHeadImg.src = "./snake.svg";

const fruitImg = new Image();
fruitImg.src = "./fruit.svg";

const snakeBody = new Image();
snakeBody.src = "./snakeBody.svg";

window.onload = function () {
  document.getElementById("start-btn").addEventListener("click", () => {
    const nameInput = document.getElementById("player-name");
    if (!nameInput.value.trim()) {
      alert("Please enter your name!");
      return;
    }

    playerName = nameInput.value.trim();
    document.getElementById("player-display").textContent = playerName;

    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("game-container").classList.remove("hidden");

    startGame();
  });
};

function startGame() {
  playground = document.getElementById("playground");
  playground.width = cols * unitSize;
  playground.height = rows * unitSize;
  context = playground.getContext("2d");
  document.addEventListener("keydown", changeDir);
  spawnFood();
  interval = setInterval(draw, 1000 / movesPerSec);
}

let playerX = Math.floor(Math.random() * 10) * unitSize;
let playerY = Math.floor(Math.random() * 10) * unitSize;

let foodX;
let foodY;

function spawnFood() {
  foodX = Math.floor(Math.random() * cols) * unitSize;
  foodY = Math.floor(Math.random() * rows) * unitSize;
}

function draw() {
  context.fillStyle = "#222";
  context.fillRect(0, 0, playground.width, playground.height);

  if (playerX === foodX && playerY === foodY) {
    playerBody.push([foodX, foodY]);
    spawnFood();
    score++;
    document.getElementById("score").innerText = score;
  }

  for (let i = playerBody.length - 1; i > 0; i--) {
    playerBody[i] = playerBody[i - 1];
  }
  if (playerBody.length) {
    playerBody[0] = [playerX, playerY];
  }

  context.drawImage(fruitImg, foodX, foodY, unitSize, unitSize);

  playerX += movementX * unitSize;
  playerY += movementY * unitSize;

  context.drawImage(snakeHeadImg, playerX, playerY, unitSize, unitSize);

  for (let i = 0; i < playerBody.length; i++) {
    context.drawImage(
      snakeBody,
      playerBody[i][0],
      playerBody[i][1],
      unitSize,
      unitSize
    );
  }

  if (
    playerX < 0 ||
    playerY < 0 ||
    playerX >= cols * unitSize ||
    playerY >= rows * unitSize
  ) {
    endGame();
  }

  for (let i = 0; i < playerBody.length; i++) {
    if (playerX === playerBody[i][0] && playerY === playerBody[i][1]) {
      endGame();
    }
  }
}

function changeDir(e) {
  if (e.code === "ArrowUp" && movementY !== 1) {
    movementY = -1;
    movementX = 0;
  } else if (e.code === "ArrowRight" && movementX !== -1) {
    movementY = 0;
    movementX = 1;
  } else if (e.code === "ArrowDown" && movementY !== -1) {
    movementY = 1;
    movementX = 0;
  } else if (e.code === "ArrowLeft" && movementX !== 1) {
    movementY = 0;
    movementX = -1;
  }
}

function endGame() {
  gameOver = true;
  clearInterval(interval);
  document.getElementById("game-over").classList.remove("hidden");
}

function restartGame() {
  location.reload();
}