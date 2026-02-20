import Phaser, { Scene } from 'phaser';

export class Dialogue extends Scene {
    constructor() {
        super("Dialogue");
    }

    init(data) {
        this.npcName = data?.npc ?? 'unknown';
        this.npcSourceIndex = data?.npcSourceIndex ?? '-1';
        this.playerSourceIndex = data?.playerSourceIndex ?? '-1';
        this.interactKey = this.input.keyboard.addKey('E');
    }

    preload() {

    }

    create() {
        const w = this.scale.width, h = this.scale.height;
            this.dim = this.add.rectangle(0, 0, w, h, 0x000000, 0.5)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(0);


        const panelX = 64;
        const panelY = h - 220;
        const panelWidth = w - panelX * 2;
        const panelHeight = 60;
        const panelRadius = 12;
        const arrowCenterY = panelY + panelHeight / 2;
        const arrowLeft = panelX + 18;
        const arrowRight = panelX + 48;
        const arrowHalfHeight = 20;
        const arrowTriangle = new Phaser.Geom.Triangle(
            arrowRight,
            arrowCenterY,
            arrowLeft,
            arrowCenterY - arrowHalfHeight,
            arrowLeft,
            arrowCenterY + arrowHalfHeight
        );

        const pauseX = panelX + 18;
        const pauseY = arrowCenterY - 19;
        const barWidth = 8;
        const barHeight = 38;
        const barGap = 10;
        const pauseHitArea = new Phaser.Geom.Rectangle(
            pauseX - 4,
            pauseY - 4,
            barWidth * 2 + barGap + 8,
            barHeight + 8
        );

        this.dialoguePanel = this.add.graphics()
            .setScrollFactor(0)
            .setDepth(1);
        this.dialoguePanel.fillStyle(0x1a1a1a, 0.9);
        this.dialoguePanel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, panelRadius);
        this.dialoguePanel.lineStyle(2, 0xffffff, 0.6);
        this.dialoguePanel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, panelRadius);
        
        const playTextX = arrowTriangle.x1 + 10;
        const playTextY = panelY + panelHeight / 2;
        const playText = this.add.text(playTextX, playTextY, 'Play Conversation', {fontFamily: 'Arial', fontSize: '30px'})
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(1);

        this.playButton = this.add.graphics()
            .setScrollFactor(0)
            .setDepth(2);
        this.playButton.fillStyle(0x64ca49 , 1);
        this.playButton.fillTriangle(
            arrowTriangle.x1,
            arrowTriangle.y1,
            arrowTriangle.x2,
            arrowTriangle.y2,
            arrowTriangle.x3,
            arrowTriangle.y3
        );

        this.playButton.setInteractive(arrowTriangle, Phaser.Geom.Triangle.Contains);
        this.playButton.on('pointerover', () => this.input.setDefaultCursor('pointer'));
        this.playButton.on('pointerout', () => this.input.setDefaultCursor('default'));
        this.playButton.on('pointerdown', () => {
            console.log('Play Audio');
            this.playButton.setVisible(false).setAlpha(0).disableInteractive();
            this.pauseButton.setVisible(true).setAlpha(1).setInteractive(pauseHitArea, Phaser.Geom.Rectangle.Contains);
        
            playText.setText("Stop Conversation");
        });

        this.pauseButton = this.add.graphics()
            .setScrollFactor(0)
            .setDepth(2);
        this.pauseButton.fillStyle(0xf2c14e, 1);

        this.pauseButton.fillRect(pauseX, pauseY, barWidth, barHeight);

        this.pauseButton.fillRect(pauseX + barWidth + barGap, pauseY, barWidth, barHeight);

        this.pauseButton.setInteractive(pauseHitArea, Phaser.Geom.Rectangle.Contains);
        this.pauseButton.on('pointerover', () => this.input.setDefaultCursor('pointer'));
        this.pauseButton.on('pointerout', () => this.input.setDefaultCursor('default'));
        this.pauseButton.on('pointerdown', () => {
            console.log('Pause Audio');
            this.pauseButton.setVisible(false).setAlpha(0).disableInteractive();
            this.playButton.setVisible(true).setAlpha(1).setInteractive(arrowTriangle, Phaser.Geom.Triangle.Contains);

            playText.setText("Play Conversation");
        });

        this.pauseButton.off();
        this.pauseButton.setAlpha(0);
    

        this.npcFace = this.add.sprite(112, 180, "characters_face", this.npcSourceIndex);
        this.npcFace.setScale(2);
        this.playerFace = this.add.sprite(336, 180, "characters_face", this.playerSourceIndex);
        this.playerFace.setScale(2);

    }

    close() {
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            // Stop this overlay and resume the Game scene
            const mainMenu = this.scene.get('MainMenu')
            mainMenu.cameras.main.setAlpha(1);
            this.scene.stop('Dialogue');
            mainMenu.scene.resume();
        }
    }

    update() {
        this.close();
    }
}