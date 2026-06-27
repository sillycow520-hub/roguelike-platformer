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
        this.keys = scene.input.keyboard.addKeys({
            w: 'W', a: 'A', s: 'S', d: 'D',
            space: 'SPACE', j: 'J', k: 'K', shift: 'SHIFT',
        });
        this._jPrev = false;
        this._kPrev = false;
        this._shiftPrev = false;
        this._attackTimer = null;
    }

    update(time, delta) {
        if (!this._alive || !this.scene) return;
        if (this.isRolling) return;
        const onGround = this.body.blocked.down || this.body.touching.down;
        const left = this.cursors.left.isDown || this.keys.a.isDown;
        const right = this.cursors.right.isDown || this.keys.d.isDown;
        if (left) {
            this.setVelocityX(-PLAYER_SPEED);
            this.facingRight = false;
            this.setFlipX(true);
        } else if (right) {
            this.setVelocityX(PLAYER_SPEED);
            this.facingRight = true;
            this.setFlipX(false);
        } else {
            this.setVelocityX(0);
        }
        const jump = this.cursors.up.isDown || this.keys.w.isDown || this.keys.space.isDown;
        if (jump && onGround) this.setVelocityY(PLAYER_JUMP);

        const rollNow = this.keys.k.isDown || this.keys.shift.isDown;
        if (rollNow && !(this._kPrev || this._shiftPrev)) this.roll();
        this._kPrev = this.keys.k.isDown;
        this._shiftPrev = this.keys.shift.isDown;

        const atk = this.keys.j.isDown;
        if (atk && !this._jPrev) this.attack();
        this._jPrev = atk;
    }

    roll() {
        this.isRolling = true;
        this.setAlpha(0.5);
        const dir = this.facingRight ? 1 : -1;
        this.setVelocityX(dir * PLAYER_ROLL_SPEED);
        this.setVelocityY(0);
        this.scene.time.delayedCall(PLAYER_ROLL_DURATION, () => {
            if (!this._alive) return;
            this.isRolling = false;
            this.setAlpha(1);
            this.setVelocityX(0);
        });
    }

    attack() {
        if (this.isAttacking || !this._alive || !this.scene) return;
        this.isAttacking = true;
        this.setTint(0xffffff);
        if (this._attackTimer) this._attackTimer.remove();
        this._attackTimer = this.scene.time.delayedCall(ATTACK_DURATION, () => {
            if (!this._alive) return;
            this.clearTint();
            this.isAttacking = false;
            this._attackTimer = null;
        });
        const enemies = this.scene.enemies;
        if (!enemies || !enemies.getChildren) return;
        const list = enemies.getChildren().slice();
        for (const enemy of list) {
            if (!enemy || !enemy.active) continue;
            const dx = Math.abs(this.x - enemy.x);
            const dy = Math.abs(this.y - enemy.y);
            const ahead = this.facingRight ? enemy.x > this.x : enemy.x < this.x;
            if (ahead && dx < 65 && dy < 50) {
                if (typeof enemy.takeDamage === 'function') enemy.takeDamage(1);
            }
        }
    }

    takeDamage(amount) {
        if (this.invincible || this.isRolling || !this._alive) return;
        this.health = Math.max(0, this.health - amount);
        this.invincible = true;
        this.setTint(0xe74c3c);
        this.scene.time.delayedCall(600, () => {
            if (!this._alive) return;
            this.invincible = false;
            this.clearTint();
        });
        const dir = this.facingRight ? -1 : 1;
        this.setVelocityX(dir * 250);
        this.setVelocityY(-200);
        if (this.health <= 0) this.die();
    }

    die() {
        this._alive = false;
        this.isAttacking = false;
        this.isRolling = false;
        if (this._attackTimer) { this._attackTimer.remove(); this._attackTimer = null; }
        this.scene.scene.restart();
    }
}
