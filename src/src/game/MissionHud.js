import Phaser from 'phaser';
import { EventBus } from './EventBus'
import { RegexHelper } from '../RegexHelper';

const regexHelper = new RegexHelper();

const STATE_COLORS = {
    idle:          0xf2c14e,
    active:        0x64ca49,
    awaiting_quiz: 0x4e9af2,
};

const PAD_X = 12;
const PAD_Y = 8;
const DOT_RADIUS = 8;
const DOT_GAP = 8;
const PANEL_RADIUS = 8;
const PANEL_X = 12;
const PANEL_Y = 12;

export class MissionHud {
    constructor(scene, missionManager, missions) {
        this.scene = scene;
        this.missionManager = missionManager;
        this.missions = missions;
        this.expanded = true;
        this.blinkTween = null;

        this.panelBg = this.scene.add.graphics()
            .setScrollFactor(0)
            .setDepth(20);

        this.dot = this.scene.add.graphics()
            .setScrollFactor(0)
            .setDepth(21);

        this.missionHudText = this.scene.add.text(0, 0, "", {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#ffffff',
        })
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(21);

        this.changeMissionHudText();

        EventBus.on('mission-accepted',   () => this.changeMissionHudText());
        EventBus.on('mission-npc-talked', () => this.changeMissionHudText());
        EventBus.on('mission-complete',   () => this.changeMissionHudText());
    }

    changeMissionHudText() {
        const state  = this.missionManager.currentState;
        const states = this.missionManager.states;
        let label;

        if (state === states.idle) {
            label = "Talk to Bob!";
        } else if (state === states.active) {
            if (!this.missionManager.currentMission) return;
            const missionData = this.missions['missions'][this.missionManager.currentMission];
            if (!missionData) return;
            const names = missionData['participants'].map(p =>
                `${regexHelper.firstNameRegex(p)} ${regexHelper.secondNameRegex(p)}`
            );
            label = "Talk to " + names.join(" & ") + "!";
        } else if (state === states.awaiting_quiz) {
            label = "Return to Bob!";
        } else {
            console.warn('MissionHud: unhandled state', state);
            return;
        }

        this.missionHudText.setText(label);
        this.redrawPanel(state);
    }

    redrawPanel(state) {
        const textH      = this.missionHudText.height;
        const panelH     = textH + PAD_Y * 2;
        const dotCenterX = PANEL_X + PAD_X + DOT_RADIUS;
        const dotCenterY = PANEL_Y + panelH / 2;
        const color      = STATE_COLORS[state] ?? 0xffffff;

        this.panelBg.clear();

        if (this.expanded) {
            const textW  = this.missionHudText.width;
            const panelW = PAD_X + DOT_RADIUS * 2 + DOT_GAP + textW + PAD_X;

            this.panelBg.fillStyle(0x1a1a1a, 0.85);
            this.panelBg.fillRoundedRect(PANEL_X, PANEL_Y, panelW, panelH, PANEL_RADIUS);
            this.panelBg.lineStyle(1.5, 0xffffff, 0.3);
            this.panelBg.strokeRoundedRect(PANEL_X, PANEL_Y, panelW, panelH, PANEL_RADIUS);

            this.missionHudText.setPosition(dotCenterX + DOT_RADIUS + DOT_GAP, dotCenterY).setVisible(true);
        } else {
            this.missionHudText.setVisible(false);

            const panelW = PAD_X * 2 + DOT_RADIUS * 2;

            this.panelBg.fillStyle(0x1a1a1a, 0.85);
            this.panelBg.fillRoundedRect(PANEL_X, PANEL_Y, panelW, panelH, PANEL_RADIUS);
            this.panelBg.lineStyle(1.5, 0xffffff, 0.3);
            this.panelBg.strokeRoundedRect(PANEL_X, PANEL_Y, panelW, panelH, PANEL_RADIUS);
        }

        this.dot.clear();
        this.dot.fillStyle(color, 1);
        this.dot.fillCircle(dotCenterX, dotCenterY, DOT_RADIUS);

        const hitCircle = new Phaser.Geom.Circle(dotCenterX, dotCenterY, DOT_RADIUS + 6);
        this.dot.setInteractive(hitCircle, Phaser.Geom.Circle.Contains);
        this.dot.off('pointerdown');
        this.dot.on('pointerdown', () => this.toggle(state));
        this.dot.on('pointerover', () => this.scene.input.setDefaultCursor('pointer'));
        this.dot.on('pointerout',  () => this.scene.input.setDefaultCursor('default'));

        this.restartBlink();
    }

    restartBlink() {
        if (this.blinkTween) {
            this.blinkTween.stop();
            this.blinkTween = null;
        }
        this.dot.setAlpha(1);
        this.blinkTween = this.scene.tweens.add({
            targets:  this.dot,
            alpha:    0.15,
            duration: 600,
            yoyo:     true,
            repeat:   -1,
            ease:     'Sine.easeInOut',
        });
    }

    toggle(state) {
        this.expanded = !this.expanded;
        this.redrawPanel(state);
    }
}
