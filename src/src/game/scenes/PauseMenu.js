import Phaser, { Scene } from 'phaser';
import { playSfx, getSfxVolume, setSfxVolume } from '../SoundEffects.js';
import { getMusicVolume, setMusicVolume } from '../BackgroundMusic.js';
import { getVoicelineVolume, setVoicelineVolume } from '../Voicelines.js';

export class PauseMenu extends Scene {
    constructor() {
        super("PauseMenu");
    }

    init(data) {
        this.resumeScene = data?.resumeScene ?? 'GameScreen';
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
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
        const panelH = 282;
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

        this.createResumeButton(w / 2, panelY + panelH - 34);
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

    createResumeButton(cx, cy) {
        const btnW = 160;
        const btnH = 40;
        const bx = cx - btnW / 2;
        const by = cy - btnH / 2;

        const btn = this.add.graphics().setScrollFactor(0).setDepth(2);
        const draw = (fill, stroke) => {
            btn.clear();
            btn.fillStyle(fill, 1);
            btn.fillRoundedRect(bx, by, btnW, btnH, 8);
            btn.lineStyle(2, stroke, 1);
            btn.strokeRoundedRect(bx, by, btnW, btnH, 8);
        };
        draw(0x1a3a2a, 0x44aa88);

        this.add.text(cx, cy, 'Resume', {
            fontFamily: 'Arial', fontSize: '16px', color: '#ffffff'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(3);

        btn.setInteractive(new Phaser.Geom.Rectangle(bx, by, btnW, btnH), Phaser.Geom.Rectangle.Contains);
        btn.on('pointerover', () => { this.input.setDefaultCursor('pointer'); draw(0x2a5a3a, 0x66ddaa); });
        btn.on('pointerout', () => { this.input.setDefaultCursor('default'); draw(0x1a3a2a, 0x44aa88); });
        btn.on('pointerdown', () => this.closeMenu());
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
            this.closeMenu();
        }
    }
}
