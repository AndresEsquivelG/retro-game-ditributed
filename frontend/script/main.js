import { startGame } from './game.js';
import { setupPlayer } from './player.js';

window.onload = () => {
  setupPlayer(() => {
    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("game-container").classList.remove("hidden");
    startGame();
  });
};