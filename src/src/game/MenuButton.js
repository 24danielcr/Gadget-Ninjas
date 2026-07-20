import Phaser from 'phaser';

const MARGIN = 12;
const SIZE = 28;
const PANEL_RADIUS = 8;
const TEETH = 8;
const GEAR_OUTER = 10;
const GEAR_INNER = 7;
const GEAR_HOLE = 3;

export class MenuButton {
    constructor(scene, onClick) {
        this.scene = scene;
        this.onClick = onClick;

        const w = this.scene.scale.width;
        this.x = w - MARGIN - SIZE;
        this.y = MARGIN;
        this.cx = this.x + SIZE / 2;
        this.cy = this.y + SIZE / 2;

        this.button = this.scene.add.graphics()
            .setScrollFactor(0)
            .setDepth(20);

        // this.label = this.scene.add.text(this.cx, this.y + SIZE + 4, 'ESC', {
        //     fontFamily: 'Arial',
        //     fontSize: '8px',
        //     color: '#cccccc',
        // })
            // .setOrigin(0.5, 0)
            // .setScrollFactor(0)
            // .setDepth(21);

        this.draw(false);

        this.button.setInteractive(
            new Phaser.Geom.Rectangle(this.x, this.y, SIZE, SIZE),
            Phaser.Geom.Rectangle.Contains
        );
        this.button.on('pointerover', () => {
            this.scene.input.setDefaultCursor('pointer');
            this.draw(true);
        });
        this.button.on('pointerout', () => {
            this.scene.input.setDefaultCursor('default');
            this.draw(false);
        });
        this.button.on('pointerdown', () => {
            this.scene.input.setDefaultCursor('default');
            this.draw(false);
            this.onClick();
        });
    }

    draw(hover) {
        const g = this.button;
        const panelFill = hover ? 0x3a3a3a : 0x1a1a1a;
        const gearColor = hover ? 0xffffff : 0xf2c14e;

        g.clear();
        g.fillStyle(panelFill, 0.85);
        g.fillRoundedRect(this.x, this.y, SIZE, SIZE, PANEL_RADIUS);
        g.lineStyle(1.5, 0xffffff, 0.3);
        g.strokeRoundedRect(this.x, this.y, SIZE, SIZE, PANEL_RADIUS);

        // Gear: one quad per tooth around the hub, then the hub itself and a
        // punched-out centre in the panel colour so it reads as a hole.
        g.fillStyle(gearColor, 1);
        const halfTooth = (Math.PI / TEETH) * 0.45;
        for (let i = 0; i < TEETH; i++) {
            const angle = (i / TEETH) * Math.PI * 2;
            g.fillPoints([
                this.gearPoint(angle - halfTooth, GEAR_INNER),
                this.gearPoint(angle - halfTooth, GEAR_OUTER),
                this.gearPoint(angle + halfTooth, GEAR_OUTER),
                this.gearPoint(angle + halfTooth, GEAR_INNER),
            ], true);
        }
        g.fillCircle(this.cx, this.cy, GEAR_INNER);

        g.fillStyle(panelFill, 1);
        g.fillCircle(this.cx, this.cy, GEAR_HOLE);
    }

    gearPoint(angle, radius) {
        return new Phaser.Geom.Point(
            this.cx + Math.cos(angle) * radius,
            this.cy + Math.sin(angle) * radius
        );
    }

    destroy() {
        this.button.destroy();
    }
}
