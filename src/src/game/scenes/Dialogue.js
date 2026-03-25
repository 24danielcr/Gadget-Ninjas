import Phaser, { Scene } from 'phaser';
import { EventBus } from '../EventBus.js';

export class Dialogue extends Scene {
    constructor() {
        super("Dialogue");
    }

    init(data) {
        // this.npcName = data?.npc ?? 'unknown';
        // this.npcSourceIndex = data?.npcSourceIndex ?? '-1';
        this.group = data?.group ?? '-1';
        this.npcSourceIndex = data?.npcSourceIndex ?? '-1';
        this.mission = data?.mission ?? '-1';
        this.playerSourceIndex = data?.playerSourceIndex ?? '0';
        this.isMissionGiver = data?.isMissionGiver ?? false;
        this.missionKey = data?.missionKey ?? null;

        this.interactKey = this.input.keyboard.addKey('E');
    }

    preload() {

    }


    playConversation() {
        const lines = this.mission['dialogue'];

        const showLine = () => {
            if (this.currentLineIndex >= lines.length) {
                this.currentLineIndex = 0;
                this.pauseButton.setVisible(false).setAlpha(0).disableInteractive();
                this.playButton.setVisible(true).setAlpha(1).setInteractive(this.arrowTriangle, Phaser.Geom.Triangle.Contains);
                this.playText.setText('Play Conversation');

                if (this.isMissionGiver) {
                    EventBus.emit('mission-accepted');
                    console.log('Mission Accepted!');
                } else if (this.missionKey) {
                    EventBus.emit('mission-complete', this.missionKey);
                    console.log('Mission Completed!');
                }

                return;
            }

            const line = lines[this.currentLineIndex];

            if (line["speaker"] === "player" && line["choices"]) {
                console.log(`player options:\n${line["choices"].map((c, i) => `  ${i + 1}. ${c}`).join('\n')}`);
            } else {
                console.log(`${line["speaker"]}: ${line["text"]}`);
            }
            this.currentLineIndex++;

            this.conversationTimer = this.time.delayedCall(2000, showLine);
        };

        showLine();
    }

    stopConversation() {
        if (this.conversationTimer) {
            this.conversationTimer.destroy();
            this.conversationTimer = null;
        }
    }

    create() {
        this.currentLineIndex = 0;
        this.conversationTimer = null;

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
        this.arrowTriangle = new Phaser.Geom.Triangle(
            arrowRight, arrowCenterY,
            arrowLeft, arrowCenterY - arrowHalfHeight,
            arrowLeft, arrowCenterY + arrowHalfHeight
        );

        const pauseX = panelX + 18;
        const pauseY = arrowCenterY - 19;
        const barWidth = 8;
        const barHeight = 38;
        const barGap = 10;
        this.pauseHitArea = new Phaser.Geom.Rectangle(
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
        
        const playTextX = this.arrowTriangle.x1 + 10;
        const playTextY = panelY + panelHeight / 2;
        this.playText = this.add.text(playTextX, playTextY, 'Play Conversation', {fontFamily: 'Arial', fontSize: '22px'})
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(1);

        this.playButton = this.add.graphics()
            .setScrollFactor(0)
            .setDepth(2);
        this.playButton.fillStyle(0x64ca49 , 1);
        this.playButton.fillTriangle(
            this.arrowTriangle.x1, this.arrowTriangle.y1,
            this.arrowTriangle.x2, this.arrowTriangle.y2,
            this.arrowTriangle.x3, this.arrowTriangle.y3
        );

        this.playButton.setInteractive(this.arrowTriangle, Phaser.Geom.Triangle.Contains);
        this.playButton.on('pointerover', () => this.input.setDefaultCursor('pointer'));
        this.playButton.on('pointerout', () => this.input.setDefaultCursor('default'));
        this.playButton.on('pointerdown', () => {
            this.playButton.setVisible(false).setAlpha(0).disableInteractive();
            this.pauseButton.setVisible(true).setAlpha(1).setInteractive(this.pauseHitArea, Phaser.Geom.Rectangle.Contains);

            this.playText.setText('Pause Conversation');

            this.playConversation();
        });

        this.pauseButton = this.add.graphics()
            .setScrollFactor(0)
            .setDepth(2);
        this.pauseButton.fillStyle(0xf2c14e, 1);

        this.pauseButton.fillRect(pauseX, pauseY, barWidth, barHeight);

        this.pauseButton.fillRect(pauseX + barWidth + barGap, pauseY, barWidth, barHeight);

        this.pauseButton.setInteractive(this.pauseHitArea, Phaser.Geom.Rectangle.Contains);
        this.pauseButton.on('pointerover', () => this.input.setDefaultCursor('pointer'));
        this.pauseButton.on('pointerout', () => this.input.setDefaultCursor('default'));
        this.pauseButton.on('pointerdown', () => {
            this.pauseButton.setVisible(false).setAlpha(0).disableInteractive();
            this.playButton.setVisible(true).setAlpha(1).setInteractive(this.arrowTriangle, Phaser.Geom.Triangle.Contains);

            this.playText.setText('Resume Conversation');

            this.stopConversation();
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