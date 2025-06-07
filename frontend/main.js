const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#222',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    }
  },
  scene: {
    preload,
    create,
    update
  }
};

const game = new Phaser.Game(config);

let tank;
let bullets;
let cursors;
let spaceKey;
let lastFired = 0;

function preload() {
  this.load.image('tank', 'https://i.imgur.com/YOUR_TANK_SPRITE.png');  // Cambia esto si querés usar otro sprite
  this.load.image('bullet', 'https://i.imgur.com/1ZQZ1Zm.png');
}

function create() {
    tank = this.physics.add.image(400, 300, 'tank').setCollideWorldBounds(true);
    tank.setDamping(true);
    tank.setDrag(0.95);
    tank.setMaxVelocity(200);

    bullets = this.physics.add.group({
    defaultKey: 'bullet',
    maxSize: 10
    });

    cursors = this.input.keyboard.createCursorKeys();
    spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    walls = this.physics.add.staticGroup();
    walls.create(400, 100, 'tank').setScale(0.5).refreshBody().setAlpha(0.2); // pared de prueba

    this.physics.add.collider(tank, walls);
    this.physics.add.collider(enemies, walls);
    this.physics.add.collider(tank, enemies);

}

function update(time, delta) {
  // Rotación
  if (cursors.left.isDown) {
    tank.setAngularVelocity(-150);
  } else if (cursors.right.isDown) {
    tank.setAngularVelocity(150);
  } else {
    tank.setAngularVelocity(0);
  }

  // Movimiento
  if (cursors.up.isDown) {
    this.physics.velocityFromRotation(tank.rotation, 200, tank.body.acceleration);
  } else {
    tank.setAcceleration(0);
  }

  // Disparar
  if (Phaser.Input.Keyboard.JustDown(spaceKey) && time > lastFired) {
    const bullet = bullets.get(tank.x, tank.y);
    if (bullet) {
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setRotation(tank.rotation);
      bullet.body.reset(tank.x, tank.y);
      this.physics.velocityFromRotation(tank.rotation, 400, bullet.body.velocity);
      lastFired = time + 300;
    }
  }

  // Limpiar balas fuera de pantalla
  bullets.children.each(bullet => {
    if (bullet.active && (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600)) {
      bullets.killAndHide(bullet);
    }
  });

    if (!this.lastEnemyUpdate || time - this.lastEnemyUpdate > 2000) {
    this.lastEnemyUpdate = time;
    fetch("http://localhost:8000/enemies")
        .then(res => res.json())
        .then(data => {
        let i = 0;
        enemies.getChildren().forEach(e => {
            if (data[i]) {
            this.physics.moveTo(e, data[i].x, data[i].y, 50);
            }
            i++;
        });
        });
    }
}

let enemies;
enemies = this.physics.add.group();

fetch("http://localhost:8000/enemies")
  .then(res => res.json())
  .then(data => {
    data.forEach(enemy => {
      const e = enemies.create(enemy.x, enemy.y, 'tank');
      e.setAngle(enemy.angle);
      e.setTint(0xff0000); // Rojo para distinguir
      e.setCollideWorldBounds(true);
    });
  });