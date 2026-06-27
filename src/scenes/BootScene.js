import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../constants.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 加载界面
        const w = GAME_WIDTH;
        const h = GAME_HEIGHT;
        const bar = this.add.rectangle(w / 2, h / 2, 0, 20, 0x3498db);
        const bg = this.add.rectangle(w / 2, h / 2, 300, 24, 0x222222);

        this.load.on('progress', (val) => {
            bar.width = 300 * val;
        });

        // 生成玩家纹理（临时用画图代替素材）
        this.createTextures();
    }

    createTextures() {
        // 玩家 - 32x40
        const pg = this.make.graphics({ add: false });
        pg.fillStyle(0x3498db, 1);
        pg.fillRect(4, 0, 24, 32);      // 身体
        pg.fillStyle(0x2980b9, 1);
        pg.fillRect(8, 4, 16, 12);       // 盔甲
        pg.fillStyle(0xf1c40f, 1);
        pg.fillRect(6, 0, 8, 6);         // 头发
        pg.fillRect(18, 0, 8, 6);
        pg.fillStyle(0xffffff, 1);
        pg.fillRect(8, 8, 4, 4);         // 眼睛
        pg.fillRect(20, 8, 4, 4);
        pg.generateTexture('player', 32, 32);
        pg.destroy();

        // 敌人 - 24x28
        const eg = this.make.graphics({ add: false });
        eg.fillStyle(0xe74c3c, 1);
        eg.fillRect(2, 0, 20, 24);       // 身体
        eg.fillStyle(0xc0392b, 1);
        eg.fillRect(4, 4, 16, 10);
        eg.fillStyle(0xffffff, 1);
        eg.fillRect(6, 6, 4, 4);
        eg.fillRect(14, 6, 4, 4);
        eg.generateTexture('enemy', 24, 24);
        eg.destroy();

        // 地面砖块
        const gg = this.make.graphics({ add: false });
        gg.fillStyle(0x2c3e50, 1);
        gg.fillRect(0, 0, 32, 32);
        gg.lineStyle(1, 0x1a252f, 0.5);
        gg.strokeRect(0, 0, 32, 32);
        gg.fillStyle(0x34495e, 1);
        gg.fillRect(2, 2, 28, 4);
        gg.generateTexture('ground', 32, 32);
        gg.destroy();

        // 平台砖块
        const pg2 = this.make.graphics({ add: false });
        pg2.fillStyle(0x7f8c8d, 1);
        pg2.fillRect(0, 0, 32, 16);
        pg2.lineStyle(1, 0x95a5a6, 0.8);
        pg2.strokeRect(0, 0, 32, 16);
        pg2.fillStyle(0x95a5a6, 1);
        pg2.fillRect(2, 2, 28, 4);
        pg2.generateTexture('platform', 32, 16);
        pg2.destroy();

        // 门
        const dg = this.make.graphics({ add: false });
        dg.fillStyle(0x2ecc71, 1);
        dg.fillRect(0, 0, 24, 40);
        dg.fillStyle(0x1abc9c, 1);
        dg.fillRect(4, 4, 16, 16);
        dg.fillRect(8, 22, 8, 14);
        dg.generateTexture('door', 24, 40);
        dg.destroy();

        // 金币
        const cg = this.make.graphics({ add: false });
        cg.fillStyle(0xf1c40f, 1);
        cg.fillCircle(8, 8, 8);
        cg.fillStyle(0xf39c12, 1);
        cg.fillCircle(8, 8, 5);
        cg.generateTexture('coin', 16, 16);
        cg.destroy();

        // 粒子
        const pg3 = this.make.graphics({ add: false });
        pg3.fillStyle(0xffffff, 1);
        pg3.fillCircle(4, 4, 4);
        pg3.generateTexture('particle', 8, 8);
        pg3.destroy();
    }

    create() {
        this.scene.start('GameScene');
    }
}
