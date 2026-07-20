import Phaser, { Scene } from 'phaser';
import { EventBus } from '../EventBus.js';
import { pauseMusic, resumeMusic } from '../BackgroundMusic.js';
import { playSfx } from '../SoundEffects.js';
import { registerVoiceline, clearVoiceline } from '../Voicelines.js';

export class Dialogue extends Scene {
    constructor() {
        super("Dialogue");
    }

    init(data) {
        this.group = data?.group ?? '-1';
        this.npcSourceIndexes = Array.isArray(data?.npcSourceIndexes) ? data.npcSourceIndexes : 0;
        this.mission = data?.mission ?? '-1';
        this.playerSourceIndex = data?.playerSourceIndex ?? '0';
        this.isMissionGiver = data?.isMissionGiver ?? false;
        this.missionKey = data?.missionKey ?? null;
        this.quizPhase = data?.quizPhase ?? null;

        this.interactKey = this.input.keyboard.addKey('E');
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
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
        this.dialogueLines = this.mission["dialogue"];
        this.showNextLine();
    }

    showNextLine() {
        const lines = this.dialogueLines;

        if (this.currentLineIndex >= lines.length) {
            this.finishDialogue();
            return;
        }

        const line = lines[this.currentLineIndex];

        this.highlightSpeaker(line["speaker"]);

        // Player decision points are shown as buttons, not spoken.
        if (line["speaker"] === "player" && line["choices"]) {
            this.hideSubtitle();
            this.showChoices(line["choices"], (chosenText) => {
                console.log(`player chose: ${chosenText}`);
                this.currentLineIndex++;
                this.showNextLine();
            });
            return;
        }

        // The player speaking to the NPC is shown in the same dialogue box style,
        // and waits for the player to click before continuing so they can read it.
        if (line["speaker"] === "player") {
            this.hideSubtitle();

            if (line["audio"] && this.cache.audio.exists(line["audio"])) {
                this.currentSound = this.sound.add(line["audio"]);
                registerVoiceline(this.currentSound);
                this.currentSound.play();
            }

            this.showPlayerLine(line["text"] ?? '', () => {
                if (this.currentSound) {
                    clearVoiceline(this.currentSound);
                    this.currentSound.stop();
                    this.currentSound.destroy();
                    this.currentSound = null;
                }
                this.clearPlayerLine(true);
                this.currentLineIndex++;
                this.showNextLine();
            });
            return;
        }

        const advance = () => {
            clearVoiceline(this.currentSound);
            this.currentSound = null;
            this.currentLineIndex++;
            this.conversationTimer = this.time.delayedCall(400, () => this.showNextLine());
        };

        // Lines with a voiceline are heard, not read. Everything else (the
        // player's spoken lines and silent beats) is shown as on-screen text.
        if (line["audio"] && this.cache.audio.exists(line["audio"])) {
            this.hideSubtitle();
            this.currentSound = this.sound.add(line["audio"]);
            registerVoiceline(this.currentSound);
            this.currentSound.once('complete', advance);
            this.currentSound.play();
        } else {
            this.showSubtitle(line["text"]);
            const text = line["text"] ?? '';
            const readMs = Phaser.Math.Clamp(text.length * 70, 1500, 7000);
            this.currentLineIndex++;
            this.conversationTimer = this.time.delayedCall(readMs, () => {
                this.hideSubtitle();
                this.showNextLine();
            });
        }
    }

    finishDialogue() {
        this.currentLineIndex = 0;
        this.isPaused = false;
        this.hideSubtitle();
        this.clearPlayerLine();

        const allSprites = [...(this.npcFaceSprites || [])];
        if (this.playerFace) allSprites.push(this.playerFace);
        allSprites.forEach(sprite => sprite.setAlpha(1));
        this.pauseButton.setVisible(false).setAlpha(0).disableInteractive();
        this.playButton.setVisible(true).setAlpha(1).setInteractive(this.arrowTriangle, Phaser.Geom.Triangle.Contains);
        this.playText.setText('Play Conversation');
        this.closeHint.setText('Press  E  to close').setColor('#64ca49');

        if (this.isMissionGiver) {
            this.pendingEvent = 'mission-accepted';
            console.log('Mission Accepted! (pending close)');
        } else {
            this.pendingEvent = 'mission-npc-talked';
            console.log('Mission NPC Talked! (pending close)');
        }
    }

