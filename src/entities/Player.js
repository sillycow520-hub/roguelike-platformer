超级牛-壹号: 06-28 01:46:46
```javascript
import { PLAYER_SPEED, PLAYER_JUMP, PLAYER_ROLL_SPEED, PLAYER_ROLL_DURATION, ATTACK_DURATION, ATTACK_RANGE, COLORS } from '../constants.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(24, 32);
        this.setCollideWorldBounds(true);

        this.isRolling = false;
        this.isAttacking = false;
        this.facingRight = true;
        this.health = 5;
        this.maxHealth = 5;
        this.invincible = false;
        this._alive = true;

        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keyJ = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
        this.keyK = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
        this.keyShift = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keySpace = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.attackBox = null;
        this.attackTimer = null;
    }

    update(time, delta) {
        if (!this._alive || !this.scene) return;
        if (this.isRolling) return;

        const onGround = this.body.blocked.down || this.body.touching.down;

        const moveLeft = this.cursors.left.isDown || this.keyA.isDown;
        const moveRight = this.cursors.right.isDown || this.keyD.isDown;

        if (moveLeft) {
            this.setVelocityX(-PLAYER_SPEED);
            this.facingRight = false;
            this.setFlipX(true);
        } else if (moveRight) {
            this.setVelocityX(PLAYER_SPEED);
            this.facingRight = true;
            this.setFlipX(false);
        } else {
            this.setVelocityX(0);
        }

        const jumpPressed = this.cursors.up.isDown || this.keyW.isDown || this.keySpace.isDown;
        if (jumpPressed && onGround) {
            this.setVelocityY(PLAYER_JUMP);
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyK) || Phaser.Input.Keyboard.JustDown(this.keyShift)) {
            this.roll();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyJ)) {
            this.attack();
        }

        if (this.attackBox && this.attackBox.active) {
            const offsetX = this.facingRight ? ATTACK_RANGE : -ATTACK_RANGE - 16;
            this.attackBox.setPosition(this.x + offsetX, this.y);
        }
    }

    roll() {
        this.isRolling = true;
        this.setAlpha(0.5);
        const direction = this.facingRight ? 1 : -1;
        this.setVelocityX(direction * PLAYER_ROLL_SPEED);
        this.setVelocityY(0);

        this.scene.time.delayedCall(PLAYER_ROLL_DURATION, () => {
            if (!this._alive) return;
            this.isRolling = false;
            this.setAlpha(1);
            this.setVelocityX(0);
        });
    }

    attack() {
        if (this.isAttacking || !this.scene) return;
        this.isAttacking = true;

        try {
            const offsetX = this.facingRight ? ATTACK_RANGE : -ATTACK_RANGE - 16;

            if (!this.attackBox) {
                this.attackBox = this.scene.add.rectangle(
                    this.x + offsetX, this.y,
                    32, 32, COLORS.playerHit, 0.6
                );
                this.scene.physics.add.existing(this.attackBox, false);
                this.attackBox.body.setAllowGravity(false);
                this.attackBox.setDepth(10);
            } else {
                this.attackBox.setActive(true).setVisible(true);
                this.attackBox.setPosition(this.x + offsetX, this.y);
            }

            const enemies = this.scene.enemies;
            if (enemies && enemies.getChildren) {
                const children = enemies.getChildren().slice();
                for (const enemy of children) {
                    if (!enemy || !enemy.active) continue;
                    const dist = Phaser.Math.Distance.Between(
                        this.attackBox.x, this.attackBox.y,
                        enemy.x, enemy.y
                    );
                    if (dist < ATTACK_RANGE + 16 && typeof enemy.takeDamage === 'function') {
                        enemy.takeDamage(ATTACK_DAMAGE);
                    }
                }
            }

            if (this.attackTimer) this.attackTimer.remove();
            this.attackTimer = this.scene.time.delayedCall(ATTACK_DURATION, () => {
                if (!this._alive) return;
                if (this.attackBox) {
                    this.attackBox.setActive(false).setVisible(false);
                }
                this.isAttacking = false;
            });
        } catch (e) {
```

超级牛-壹号: 06-28 01:46:46
```javascript
           console.warn('攻击出错:', e);
            this.isAttacking = false;
            if (this.attackBox) {
                this.attackBox.setActive(false).setVisible(false);
            }
        }
    }

    takeDamage(amount) {
        if (this.invincible || this.isRolling || !this._alive) return;
        this.health -= amount;
        this.invincible = true;

        this.scene.tweens.add({
            targets: this,
            alpha: { from: 0.3, to: 1 },
            duration: 100,
            repeat: 5,
            onComplete: () => {
                if (!this._alive) return;
                this.invincible = false;
                this.setAlpha(1);
            }
        });

        const knockDir = this.facingRight ? -1 : 1;
        this.setVelocityX(knockDir * 200);
        this.setVelocityY(-150);

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this._alive = false;
        this.isAttacking = false;
        this.isRolling = false;
        if (this.attackTimer) this.attackTimer.remove();
        if (this.attackBox) {
            this.attackBox.destroy();
            this.attackBox = null;
        }
        this.scene.scene.restart();
    }
}
