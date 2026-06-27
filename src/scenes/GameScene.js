import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, COLORS } from '../constants.js';
import Player from '../entities/Player.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bg);
        this.physics.world.setBounds(0, 0, GAME_WIDTH * 3, GAME_HEIGHT);

        // 鍦伴潰 & 骞冲彴
        this.platforms = this.physics.add.staticGroup();
        this.walls = this.physics.add.staticGroup();
        this.generateLevel();

        // 鐜╁
        this.player = new Player(this, 80, GAME_HEIGHT - 60);

        // 鏁屼汉
        this.enemies = this.physics.add.group();
        this.spawnEnemies();

        // 閲戝竵锛堟櫘閫氱粍锛屾棤鐗╃悊鈥斺€旇В鍐抽噸褰遍棶棰橈級
        this.coins = this.add.group();
        this.spawnCoins();

        // 鍑哄彛
        this.doors = this.physics.add.staticGroup();
        this.spawnDoor();

        // 纰版挒
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.enemies, this.walls);

        // 鏁屼汉鎾炵帺瀹?        this.physics.add.overlap(this.player, this.enemies, (p, e) => {
            if (p.active && e.active) p.takeDamage(1);
        }, null, this);

        // 鍑哄彛
        this.physics.add.overlap(this.player, this.doors, (p, d) => {
            if (!d.active) return;
            const room = d.getData('targetRoom') || 1;
            p.setPosition(room * GAME_WIDTH - GAME_WIDTH + 80, GAME_HEIGHT - 60);
            p.setVelocity(0, 0);
            this.currentRoom = room;
        }, null, this);

        // 鐩告満
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, GAME_WIDTH * 3, GAME_HEIGHT);

        this.currentRoom = 1;
        this.createHUD();

        // 閲戝竵鏀堕泦锛堥€愬抚妫€娴嬶紝鏃犵墿鐞嗙鎾烇級
        this._coinCheck = () => {
            if (!this.player || !this.player._alive) return;
            const px = this.player.x;
            const py = this.player.y;
            this.coins.getChildren().forEach(c => {
                if (!c.active) return;
                const dx = px - c.x;
                const dy = py - c.y;
                if (dx * dx + dy * dy < 900) { // 鍗婂緞30px
                    this.spawnParticles(c.x, c.y, 0xf1c40f);
                    c.destroy();
                }
            });
        };
    }

    // ========== 鍦板浘鐢熸垚 ==========

    generateLevel() {
        for (let section = 0; section < 3; section++) {
            const ox = section * GAME_WIDTH;
            const groundY = GAME_HEIGHT - TILE_SIZE / 2;

            // 鍦伴潰 + 鍦颁笅灞?            for (let x = 0; x < GAME_WIDTH / TILE_SIZE; x++) {
                for (let y = 0; y < 3; y++) {
                    this.platforms.create(ox + x * TILE_SIZE + TILE_SIZE / 2, groundY + y * TILE_SIZE, 'ground');
                }
            }

            this.generatePlatforms(ox, section);

            // 鎴块棿闂村澹?            if (section > 0) {
                for (let y = 0; y < GAME_HEIGHT / TILE_SIZE; y++) {
                    this.walls.create(ox - TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 'ground');
                }
            }
        }
    }

    generatePlatforms(ox, seed) {
        // 鎵€鏈夊钩鍙伴兘璁剧疆鍦ㄨ烦寰楀埌鐨勯珮搴?        const layouts = [
            // 鎴块棿1锛氬钩鍙伴樁姊綆 鈫?楂?            () => {
                this.addPlatform(ox + 120, GAME_HEIGHT - 140, 4);
                this.addPlatform(ox + 350, GAME_HEIGHT - 200, 3);
                this.addPlatform(ox + 550, GAME_HEIGHT - 150, 4);
            },
            // 鎴块棿2锛氶€愮骇涓婂崌
            () => {
                for (let i = 0; i < 4; i++) {
                    this.addPlatform(ox + 100 + i * 160, GAME_HEIGHT - 100 - i * 35, 3);
                }
            },
            // 鎴块棿3锛氬乏鍙冲绉?            () => {
                this.addPlatform(ox + 100, GAME_HEIGHT - 140, 3);
                this.addPlatform(ox + 400, GAME_HEIGHT - 210, 4);
                this.addPlatform(ox + 650, GAME_HEIGHT - 140, 3);
            },
        ];
        layouts[seed % layouts.length]();
    }

    addPlatform(x, y, count) {
        for (let i = 0; i < count; i++) {
            this.platforms.create(x + i * TILE_SIZE, y, 'platform');
        }
    }

    // ========== 鏁屼汉 ==========

    spawnEnemies() {
        const configs = [
            { x: 350, y: GAME_HEIGHT - 50, minX: 250, maxX: 500 },
            { x: GAME_WIDTH + 300, y: GAME_HEIGHT - 50, minX: GAME_WIDTH + 150, maxX: GAME_WIDTH + 500 },
            { x: GAME_WIDTH + 500, y: GAME_HEIGHT - 180, minX: GAME_WIDTH + 400, maxX: GAME_WIDTH + 700 },
            { x: GAME_WIDTH * 2 + 200, y: GAME_HEIGHT - 50, minX: GAME_WIDTH * 2 + 100, maxX: GAME_WIDTH * 2 + 400 },
            { x: GAME_WIDTH * 2 + 500, y: GAME_HEIGHT - 200, minX: GAME_WIDTH * 2 + 400, maxX: GAME_WIDTH * 2 + 700 },
        ];

        configs.forEach(cf => {
            const e = this.enemies.create(cf.x, cf.y, 'enemy');
            e.setBounce(0);
            e.setCollideWorldBounds(true);
            e.health = 2;
            e._speed = 40 + Math.random() * 30;
            e._dir = Math.random() > 0.5 ? 1 : -1;
            e._minX = cf.minX;
            e._maxX = cf.maxX;

            e.takeDamage = (amount) => {
                if (!e.active) return;
                e.health -= amount;
                e.setTint(0xffffff);
                this.time.delayedCall(80, () => {
                    if (e.active) e.clearTint();
                });
                if (e.health <= 0) {
                    this.spawnParticles(e.x, e.y, 0xe74c3c);
                    e.destroy();
                }
            };
        });
    }

    // ========== 閲戝竵 ==========

    spawnCoins() {
        const positions = [];
        // 鎴块棿1
        for (let i = 0; i < 6; i++) positions.push({ x: 180 + i * 100, y: GAME_HEIGHT - 170 });
        // 鎴块棿2
        for (let i = 0; i < 5; i++) positions.push({ x: GAME_WIDTH + 200 + i * 100, y: GAME_HEIGHT - 130 - i * 30 });
        // 鎴块棿3
        for (let i = 0; i < 5; i++) positions.push({ x: GAME_WIDTH * 2 + 200 + i * 100, y: GAME_HEIGHT - 170 });

        positions.forEach(p => {
            const coin = this.add.image(p.x, p.y, 'coin').setDepth(5);
            // 娴姩鍔ㄧ敾
            this.tweens.add({
                targets: coin,
                y: coin.y - 10,
                duration: 1000,
                yoyo: true, repeat: -1,
                ease: 'Sine.easeInOut',
            });
            this.coins.add(coin);
        });
    }

    // ========== 鍑哄彛 ==========

    spawnDoor() {
        for (let s = 0; s < 2; s++) {
            const door = this.doors.create(
                (s + 1) * GAME_WIDTH - 50,
                GAME_HEIGHT - 50,
                'door'
            );
            door.setData('targetRoom', s + 2);
            door.body.setSize(24, 40);
        }
    }

    // ========== 绮掑瓙 ==========

    spawnParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const p = this.add.rectangle(x, y, 6, 6, color);
            this.tweens.add({
                targets: p,
                x: x + Phaser.Math.Between(-50, 50),
                y: y + Phaser.Math.Between(-50, 50),
                alpha: 0, scale: 0,
                duration: 400,
                onComplete: () => p.destroy(),
            });
        }
    }

    // ========== HUD ==========

    createHUD() {
        this.add.rectangle(60, 28, 124, 24, 0x222222, 0.85).setScrollFactor(0).setDepth(100);
        this.hpBar = this.add.rectangle(60, 28, 120, 20, 0xe74c3c).setScrollFactor(0).setDepth(101);
        this.hpBar.setOrigin(0.5);

        this.hpText = this.add.text(60, 48, '鉂わ笍 5/5', {
            fontSize: '13px', color: '#ecf0f1', fontFamily: 'monospace',
        }).setScrollFactor(0).setDepth(101).setOrigin(0.5);

        this.roomText = this.add.text(GAME_WIDTH - 60, 28, 'Room 1', {
            fontSize: '16px', color: '#ecf0f1', fontFamily: 'monospace',
        }).setScrollFactor(0).setDepth(101).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 14, '鈫?鈫?绉诲姩 | 鈫?W/Space 璺宠穬 | J 鏀诲嚮 | K/Shift 缈绘粴', {
            fontSize: '11px', color: '#7f8c8d', fontFamily: 'monospace',
        }).setScrollFactor(0).setDepth(100).setOrigin(0.5);
    }

    // ========== 姣忓抚鏇存柊 ==========

    update() {
        if (this.player?.active) {
            this.player.update();
        }
        if (this._coinCheck) this._coinCheck();

        // 鏁屼汉宸￠€?        const enemies = this.enemies;
        if (enemies) {
            enemies.getChildren().forEach(e => {
                if (!e.active) return;
                if (e.x <= e._minX || e.x >= e._maxX) {
                    e._dir *= -1;
                    e.setFlipX(e._dir < 0);
                }
                e.setVelocityX(e._speed * e._dir);
            });
        }

        this.updateHUD();
    }

    updateHUD() {
        if (!this.player) return;
        const pct = this.player.health / this.player.maxHealth;
        this.hpBar.setScale(Math.max(0, pct), 1);
        this.hpText.setText('鉂わ笍 ' + this.player.health + '/' + this.player.maxHealth);
        this.roomText.setText('Room ' + this.currentRoom);
    }
}
