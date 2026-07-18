import Phaser, { Scene } from 'phaser';
import { playSfx, getSfxVolume, setSfxVolume } from '../SoundEffects.js';
import { getMusicVolume, setMusicVolume } from '../BackgroundMusic.js';
import { getVoicelineVolume, setVoicelineVolume } from '../Voicelines.js';
import { MissionManager } from '../MissionManager.js';

export class PauseMenu extends Scene {
    constructor() {
        super("PauseMenu");
    }

    init(data) {
        this.resumeScene = data?.resumeScene ?? 'GameScreen';
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.confirmElements = null;
    }

    create() {
        this.scene.bringToTop();
        playSfx(this, 'open_menu');

        const w = this.scale.width, h = this.scale.height;

        this.add.rectangle(0, 0, w, h, 0x000000, 0.6)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(0);

        const panelW = w - 100;
        const panelH = 360;
        const panelX = (w - panelW) / 2;
        const panelY = (h - panelH) / 2;

        const panel = this.add.graphics().setScrollFactor(0).setDepth(1);
        panel.fillStyle(0x1a1a1a, 0.95);
        panel.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
        panel.lineStyle(2, 0xffffff, 0.6);
        panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

        this.add.text(w / 2, panelY + 26, 'Paused', {
            fontFamily: 'Arial', fontSize: '24px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(2);

        const sliderX = panelX + 30;
        const sliderW = panelW - 60;

        this.createSlider('Music', sliderX, panelY + 78, sliderW, getMusicVolume(), (value) => {
            setMusicVolume(value);
        });

        this.createSlider('Sound FX', sliderX, panelY + 130, sliderW, getSfxVolume(), (value) => {
            setSfxVolume(value);
        }, true);

        this.createSlider('Dialogue', sliderX, panelY + 182, sliderW, getVoicelineVolume(), (value) => {
            setVoicelineVolume(value);
        });

        // Save + Restart row
        const rowY = panelY + 250;
        const btnW = (sliderW - 16) / 2;
        this.createButton(sliderX + btnW / 2, rowY, btnW, 40, 'Save Game', {
            fillIdle: 0x1a2a3a, strokeIdle: 0x4488aa,
            fillHover: 0x2a3a5a, strokeHover: 0x66aadd,
            depth: 2, onClick: () => this.saveGame()
        });
        this.createButton(sliderX + btnW + 16 + btnW / 2, rowY, btnW, 40, 'Restart Game', {
            fillIdle: 0x3a1a1a, strokeIdle: 0xaa4444,
            fillHover: 0x5a2a2a, strokeHover: 0xdd6666,
            depth: 2, onClick: () => this.openRestartConfirm()
        });

        this.createButton(w / 2, panelY + panelH - 34, 160, 40, 'Resume', {
            fillIdle: 0x1a3a2a, strokeIdle: 0x44aa88,
            fillHover: 0x2a5a3a, strokeHover: 0x66ddaa,
            depth: 2, onClick: () => this.closeMenu()
        });
    }

    createSlider(label, x, y, width, initial, onChange, previewOnChange = false) {
        const trackY = y + 16;
        const knobRadius = 9;
        const minX = x;
        const maxX = x + width;

        this.add.text(x, y - 6, label, {
            fontFamily: 'Arial', fontSize: '14px', color: '#cccccc'
        }).setOrigin(0, 1).setScrollFactor(0).setDepth(2);

        const percentText = this.add.text(maxX, y - 6, `${Math.round(initial * 100)}%`, {
            fontFamily: 'Arial', fontSize: '14px', color: '#ffffff'
        }).setOrigin(1, 1).setScrollFactor(0).setDepth(2);

        const fill = this.add.graphics().setScrollFactor(0).setDepth(1);
        const knob = this.add.circle(minX + initial * width, trackY, knobRadius, 0x64ca49)
            .setScrollFactor(0).setDepth(3);

        const redraw = (value) => {
            const knobX = minX + value * width;
            fill.clear();
            fill.fillStyle(0x444444, 1);
            fill.fillRoundedRect(minX, trackY - 3, width, 6, 3);
            fill.fillStyle(0x64ca49, 1);
            fill.fillRoundedRect(minX, trackY - 3, knobX - minX, 6, 3);
            knob.setPosition(knobX, trackY);
            percentText.setText(`${Math.round(value * 100)}%`);
        };

        redraw(initial);

        knob.setInteractive({ draggable: true, useHandCursor: true, hitArea: new Phaser.Geom.Circle(0, 0, knobRadius + 6), hitAreaCallback: Phaser.Geom.Circle.Contains });

        let lastPreview = 0;
        const apply = (pointerX) => {
            const clampedX = Phaser.Math.Clamp(pointerX, minX, maxX);
            const value = (clampedX - minX) / width;
            redraw(value);
            onChange(value);
            if (previewOnChange && this.time.now - lastPreview > 120) {
                lastPreview = this.time.now;
                playSfx(this, 'menu_button_press');
            }
        };

        knob.on('drag', (pointer, dragX) => apply(dragX));

        const trackHit = this.add.rectangle(minX + width / 2, trackY, width, 24, 0x000000, 0)
            .setScrollFactor(0).setDepth(1).setInteractive({ useHandCursor: true });
        trackHit.on('pointerdown', (pointer) => apply(pointer.x));
    }

    createButton(cx, cy, btnW, btnH, label, opts) {
        const bx = cx - btnW / 2;
        const by = cy - btnH / 2;
        const depth = opts.depth ?? 2;

        const btn = this.add.graphics().setScrollFactor(0).setDepth(depth);
        const draw = (fill, stroke) => {
            btn.clear();
            btn.fillStyle(fill, 1);
            btn.fillRoundedRect(bx, by, btnW, btnH, 8);
            btn.lineStyle(2, stroke, 1);
            btn.strokeRoundedRect(bx, by, btnW, btnH, 8);
        };
        draw(opts.fillIdle, opts.strokeIdle);

        const text = this.add.text(cx, cy, label, {
            fontFamily: 'Arial', fontSize: '16px', color: '#ffffff'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(depth + 1);

        btn.setInteractive(new Phaser.Geom.Rectangle(bx, by, btnW, btnH), Phaser.Geom.Rectangle.Contains);
        btn.on('pointerover', () => { this.input.setDefaultCursor('pointer'); draw(opts.fillHover, opts.strokeHover); });
        btn.on('pointerout', () => { this.input.setDefaultCursor('default'); draw(opts.fillIdle, opts.strokeIdle); });
        btn.on('pointerdown', () => opts.onClick());

        return { btn, text };
    }

    saveGame() {
        playSfx(this, 'menu_button_press');
        const gameScreen = this.scene.get('GameScreen');
        gameScreen?.missionManager?.save();
        this.showToast('Progress saved!');
    }

    showToast(message) {
        if (this.toast) this.toast.destroy();

        const w = this.scale.width;
        this.toast = this.add.text(w / 2, 22, message, {
            fontFamily: 'Arial', fontSize: '16px', color: '#ffffff',
            backgroundColor: '#1a3a2a', padding: { x: 12, y: 6 }
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(20).setAlpha(0);

        this.tweens.add({
            targets: this.toast, alpha: 1, duration: 150, yoyo: true, hold: 900,
            onComplete: () => { this.toast?.destroy(); this.toast = null; }
        });
    }

    openRestartConfirm() {
        if (this.confirmElements) return;
        playSfx(this, 'menu_button_press');

        const w = this.scale.width, h = this.scale.height;
        const elements = [];

        elements.push(this.add.rectangle(0, 0, w, h, 0x000000, 0.75)
            .setOrigin(0).setScrollFactor(0).setDepth(10)
            .setInteractive());

        const boxW = w - 80, boxH = 170;
        const boxX = (w - boxW) / 2, boxY = (h - boxH) / 2;
        const box = this.add.graphics().setScrollFactor(0).setDepth(11);
        box.fillStyle(0x1a1a1a, 1);
        box.fillRoundedRect(boxX, boxY, boxW, boxH, 12);
        box.lineStyle(2, 0xaa4444, 1);
        box.strokeRoundedRect(boxX, boxY, boxW, boxH, 12);
        elements.push(box);

        elements.push(this.add.text(w / 2, boxY + 34, 'Restart Game?', {
            fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(12));

        elements.push(this.add.text(w / 2, boxY + 70, 'All progress will be lost.', {
            fontFamily: 'Arial', fontSize: '14px', color: '#cccccc',
            align: 'center', wordWrap: { width: boxW - 40 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(12));

        const btnY = boxY + boxH - 34;
        const cancel = this.createButton(w / 2 - 82, btnY, 150, 40, 'Cancel', {
            fillIdle: 0x2a2a2a, strokeIdle: 0x888888,
            fillHover: 0x3a3a3a, strokeHover: 0xaaaaaa,
            depth: 12, onClick: () => this.closeRestartConfirm()
        });
        const confirm = this.createButton(w / 2 + 82, btnY, 150, 40, 'Restart', {
            fillIdle: 0x3a1a1a, strokeIdle: 0xaa4444,
            fillHover: 0x5a2a2a, strokeHover: 0xdd6666,
            depth: 12, onClick: () => this.restartGame()
        });
        elements.push(cancel.btn, cancel.text, confirm.btn, confirm.text);

        this.confirmElements = elements;
    }

    closeRestartConfirm() {
        if (!this.confirmElements) return;
        playSfx(this, 'menu_button_press');
        this.input.setDefaultCursor('default');
        this.confirmElements.forEach(el => el.destroy());
        this.confirmElements = null;
    }

    restartGame() {
        playSfx(this, 'play_playagain');
        this.input.setDefaultCursor('default');
        MissionManager.clearProgress();
        this.scene.stop('Dialogue');
        this.scene.stop('PauseMenu');
        this.scene.start('GameScreen');
    }

    closeMenu() {
        playSfx(this, 'close_menu');
        this.input.setDefaultCursor('default');
        const target = this.scene.get(this.resumeScene);
        this.scene.stop('PauseMenu');
        target.scene.resume();
    }

    update() {
        if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
            if (this.confirmElements) {
                this.closeRestartConfirm();
            } else {
                this.closeMenu();
            }
        }
    }
}
