import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create ()
    {
        const w = this.scale.width;
        const h = this.scale.height;

        this.add.rectangle(0, 0, w, h, 0x0a0a1a, 1).setOrigin(0);

        for (let i = 0; i < 60; i++) {
            const sx = Phaser.Math.Between(0, w);
            const sy = Phaser.Math.Between(0, h);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            this.add.circle(sx, sy, size, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.9));
        }

        const panelW = w - 60;
        const panelH = h - 80;
        const panelX = 30;
        const panelY = 40;
        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a3a, 0.95);
        panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
        panel.lineStyle(3, 0xf5c518, 1);
        panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);

        this.add.text(w / 2, panelY + 28, 'MISSION COMPLETE', {
            fontFamily: 'Arial Black',
            fontSize: '18px',
            color: '#f5c518',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5, 0.5);

        const divG = this.add.graphics();
        divG.lineStyle(1, 0xf5c518, 0.5);
        divG.lineBetween(panelX + 20, panelY + 48, panelX + panelW - 20, panelY + 48);

        const playerFace = this.add.sprite(w / 2, panelY + 100, 'characters_face', 0);
        playerFace.setScale(2.5);

        this.tweens.add({
            targets: playerFace,
            scaleX: 2.7,
            scaleY: 2.7,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.add.text(w / 2, panelY + 168, 'Congratulations, Gadget Ninja!', {
            fontFamily: 'Arial Black',
            fontSize: '11px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5, 0.5);

        this.add.text(w / 2, panelY + 194, "You've helped Bob's crew learn\nabout all their gadgets!", {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#ccccff',
            align: 'center',
            lineSpacing: 4
        }).setOrigin(0.5, 0.5);

        const statY = panelY + 240;
        const missions = this.cache.json.get('missions_order')?.missions_order?.world_one ?? [];
        this.add.text(w / 2, statY, `Missions completed: ${missions.length} / ${missions.length}`, {
            fontFamily: 'Arial',
            fontSize: '11px',
            color: '#f5c518',
            align: 'center'
        }).setOrigin(0.5, 0.5);

        const btnW = 140;
        const btnH = 32;
        const btnX = w / 2 - btnW / 2;
        const btnY = panelY + panelH - 56;

        const btnBg = this.add.graphics();
        const drawBtn = (fill) => {
            btnBg.clear();
            btnBg.fillStyle(fill, 1);
            btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 10);
            btnBg.lineStyle(2, 0xf5c518, 1);
            btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 10);
        };
        drawBtn(0x2a2a6a);

        const btnHitArea = new Phaser.Geom.Rectangle(btnX, btnY, btnW, btnH);
        btnBg.setInteractive(btnHitArea, Phaser.Geom.Rectangle.Contains);
        btnBg.on('pointerover', () => {
            this.input.setDefaultCursor('pointer');
            drawBtn(0x44448a);
        });
        btnBg.on('pointerout', () => {
            this.input.setDefaultCursor('default');
            drawBtn(0x2a2a6a);
        });
        btnBg.on('pointerdown', () => {
            this.input.setDefaultCursor('default');
            this.changeScene();
        });

        this.add.text(w / 2, btnY + btnH / 2, 'Play Again', {
            fontFamily: 'Arial Black',
            fontSize: '13px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0.5);

        this.add.text(w / 2, btnY + btnH + 14, 'Press  ENTER  to play again', {
            fontFamily: 'Arial',
            fontSize: '9px',
            color: '#888888',
            align: 'center'
        }).setOrigin(0.5, 0.5);

        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        EventBus.emit('current-scene-ready', this);
    }

    update ()
    {
        if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
            this.changeScene();
        }
    }

    changeScene ()
    {
        this.scene.start('GameScreen');
    }
}
