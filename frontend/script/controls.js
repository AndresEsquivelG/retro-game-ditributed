let movementX = 0;
let movementY = 0;

export function initControls() {
  document.addEventListener("keydown", (e) => {
    if (e.code === "ArrowUp" && movementY !== 1) {
      movementY = -1; movementX = 0;
    } else if (e.code === "ArrowRight" && movementX !== -1) {
      movementY = 0; movementX = 1;
    } else if (e.code === "ArrowDown" && movementY !== -1) {
      movementY = 1; movementX = 0;
    } else if (e.code === "ArrowLeft" && movementX !== 1) {
      movementY = 0; movementX = -1;
    }
  });
}

export function getDirection() {
  return { movementX, movementY };
}

export function getDirectionString() {
  if (movementX ===  1) return "right";
  if (movementX === -1) return "left";
  if (movementY ===  1) return "down";
  if (movementY === -1) return "up";
  return "right"; // valor por defecto
}