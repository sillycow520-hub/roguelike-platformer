import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, COLORS, ROOM_WIDTH, ROOM_HEIGHT, MAX_ROOMS } from '../constants.js';
import Player from '../entities/Player.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // 背景
        this.cameras.main.setBackgroundColor(COLORS.bg);

        // 世界边界（大一点，方便地图扩展）
        this.physics.world.setBounds(0, 0, GAME_WIDTH * 3, GAME_HEIGHT * 2);

        // 创建地面 & 平台
        this.platforms = this.physics.add.staticGroup();
        this.walls = this.physics.add.staticGroup();
        this.generateLevel();

        // 玩家
        this.player = new Player(this, 80, GAME_HEIGHT - 100);

        // 敌人
        this.enemies = this.physics.add.group();
        this.spawnEnemies();

        // 金币
        this.coins = this.physics.add.group();
        this.spawnCoins();

        // 出口
        this.doors = this.physics.add.staticGroup();
        this.spawnDoor();

        // 碰撞
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.coins, this.platforms);

        // 敌人碰撞玩家
        this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);

        // 金币碰撞玩家
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);

        // 出口碰撞玩家
        this.physics.add.overlap(this.player, this.doors, this.nextRoom, null, this);

        // 相机跟随
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
        this.cameras.main.setBounds(0, 0, GAME_WIDTH * 3, GAME_HEIGHT * 2);

        // HUD（固定相机）
        this.createHUD();

        // 当前房间
        this.currentRoom = 1;
    }

    generateLevel() {
        // 简单生成：三个区域的平台布局
        const worldWidth = GAME_WIDTH * 3;

        // 地面（每段之间留间隙创造"房间"感）
        for (let section = 0; section < 3; section++) {
            const offsetX = section * GAME_WIDTH;

            // 地面
            for (let x = 0; x < GAME_WIDTH / TILE_SIZE; x++) {
                this.platforms.create(
                    offsetX + x * TILE_SIZE + TILE_SIZE / 2,
                    GAME_HEIGHT - TILE_SIZE / 2,
                    'ground'
                );
                // 地下层
                for (let y = 1; y < 3; y++) {
                    this.platforms.create(
                        offsetX + x * TILE_SIZE + TILE_SIZE / 2,
                        GAME_HEIGHT + y * TILE_SIZE - TILE_SIZE / 2,
                        'ground'
                    );
                }
            }

            // 平台（每个房间不同布局）
            const roomSeed = section;
            this.generatePlatforms(offsetX, roomSeed);

            // 墙壁
            if (section > 0) {
                for (let y = 0; y < GAME_HEIGHT / TILE_SIZE; y++) {
                    this.walls.create(
                        offsetX - TILE_SIZE / 2,
                        y * TILE_SIZE + TILE_SIZE / 2,
                        'ground'
                    );
                }
            }
        }
    }

    generatePlatforms(offsetX, seed) {
        const layouts = [
            // 房间 1: 三层平台
            () => {
                for (let i = 0; i < 4; i++) {
                    this.addPlatform(offsetX + 100 + i * 120, GAME_HEIGHT - 120, 3);
                }
                this.addPlatform(offsetX + 300, GAME_HEIGHT - 200, 2);
                this.addPlatform(offsetX + 500, GAME_HEIGHT - 280, 3);
            },
            // 房间 2: 阶梯
            () => {
                for (let i = 0; i < 5; i++) {
                    this.addPlatform(offsetX + 80 + i * 130, GAME_HEIGHT - 100 - i * 40, 2);
                }
            },
            // 房间 3: 高低错落
            () => {
                this.addPlatform(offsetX + 150, GAME_HEIGHT - 160, 4);
                this.addPlatform(offsetX + 400, GAME_HEIGHT - 250, 3);
                this.addPlatform(offsetX + 600, GAME_HEIGHT - 120, 2);
            },
        ];

        layouts[seed % layouts.length]();
    }

    addPlatform(x, y, tileCount) {
        for (let i = 0; i < tileCount; i++) {
            this.platforms.create(x + i * TILE_SIZE, y, 'platform');
        }
    }

    spawnEnemies() {
        const enemiesConfig = [
            { x: 300, y: GAME_HEIGHT - 70 },
            { x: GAME_WIDTH + 200, y: GAME_HEIGHT - 70 },
            { x: GAME_WIDTH + 450, y: GAME_HEIGHT - 150 },
            { x: GAME_WIDTH * 2 + 150, y: GAME_HEIGHT - 70 },
            { x: GAME_WIDTH * 2 + 400, y: GAME_HEIGHT - 200 },
        ];

        enemiesConfig.forEach(cfg => {
            const enemy = this.enemies.create(cfg.x, cfg.y, 'enemy');
            enemy.setBounce(0);
            enemy.setCollideWorldBounds(true);
            enemy.health = 2;
            enemy.speed = 50 + Math.random() * 40;
            enemy.direction = Math.random() > 0.5 ? 1 : -1;
            enemy.takeDamage = (amount) => {
                enemy.health -= amount;
                enemy.setTint(0xffffff);
                this.time.delayedCall(80, () => {
                    if (enemy.active) enemy.clearTint();
                });
                if (enemy.health <= 0) {
                    this.spawnParticles(enemy.x, enemy.y, 0xe74c3c);
                    enemy.destroy();
                }
            };
        });
    }

    spawnCoins() {
        const coinPositions = [
            ...Array.from({ length: 8 }, (_, i) => ({
                x: 200 + i * 100, y: GAME_HEIGHT - 140
            })),
            ...Array.from({ length: 6 }, (_, i) => ({
                x: GAME_WIDTH + 150 + i * 100, y: GAME_HEIGHT - 160
            })),
            ...Array.from({ length: 6 }, (_, i) => ({
                x: GAME_WIDTH * 2 + 150 + i * 100, y: GAME_HEIGHT - 140
            })),
        ];

        coinPositions.forEach(cfg => {
            const coin = this.coins.create(cfg.x, cfg.y, 'coin');
            // 浮动动画
            this.tweens.add({
                targets: coin,
                y: coin.y - 8,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        });
    }

    spawnDoor() {
        // 每个区域末尾放一个门
        for (let section = 0; section < 2; section++) {
            const door = this.doors.create(
                (section + 1) * GAME_WIDTH - 60,
                GAME_HEIGHT - 60,
                'door'
            );
            door.setData('targetRoom', section + 2);
        }
    }

    spawnParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const p = this.add.rectangle(x, y, 6, 6, color);
            this.tweens.add({
                targets: p,
                x: x + Phaser.Math.Between(-40, 40),
                y: y + Phaser.Math.Between(-40, 40),
                alpha: 0,
                scale: 0,
                duration: 400,
                onComplete: () => p.destroy(),
            });
        }
    }

    createHUD() {
        const hud = this.add.container(0, 0).setScrollFactor(0).setDepth(100);

        // 血量条背景
        const hpBg = this.add.rectangle(60, 30, 120, 20, 0x222222, 0.8).setOrigin(0.5);
        this.hpBar = this.add.rectangle(60, 30, 116, 16, 0xe74c3c).setOrigin(0.5);

        // HP 文字
        this.hpText = this.add.text(60, 55, '❤️ ' + this.player.health + '/' + this.player.maxHealth, {
            fontSize: '14px',
            color: '#ecf0f1',
            fontFamily: 'monospace',
        }).setOrigin(0.5);

        // 房间指示
        this.roomText = this.add.text(GAME_WIDTH - 80, 30, '🏠 Room 1', {
            fontSize: '16px',
            color: '#ecf0f1',
            fontFamily: 'monospace',
        }).setOrigin(0.5);

        // 操作提示
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, '← → 移动 | ↑/Space 跳跃 | J 攻击 | K/Shift 翻滚', {
            fontSize: '11px',
            color: '#7f8c8d',
            fontFamily: 'monospace',
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

        hud.add([hpBg, this.hpBar, this.hpText, this.roomText]);
    }

    updateHUD() {
        const hpPercent = this.player.health / this.player.maxHealth;
        this.hpBar.setScale(hpPercent, 1);
        this.hpText.setText('❤️ ' + this.player.health + '/' + this.player.maxHealth);
        this.roomText.setText('🏠 Room ' + this.currentRoom);
    }

    hitEnemy(player, enemy) {
        player.takeDamage(1);
    }

    collectCoin(player, coin) {
        this.spawnParticles(coin.x, coin.y, 0xf1c40f);
        coin.destroy();
    }

    nextRoom(player, door) {
        const targetX = door.getData('targetRoom') * GAME_WIDTH - GAME_WIDTH + 80;
        player.setPosition(targetX, GAME_HEIGHT - 100);
        player.setVelocity(0, 0);
        this.currentRoom = door.getData('targetRoom');
    }

    update(time, delta) {
        if (this.player?.active) {
            this.player.update(time, delta);
        }

        // 敌人巡逻
        this.enemies?.getChildren().forEach(enemy => {
            if (!enemy.active) return;
            // 边界反弹
            if (enemy.x < enemy.getData('minX') || enemy.x > enemy.getData('maxX')) {
                enemy.direction *= -1;
                enemy.setFlipX(enemy.direction < 0);
            }
            enemy.setVelocityX(enemy.speed * enemy.direction);
        });

        this.updateHUD();
    }
}
