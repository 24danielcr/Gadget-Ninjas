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
        this.npcSourceIndexes = Array.isArray(data?.npcSourceIndexes) ? data.npcSourceIndexes : 0;
        this.mission = data?.mission ?? '-1';
        this.playerSourceIndex = data?.playerSourceIndex ?? '0';
        this.isMissionGiver = data?.isMissionGiver ?? false;
        this.missionKey = data?.missionKey ?? null;
        this.quizPhase = data?.quizPhase ?? null;

        this.interactKey = this.input.keyboard.addKey('E');
    }

    preload() {

    }


    playConversation() {
        if (this.quizPhase) {
            this.playQuiz();
        } else {
            this.playDialogue();
        }
    }

    playDialogue() {
        const lines = this.mission["dialogue"];

        const showLine = () => {
            if (this.currentLineIndex >= lines.length) {
                this.currentLineIndex = 0;
                this.pauseButton.setVisible(false).setAlpha(0).disableInteractive();
                this.playButton.setVisible(true).setAlpha(1).setInteractive(this.arrowTriangle, Phaser.Geom.Triangle.Contains);
                this.playText.setText('Play Conversation');

                if (this.isMissionGiver) {
                    this.pendingEvent = 'mission-accepted';
                    console.log('Mission Accepted! (pending close)');
                } else {
                    this.pendingEvent = 'mission-npc-talked';
                    console.log('Mission NPC Talked! (pending close)');
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

            this.conversationTimer = this.time.delayedCall(500, showLine);
        };

        showLine();
    }

    playQuiz() {
        const questions = this.mission['questions'];

        this.playButton.setVisible(false).setAlpha(0).disableInteractive();
        this.pauseButton.setVisible(false).setAlpha(0).disableInteractive();
        this.playText.setVisible(false);

        const showQuestion = () => {
            if (this.currentLineIndex >= questions.length) {
                this.currentLineIndex = 0;
                this.clearQuizUI();

                const w = this.scale.width, h = this.scale.height;
                this.playText
                    .setVisible(true)
                    .setText('Quiz Complete! Press E to close.')
                    .setPosition(w / 2, h - 220 + 30)
                    .setFontSize('16px')
                    .setOrigin(0.5, 0.5);

                if (this.missionKey) {
                    EventBus.emit('mission-complete', this.missionKey);
                    console.log('Mission Completed!');
                }
                return;
            }

            const question = questions[this.currentLineIndex];
            const options = [question["correct"], ...question["incorrect"]];
            Phaser.Utils.Array.Shuffle(options);

            this.showQuizQuestion(question["text"], options, question["correct"], () => {
                this.currentLineIndex++;
                showQuestion();
            });
        };

        showQuestion();
    }

    showQuizQuestion(questionText, options, correctAnswer, onCorrect) {
        this.clearQuizUI();
        this.quizElements = [];

        const w = this.scale.width, h = this.scale.height;
        const padX = 20;
        const panelX = padX;
        const panelY = h - 220;
        const panelW = w - padX * 2;
        const qHeight = 50;
        const colGap = 8;
        const rowGap = 4;
        const btnW = (panelW - colGap) / 2;
        const btnH = 40;
        const btnStartY = panelY + qHeight + 4;

        // Question box
        const qBg = this.add.graphics().setScrollFactor(0).setDepth(1);
        qBg.fillStyle(0x1a1a1a, 0.95);
        qBg.fillRoundedRect(panelX, panelY, panelW, qHeight, 10);
        qBg.lineStyle(2, 0xffffff, 0.6);
        qBg.strokeRoundedRect(panelX, panelY, panelW, qHeight, 10);
        this.quizElements.push(qBg);

        const qText = this.add.text(panelX + 8, panelY + qHeight / 2, questionText, {
            fontFamily: 'Arial', fontSize: '12px', color: '#ffffff',
            wordWrap: { width: panelW - 16 }
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(2);
        this.quizElements.push(qText);


        const feedback = this.add.text(w / 2, panelY - 14, '', {
            fontFamily: 'Arial', fontSize: '13px'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(3);
        this.quizElements.push(feedback);


        options.forEach((option, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const bx = panelX + col * (btnW + colGap);
            const by = btnStartY + row * (btnH + rowGap);

            const btnBg = this.add.graphics().setScrollFactor(0).setDepth(2);
            const drawBtn = (fill, stroke, strokeAlpha = 1) => {
                btnBg.clear();
                btnBg.fillStyle(fill, 1);
                btnBg.fillRoundedRect(bx, by, btnW, btnH, 8);
                btnBg.lineStyle(2, stroke, strokeAlpha);
                btnBg.strokeRoundedRect(bx, by, btnW, btnH, 8);
            };
            drawBtn(0x2a2a4a, 0x8888cc, 0.8);
            this.quizElements.push(btnBg);

            btnBg.setInteractive(new Phaser.Geom.Rectangle(bx, by, btnW, btnH), Phaser.Geom.Rectangle.Contains);

            const btnText = this.add.text(bx + btnW / 2, by + btnH / 2, option, {
                fontFamily: 'Arial', fontSize: '11px', color: '#ffffff',
                wordWrap: { width: btnW - 12 }, align: 'center'
            }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(3);
            this.quizElements.push(btnText);

            btnBg.on('pointerover', () => {
                this.input.setDefaultCursor('pointer');
                drawBtn(0x3a3a6a, 0xaaaaee);
            });
            btnBg.on('pointerout', () => {
                this.input.setDefaultCursor('default');
                drawBtn(0x2a2a4a, 0x8888cc, 0.8);
            });
            btnBg.on('pointerdown', () => {
                if (option === correctAnswer) {
                    drawBtn(0x22aa44, 0x44ff88);
                    feedback.setText('Correct!').setColor('#44ff88');
                    this.quizElements.forEach(el => el.disableInteractive && el.disableInteractive());
                    this.input.setDefaultCursor('default');
                    this.time.delayedCall(600, onCorrect);
                } else {
                    drawBtn(0xaa2222, 0xff4444);
                    feedback.setText('Incorrect! Try again.').setColor('#ff4444');
                    this.time.delayedCall(500, () => {
                        drawBtn(0x2a2a4a, 0x8888cc, 0.8);
                        feedback.setText('');
                    });
                }
            });
        });
    }

    clearQuizUI() {
        if (this.quizElements) {
            this.quizElements.forEach(el => el.destroy());
            this.quizElements = [];
        }
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
        this.pendingEvent = null;
        this.quizElements = [];

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
    
        let npcFaceX = 112;
        for (const npcSourceIndex of this.npcSourceIndexes) {
            this.add.sprite(npcFaceX, 180, "characters_face", npcSourceIndex).setScale(2);
            npcFaceX += 95;
        }

        // this.npcFace = this.add.sprite(112, 180, "characters_face", this.npcSourceIndex);
        // this.npcFace.setScale(2);
        this.playerFace = this.add.sprite(336, 180, "characters_face", this.playerSourceIndex);
        this.playerFace.setScale(2);

    }

    close() {
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            if (this.pendingEvent) {
                EventBus.emit(this.pendingEvent);
                this.pendingEvent = null;
            }
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