    showSubtitle(text) {
        if (!text) {
            this.hideSubtitle();
            return;
        }
        this.subtitleText.setText(text).setVisible(true);
        const bounds = this.subtitleText.getBounds();
        const pad = 8;
        this.subtitleBg.clear();
        this.subtitleBg.fillStyle(0x000000, 0.7);
        this.subtitleBg.fillRoundedRect(
            bounds.x - pad, bounds.y - pad,
            bounds.width + pad * 2, bounds.height + pad * 2, 6
        );
        this.subtitleBg.setVisible(true);
    }

    hideSubtitle() {
        if (this.subtitleText) this.subtitleText.setVisible(false);
        if (this.subtitleBg) this.subtitleBg.clear().setVisible(false);
    }

    pauseConversation() {
        this.isPaused = true;
        if (this.currentSound && this.currentSound.isPlaying) {
            this.currentSound.pause();
        }
        if (this.conversationTimer) {
            this.conversationTimer.paused = true;
        }
    }

    resumeConversation() {
        this.isPaused = false;
        if (this.currentSound && this.currentSound.isPaused) {
            this.currentSound.resume();
        }
        if (this.conversationTimer) {
            this.conversationTimer.paused = false;
        }
    }

    showChoices(choices, onChosen) {
        this.clearChoiceUI();
        this.choiceElements = [];

        this.dialoguePanel.setVisible(false);
        this.playButton.setVisible(false).setAlpha(0).disableInteractive();
        this.pauseButton.setVisible(false).setAlpha(0).disableInteractive();
        this.playText.setVisible(false);

        const w = this.scale.width, h = this.scale.height;
        // Match the Play/Pause conversation box: same X, width and top edge.
        const boxX = 64;
        const boxW = w - boxX * 2;
        const colGap = 8;
        const rowGap = 8;
        const btnH = 40;

        // A single option shouldn't be trapped in a 2-column grid — it spans
        // the box; anything more lays out in centered rows of two.
        const single = choices.length === 1;
        const cols = single ? 1 : 2;
        const rows = Math.ceil(choices.length / cols);

        // Dialogue box geometry (top-aligned with the dialogue panel, grows down).
        const innerPadX = 12;
        const padTop = 10;
        const labelH = 22;
        const padBottom = 12;
        const usableW = boxW - innerPadX * 2;
        const btnW = single ? usableW : (usableW - colGap) / 2;
        const boxH = padTop + labelH + rows * btnH + (rows - 1) * rowGap + padBottom;
        const boxY = h - 220;
        const btnStartY = boxY + padTop + labelH;

        // The dialogue box behind the player's choices.
        const boxBg = this.add.graphics().setScrollFactor(0).setDepth(1);
        boxBg.fillStyle(0x1a1a1a, 0.95);
        boxBg.fillRoundedRect(boxX, boxY, boxW, boxH, 12);
        boxBg.lineStyle(2, 0xffffff, 0.6);
        boxBg.strokeRoundedRect(boxX, boxY, boxW, boxH, 12);
        this.choiceElements.push(boxBg);

        const label = this.add.text(w / 2, boxY + padTop + labelH / 2, 'What do you say?', {
            fontFamily: 'Arial', fontSize: '13px', color: '#cccccc', fontStyle: 'italic'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(3);
        this.choiceElements.push(label);

        choices.forEach((choice, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            // Center each row so a lone last button (or a single choice) is centered.
            const itemsInRow = Math.min(cols, choices.length - row * cols);
            const rowW = itemsInRow * btnW + (itemsInRow - 1) * colGap;
            const rowStartX = boxX + innerPadX + (usableW - rowW) / 2;
            const bx = rowStartX + col * (btnW + colGap);
            const by = btnStartY + row * (btnH + rowGap);

            const btnBg = this.add.graphics().setScrollFactor(0).setDepth(2);
            const drawBtn = (fill, stroke, strokeAlpha = 1) => {
                btnBg.clear();
                btnBg.fillStyle(fill, 1);
                btnBg.fillRoundedRect(bx, by, btnW, btnH, 8);
                btnBg.lineStyle(2, stroke, strokeAlpha);
                btnBg.strokeRoundedRect(bx, by, btnW, btnH, 8);
            };
            drawBtn(0x1a3a2a, 0x44aa88, 0.8);
            this.choiceElements.push(btnBg);

            btnBg.setInteractive(new Phaser.Geom.Rectangle(bx, by, btnW, btnH), Phaser.Geom.Rectangle.Contains);

            const btnText = this.add.text(bx + btnW / 2, by + btnH / 2, choice, {
                fontFamily: 'Arial', fontSize: '11px', color: '#ffffff',
                wordWrap: { width: btnW - 12 }, align: 'center'
            }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(3);
            this.choiceElements.push(btnText);

            btnBg.on('pointerover', () => {
                this.input.setDefaultCursor('pointer');
                drawBtn(0x2a5a3a, 0x66ddaa);
            });
            btnBg.on('pointerout', () => {
                this.input.setDefaultCursor('default');
                drawBtn(0x1a3a2a, 0x44aa88, 0.8);
            });
            btnBg.on('pointerdown', () => {
                playSfx(this, 'menu_button_press');
                drawBtn(0x22aa66, 0x44ffaa);
                this.choiceElements.forEach(el => el.disableInteractive && el.disableInteractive());
                this.input.setDefaultCursor('default');
                this.time.delayedCall(300, () => {
                    this.clearChoiceUI(true);
                    onChosen(choice);
                });
            });
        });
    }

    clearChoiceUI(restoreButtons = false) {
        if (this.choiceElements) {
            this.choiceElements.forEach(el => el.destroy());
            this.choiceElements = [];
        }
        this.dialoguePanel.setVisible(true);
        this.playText.setVisible(true);
        if (restoreButtons) {
            this.pauseButton.setVisible(true).setAlpha(1).setInteractive(this.pauseHitArea, Phaser.Geom.Rectangle.Contains);
        }
    }

    showPlayerLine(text, onContinue) {
        this.clearPlayerLine();
        this.playerLineElements = [];

        // Take over the bottom bar area while the player speaks, like the choices box.
        this.dialoguePanel.setVisible(false);
        this.playButton.setVisible(false).setAlpha(0).disableInteractive();
        this.pauseButton.setVisible(false).setAlpha(0).disableInteractive();
        this.playText.setVisible(false);

        const w = this.scale.width, h = this.scale.height;
        // Match the Play/Pause conversation box: same X, width and top edge.
        const boxX = 64;
        const boxW = w - boxX * 2;
        const innerPadX = 12;
        const padTop = 10;
        const labelH = 22;
        const gapAfterBody = 8;
        const hintH = 16;
        const padBottom = 10;
        const usableW = boxW - innerPadX * 2;
        const boxY = h - 220;

        const body = this.add.text(w / 2, 0, text, {
            fontFamily: 'Arial', fontSize: '13px', color: '#ffffff',
            align: 'center', wordWrap: { width: usableW }
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(3);

        const boxH = padTop + labelH + body.height + gapAfterBody + hintH + padBottom;
        const boxBg = this.add.graphics().setScrollFactor(0).setDepth(1);
        boxBg.fillStyle(0x1a1a1a, 0.95);
        boxBg.fillRoundedRect(boxX, boxY, boxW, boxH, 12);
        boxBg.lineStyle(2, 0xffffff, 0.6);
        boxBg.strokeRoundedRect(boxX, boxY, boxW, boxH, 12);

        const label = this.add.text(w / 2, boxY + padTop + labelH / 2, 'You', {
            fontFamily: 'Arial', fontSize: '13px', color: '#cccccc', fontStyle: 'italic'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(3);

        body.setY(boxY + padTop + labelH);

        const hint = this.add.text(w / 2, boxY + boxH - padBottom - hintH / 2, '▶ Click to continue', {
            fontFamily: 'Arial', fontSize: '11px', color: '#64ca49'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(3);

        // The whole box is a click target so the player advances when ready.
        boxBg.setInteractive(new Phaser.Geom.Rectangle(boxX, boxY, boxW, boxH), Phaser.Geom.Rectangle.Contains);
        boxBg.on('pointerover', () => this.input.setDefaultCursor('pointer'));
        boxBg.on('pointerout', () => this.input.setDefaultCursor('default'));
        boxBg.on('pointerdown', () => {
            playSfx(this, 'menu_button_press');
            this.input.setDefaultCursor('default');
            boxBg.disableInteractive();
            if (onContinue) onContinue();
        });

        this.playerLineElements.push(boxBg, label, body, hint);
    }

    clearPlayerLine(restoreControls = false) {
        if (this.playerLineElements) {
            this.playerLineElements.forEach(el => el.destroy());
            this.playerLineElements = [];
        }
        if (restoreControls) {
            this.dialoguePanel.setVisible(true);
            this.playText.setVisible(true);
            this.pauseButton.setVisible(true).setAlpha(1).setInteractive(this.pauseHitArea, Phaser.Geom.Rectangle.Contains);
        }
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
                playSfx(this, 'menu_button_press');
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

    highlightSpeaker(speakerName) {
        const allSprites = [...(this.npcFaceSprites || [])];
        if (this.playerFace) allSprites.push(this.playerFace);
        allSprites.forEach(sprite => sprite.setAlpha(0.4));
        const active = this.speakerSpriteMap?.[speakerName];
        if (active) active.setAlpha(1);
    }

    stopConversation() {
        if (this.conversationTimer) {
            this.conversationTimer.destroy();
            this.conversationTimer = null;
        }
        if (this.currentSound) {
            clearVoiceline(this.currentSound);
            this.currentSound.stop();
            this.currentSound.destroy();
            this.currentSound = null;
        }
        this.hideSubtitle();
        this.clearChoiceUI();
        this.clearPlayerLine();
    }

    openMenu() {
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            if (this.currentSound && this.currentSound.isPlaying) {
                this.currentSound.pause();
            }
            this.scene.pause();
            this.scene.launch('PauseMenu', { resumeScene: 'Dialogue' });
        }
    }

    onResume() {
        if (this.currentSound && this.currentSound.isPaused) {
            this.currentSound.resume();
        }
    }

    create() {
        pauseMusic();
        playSfx(this, 'open_dialogue');

        this.events.off('resume', this.onResume, this);
        this.events.on('resume', this.onResume, this);

        this.currentLineIndex = 0;
        this.conversationTimer = null;
        this.currentSound = null;
        this.isPaused = false;
        this.pendingEvent = null;
        this.quizElements = [];
        this.choiceElements = [];
        this.playerLineElements = [];

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
            playSfx(this, 'menu_button_press');
            this.playButton.setVisible(false).setAlpha(0).disableInteractive();
            this.pauseButton.setVisible(true).setAlpha(1).setInteractive(this.pauseHitArea, Phaser.Geom.Rectangle.Contains);

            this.playText.setText('Pause Conversation');

            if (this.isPaused) {
                this.resumeConversation();
            } else {
                this.playConversation();
            }
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
            playSfx(this, 'menu_button_press');
            this.pauseButton.setVisible(false).setAlpha(0).disableInteractive();
            this.playButton.setVisible(true).setAlpha(1).setInteractive(this.arrowTriangle, Phaser.Geom.Triangle.Contains);

            this.playText.setText('Resume Conversation');

            this.pauseConversation();
        });

        this.pauseButton.off();
        this.pauseButton.setAlpha(0);
    
        this.npcFaceSprites = [];
        this.speakerSpriteMap = {};
        let npcFaceX = 112;
        const participants = Array.isArray(this.group?.participants) ? this.group.participants : [];
        for (let i = 0; i < this.npcSourceIndexes.length; i++) {
            const sprite = this.add.sprite(npcFaceX, 180, "characters_face", this.npcSourceIndexes[i]).setScale(2);
            this.npcFaceSprites.push(sprite);
            if (participants[i]?.npcName) {
                this.speakerSpriteMap[participants[i].npcName] = sprite;
            }
            npcFaceX += 95;
        }

        this.playerFace = this.add.sprite(336, 180, "characters_face", this.playerSourceIndex);
        this.playerFace.setScale(2);
        this.speakerSpriteMap['player'] = this.playerFace;

        // Always-visible reminder of the keys that get the player back out of here.
        // Sits below every panel variant (dialogue, choices, player line, quiz).
        this.closeHint = this.add.text(w / 2, h - 26, 'E  —  Close        ESC  —  Menu', {
            fontFamily: 'Arial', fontSize: '12px', color: '#cccccc'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(3);

        // Subtitle for lines without a voiceline (player's spoken lines, silent beats).
        this.subtitleBg = this.add.graphics().setScrollFactor(0).setDepth(2).setVisible(false);
        this.subtitleText = this.add.text(w / 2, 120, '', {
            fontFamily: 'Arial', fontSize: '13px', color: '#ffffff',
            align: 'center', wordWrap: { width: w - 96 }
        }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(3).setVisible(false);
    }

    close() {
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            if (this.pendingEvent) {
                EventBus.emit(this.pendingEvent);
                this.pendingEvent = null;
            }
            playSfx(this, 'close_dialogue');
            this.stopConversation();
            resumeMusic();
            const gameScreen = this.scene.get('GameScreen')
            gameScreen.cameras.main.setAlpha(1);
            this.scene.stop('Dialogue');
            gameScreen.scene.resume();
        }
    }

    update() {
        this.openMenu();
        this.close();
    }
}