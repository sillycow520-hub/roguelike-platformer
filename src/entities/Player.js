import { PLAYER_SPEED, PLAYER_JUMP, PLAYER_ROLL_SPEED, PLAYER_ROLL_DURATION, ATTACK_DURATION, ATTACK_RANGE, COLORS } from '../constants.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.body.setSize(24, 32);
        this.setCollideWorldBounds(true);

        // 鐘舵€?        this._alive = true;
        this.isRolling = false;
        this.isAttacking = false;
        this.facingRight = true;
        this.health = 5;
        this.maxHealth = 5;
        this.invincible = false;
        this._rollTimer = null;
        this._attackTimer = null;

        // ---- 鎵嬪姩閿姸鎬佽窡韪紙姣?JustDown 鏇村彲闈狅級 ----
        this._keys = {
            left: false, right: false,
            jump: false,
            attack: false, attackPrev: false,
            roll: false, rollPrev: false,
        };

        // 娉ㄥ唽閿洏浜嬩欢
        this._onKeyDown = (e) => {
            switch (e.code) {
                case 'ArrowLeft': case 'KeyA': this._keys.left = true; break;
                case 'ArrowRight': case 'KeyD': this._keys.right = true; break;
                case 'ArrowUp': case 'KeyW': case 'Space': this._keys.jump = true; break;
                case 'KeyJ': if (!this._keys.attack) { this._keys.attack = true; } break;
                case 'KeyK': case 'ShiftLeft': case 'ShiftRight': if (!this._keys.roll) { this._keys.roll = true; } break;
            }
        };
        this._onKeyUp = (e) => {
            switch (e.code) {
                case 'ArrowLeft': case 'KeyA': this._keys.left = false; break;
                case 'ArrowRight': case 'KeyD': this._keys.right = false; break;
                case 'ArrowUp': case 'KeyW': case 'Space': this._keys.jump = false; break;
                case 'KeyJ': this._keys.attack = false; this._keys.attackPrev = false; break;
                case 'KeyK': case 'ShiftLeft': case 'ShiftRight': this._keys.roll = false; this._keys.rollPrev = false; break;
            }
        };

        scene.input.keyboard.on('keydown', this._onKeyDown);
        scene.input.keyboard.on('keyup', this._onKeyUp);
    }

    destroy() {
        // 娓呯悊閿洏浜嬩欢
        if (this.scene && this.scene.input && this.scene.input.keyboard) {
            this.scene.input.keyboard.off('keydown', this._onKeyDown);
            this.scene.input.keyboard.off('keyup', this._onKeyUp);
        }
        if (this._rollTimer) this._rollTimer.remove();
        if (this._attackTimer) this._attackTimer.remove();
        super.destroy();
    }

    update() {
        if (!this._alive || !this.scene) return;
        if (this.isRolling) return;

        const onGround = this.body.blocked.down || this.body.touching.down;
        const keys = this._keys;

        // ---- 宸﹀彸绉诲姩 ----
        if (keys.left) {
            this.setVelocityX(-PLAYER_SPEED);
            this.facingRight = false;
            this.setFlipX(true);
        } else if (keys.right) {
            this.setVelocityX(PLAYER_SPEED);
            this.facingRight = true;
            this.setFlipX(false);
        } else {
            this.setVelocityX(0);
        }

        // ---- 璺宠穬 ----
        if (keys.jump && onGround) {
            this.setVelocityY(PLAYER_JUMP);
        }

        // ---- 缈绘粴锛堟寜涓嬬灛闂磋Е鍙戯級 ----
        if (keys.roll && !keys.rollPrev) {
            this.roll();
        }
        keys.rollPrev = keys.roll;

        // ---- 鏀诲嚮锛堟寜涓嬬灛闂磋Е鍙戯級 ----
        if (keys.attack && !keys.attackPrev) {
            this.attack();
        }
        keys.attackPrev = keys.attack;
    }

    roll() {
        if (this.isRolling) return;
        this.isRolling = true;
        this.setAlpha(0.5);

        const dir = this.facingRight ? 1 : -1;
        this.setVelocityX(dir * PLAYER_ROLL_SPEED);
        this.setVelocityY(0);

        if (this._rollTimer) this._rollTimer.remove();
        this._rollTimer = this.scene.time.delayedCall(PLAYER_ROLL_DURATION, () => {
            if (!this._alive) return;
            this.isRolling = false;
            this.setAlpha(1);
            this.setVelocityX(0);
            this._rollTimer = null;
        });
    }

    // 鏀诲嚮锛氱函璺濈妫€娴嬶紝涓嶇敤鐗╃悊鏀诲嚮妗嗭紙鏇寸ǔ瀹氾級
    attack() {
        if (this.isAttacking || !this._alive || !this.scene) return;
        this.isAttacking = true;

        try {
            // 妫€娴嬪墠鏂规晫浜猴紙绾窛绂昏绠楋紝鏃犵墿鐞嗗璞★級
            const enemies = this.scene.enemies;
            if (enemies && typeof enemies.getChildren === 'function') {
                const list = enemies.getChildren().slice();
                for (const enemy of list) {
                    if (!enemy || !enemy.active) continue;
                    const dx = Math.abs(this.x - enemy.x);
                    const dy = Math.abs(this.y - enemy.y);
                    // 鍓嶆柟鍒ゅ畾锛氱帺瀹舵湞鍚戠殑 +-45px 鑼冨洿鍐?                    const inRange = (this.facingRight && enemy.x > this.x - 10) ||
                                    (!this.facingRight && enemy.x < this.x + 10);
                    if (inRange && dx < ATTACK_RANGE + 20 && dy < 50) {
                        if (typeof enemy.takeDamage === 'function') {
                            enemy.takeDamage(ATTACK_DAMAGE);
                        }
                    }
                }
            }

            // 鏀诲嚮瑙嗚鏁堟灉锛氱帺瀹惰韩涓婇棯涓€涓?            this.setTint(0xffffff);
            if (this._attackTimer) this._attackTimer.remove();
            this._attackTimer = this.scene.time.delayedCall(ATTACK_DURATION, () => {
                if (!this._alive) return;
                this.clearTint();
                this.isAttacking = false;
                this._attackTimer = null;
            });
        } catch (e) {
            console.warn('Attack error:', e);
            this.isAttacking = false;
            this.clearTint();
            this._attackTimer = null;
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

        // 鍑婚€€
        const dir = this.facingRight ? -1 : 1;
        this.setVelocityX(dir * 250);
        this.setVelocityY(-200);

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this._alive = false;
        this.isAttacking = false;
        this.isRolling = false;
        if (this._rollTimer) { this._rollTimer.remove(); this._rollTimer = null; }
        if (this._attackTimer) { this._attackTimer.remove(); this._attackTimer = null; }
        this.scene.scene.restart();
    }
}
