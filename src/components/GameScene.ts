import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private curves: Phaser.Curves.Spline[] = [];
  private lastPosition: Phaser.Math.Vector2;
  load: any;
  matter: any;

  constructor() {
    super({ key: 'GameScene' });
    this.lastPosition = new Phaser.Math.Vector2();
  }

  preload(): void {
    this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
    this.load.image('ball', 'assets/sprites/pangball.png');
  }

  create(): void {
    this.matter.world.setBounds(0, 0, 800, 600, 32, true, true, false, true);
    const lineCategory = this.matter.world.nextCategory();
    const ballsCategory = this.matter.world.nextCategory();

    const sides = 4;
    const size = 14;
    const distance = size;
    const stiffness = 0.1;

    let current: MatterJS.BodyType | null = null;
    let previous: MatterJS.BodyType | null = null;
    let curve: Phaser.Curves.Spline | null = null;

    this.graphics = this.add.graphics();

    const options = {
      friction: 0,
      frictionAir: 0,
      restitution: 0,
      ignoreGravity: true,
      inertia: Infinity,
      isStatic: true,
      angle: 0,
      collisionFilter: { category: lineCategory },
    };

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.lastPosition.x = pointer.x;
      this.lastPosition.y = pointer.y;
      previous = this.matter.add.polygon(
        pointer.x,
        pointer.y,
        sides,
        size,
        options,
      );
      curve = new Phaser.Curves.Spline([pointer.x, pointer.y]);
      this.curves.push(curve);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        const x = pointer.x;
        const y = pointer.y;
        if (
          Phaser.Math.Distance.Between(
            x,
            y,
            this.lastPosition.x,
            this.lastPosition.y,
          ) > distance
        ) {
          options.angle = Phaser.Math.Angle.Between(
            x,
            y,
            this.lastPosition.x,
            this.lastPosition.y,
          );
          this.lastPosition.x = x;
          this.lastPosition.y = y;
          current = this.matter.add.polygon(
            pointer.x,
            pointer.y,
            sides,
            size,
            options,
          );

          if (previous) {
            this.matter.add.constraint(previous, current, distance, stiffness);
          }

          previous = current;
          curve?.addPoint(x, y);

          this.graphics.clear();
          this.graphics.lineStyle(size * 1.5, 0xffffff);
          this.curves.forEach((c) => {
            c.draw(this.graphics, 64);
          });
        }
      }
    });

    this.input.once('pointerup', () => {
      this.time.addEvent({
        delay: 1000,
        callback: () => {
          const ball = this.matter.add.image(
            Phaser.Math.Between(100, 700),
            Phaser.Math.Between(-600, 0),
            'ball',
          );
          ball.setCircle();
          ball.setCollisionCategory(ballsCategory);
          ball.setFriction(0.005).setBounce(0.9);
        },
        callbackScope: this,
        repeat: 100,
      });
    });
  }
}
