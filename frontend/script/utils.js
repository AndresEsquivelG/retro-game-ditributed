export function spawnFood(cols, rows, unitSize) {
  return {
    x: Math.floor(Math.random() * cols) * unitSize,
    y: Math.floor(Math.random() * rows) * unitSize,
  };
}