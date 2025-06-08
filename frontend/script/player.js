let playerName = "";

export function setupPlayer(onReady) {
  const btn = document.getElementById("start-btn");
  btn.addEventListener("click", () => {
    const nameInput = document.getElementById("player-name");
    if (!nameInput.value.trim()) {
      alert("Please enter your name!");
      return;
    }

    playerName = nameInput.value.trim();
    document.getElementById("player-display").textContent = playerName;

    if (onReady) onReady();
  });
}

export function getPlayerName() {
  return playerName;
}