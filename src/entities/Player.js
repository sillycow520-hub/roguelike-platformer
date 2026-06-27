import { PLAYER_SPEED, PLAYER_JUMP, PLAYER_ROLL_SPEED, PLAYER_ROLL_DURATION, ATTACK_DURATION, ATTACK_RANGE, COLORS } from '../constants.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 物理属性
        this.body.setSize(24, 32);
        this.setCollideWorldBounds(true);

        // 状态
        this.isRolling = false;
        this.isAttacking = false;
        this.facingRight = true;
        this.health = 5;
        this.maxHealth = 5;
        this.invincible = false;

        // 输入
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keys = scene.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            j: Phaser.Input.Keyboard.KeyCodes.J,   // 攻击
            k: Phaser.Input.Keyboard.KeyCodes.K,    // 翻滚
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
        });

        this.attackBox = null;
    }

    update(time, delta) {
        if (this.isRolling) return;

        const onGround = this.body.blocked.down || this.body.touching.down;

        // ---- 左右移动 ----
        const moveLeft = this.cursors.left.isDown || this.keys.a.isDown;
        const moveRight = this.cursors.right.isDown || this.keys.d.isDown;

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

        // ---- 跳跃 ----
        const jumpPressed = this.cursors.up.isDown || this.keys.w.isDown || this.keys.space.isDown;
        if (jumpPressed && onGround) {
            this.setVelocityY(PLAYER_JUMP);
        }

        // ---- 翻滚 ----
        if (Phaser.Input.Keyboard.JustDown(this.keys.k) || Phaser.Input.Keyboard.JustDown(this.keys.shift)) {
            this.roll();
        }

        // ---- 攻击 ----
        if (Phaser.Input.Keyboard.JustDown(this.keys.j)) {
            this.attack();
        }

        // 更新攻击框位置
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
            this.isRolling = false;
            this.setAlpha(1);
            this.setVelocityX(0);
        });
    }

    attack() {
        if (this.isAttacking) return;
        this.isAttacking = true;

        // 显示攻击框
        const offsetX = this.facingRight ? ATTACK_RANGE : -ATTACK_RANGE - 16;
        if (!this.attackBox) {
            this.attackBox = this.scene.add.rectangle(
                this.x + offsetX, this.y,
                32, 32, COLORS.playerHit, 0.6
            );
            this.scene.physics.add.existing(this.attackBox, false);
            this.attackBox.body.setAllowGravity(false);
        } else {
            this.attackBox.setActive(true).setVisible(true);
            this.attackBox.setPosition(this.x + offsetX, this.y);
        }

        // 检测攻击范围内的敌人
        this.scene.enemies?.getChildren().forEach(enemy => {
            if (!enemy.active) return;
            const dist = Phaser.Math.Distance.Between(
                this.attackBox.x, this.attackBox.y,
                enemy.x, enemy.y
            );
            if (dist < ATTACK_RANGE + 16) {
                enemy.takeDamage(ATTACK_DAMAGE);
            }
        });

        // 攻击动画结束后隐藏攻击框
        this.scene.time.delayedCall(ATTACK_DURATION, () => {
            if (this.attackBox) {
                this.attackBox.setActive(false).setVisible(false);
            }
            this.isAttacking = false;
        });
    }

    takeDamage(amount) {
        if (this.invincible || this.isRolling) return;
        this.health -= amount;
        this.invincible = true;

        // 闪红动画
        this.scene.tweens.add({
            targets: this,
            alpha: { from: 0.3, to: 1 },
            duration: 100,
            repeat: 5,
            onComplete: () => {
                this.invincible = false;
                this.setAlpha(1);
            }
        });

        // 击退
        const knockDir = this.facingRight ? -1 : 1;
        this.setVelocityX(knockDir * 200);
        this.setVelocityY(-150);

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.scene.scene.restart();
    }
}
