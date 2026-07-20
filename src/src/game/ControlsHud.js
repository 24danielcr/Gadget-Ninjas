import Phaser from 'phaser';
import { playSfx } from './SoundEffects';

const PAD_X = 10;
const PAD_Y = 8;
const COL_GAP = 10;
const PANEL_RADIUS = 8;
const PANEL_X = 12;
const PANEL_MARGIN_BOTTOM = 12;
const BADGE_SIZE = 22;

const CONTROLS = [
    ['WASD / Arrows', 'Move'],
    ['E',             'Talk / Close'],
    ['ESC',           'Menu'],
];

export class ControlsHud {
    constructor(scene) {
        this.scene = scene;
        this.expanded = false;

        this.panelBg = this.scene.add.graphics()
            .setScrollFactor(0)
            .setDepth(20);

        const textStyle = {
            fontFamily: 'Arial',
            fontSize: '9px',
            lineSpacing: 3,
        };

        this.keysText = this.scene.add.text(0, 0, CONTROLS.map(c => c[0]).join('\n'), {
            ...textStyle,
            color: '#f2c14e',
        })
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(21);

        this.descText = this.scene.add.text(0, 0, CONTROLS.map(c => c[1]).join('\n'), {
            ...textStyle,
            color: '#ffffff',
        })
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(21);

        this.badgeText = this.scene.add.text(0, 0, '?', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#f2c14e',
            fontStyle: 'bold',
        })
            .setOrigin(0.5, 0.5)
            .setScrollFactor(0)
            .setDepth(21);

        this.redrawPanel();
    }

    redrawPanel() {
        const h = this.scene.scale.height;
        this.panelBg.clear();

        if (this.expanded) {
            const keysW = this.keysText.width;
            const textH = Math.max(this.keysText.height, this.descText.height);
            const panelW = PAD_X * 2 + keysW + COL_GAP + this.descText.width;
            const panelH = PAD_Y * 2 + textH;
            const panelY = h - PANEL_MARGIN_BOTTOM - panelH;

            this.drawPanel(PANEL_X, panelY, panelW, panelH);

            this.keysText.setPosition(PANEL_X + PAD_X, panelY + PAD_Y).setVisible(true);
            this.descText.setPosition(PANEL_X + PAD_X + keysW + COL_GAP, panelY + PAD_Y).setVisible(true);
            this.badgeText.setVisible(false);

            this.setHitArea(PANEL_X, panelY, panelW, panelH);
        } else {
            const panelY = h - PANEL_MARGIN_BOTTOM - BADGE_SIZE;

            this.drawPanel(PANEL_X, panelY, BADGE_SIZE, BADGE_SIZE);

            this.keysText.setVisible(false);
            this.descText.setVisible(false);
            this.badgeText
                .setPosition(PANEL_X + BADGE_SIZE / 2, panelY + BADGE_SIZE / 2)
                .setVisible(true);

            this.setHitArea(PANEL_X, panelY, BADGE_SIZE, BADGE_SIZE);
        }
    }

    drawPanel(x, y, w, h) {
        this.panelBg.fillStyle(0x1a1a1a, 0.85);
        this.panelBg.fillRoundedRect(x, y, w, h, PANEL_RADIUS);
        this.panelBg.lineStyle(1.5, 0xffffff, 0.3);
        this.panelBg.strokeRoundedRect(x, y, w, h, PANEL_RADIUS);
    }

    setHitArea(x, y, w, h) {
        this.panelBg.setInteractive(new Phaser.Geom.Rectangle(x, y, w, h), Phaser.Geom.Rectangle.Contains);
        this.panelBg.off('pointerdown');
        this.panelBg.off('pointerover');
        this.panelBg.off('pointerout');
        this.panelBg.on('pointerdown', () => this.toggle());
        this.panelBg.on('pointerover', () => this.scene.input.setDefaultCursor('pointer'));
        this.panelBg.on('pointerout',  () => this.scene.input.setDefaultCursor('default'));
    }

    toggle() {
        playSfx(this.scene, 'open_close_mission_button');
        this.expanded = !this.expanded;
        this.redrawPanel();
    }

    destroy() {
        this.panelBg.destroy();
        this.keysText.destroy();
        this.descText.destroy();
        this.badgeText.destroy();
    }
}
