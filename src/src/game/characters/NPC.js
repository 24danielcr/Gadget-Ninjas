import Phaser from "phaser";

export class NPC {
    constructor(scene, npcName, charactersData, spriteKey, tileSize, speed, collisionLayer, xNpcPos, yNpcPos) {
        this.scene = scene;
        this.npc = null;
        this.npcName = npcName;
        this.charactersData = charactersData;
        this.spriteKey = spriteKey;
        this.sourceIndex = this.calculateSourceIndex(charactersData[this.npcName].spriteSourceIndex);
        this.tileSize = tileSize;
        this.speed = speed;
        this.collisionLayer = collisionLayer;
        this.xNpcPos = xNpcPos;
        this.yNpcPos = yNpcPos;

        this.playerInteraction = false;
        this.interactionRange = this.tileSize * 1.5;
        this.interactionZone = null;
        this.interactKey = this.scene.input.keyboard.addKey('E');

        this.create();
        this.npcMovement();
    }

    canMoveTo(dx, dy) {
        if (!this.npc || !this.npc.body) return false;

        const targetX = this.npc.x + dx;
        const targetY = this.npc.y + dy;

        const bounds = this.scene.physics.world.bounds;
        if (!bounds.contains(targetX, targetY)) return false;

        const tile = this.collisionLayer.getTileAtWorldXY(targetX, targetY);
        return !(tile && tile.collides);
    }

    calculateSourceIndex(characterIndex) {
        const heroFrameCount = 60;
        const followerFrameCount = 30;

        if (characterIndex <= 0) return 0;
        return heroFrameCount + (characterIndex - 1) * followerFrameCount;
    }

    create() {
        this.npc = this.scene.physics.add.sprite(this.xNpcPos, this.yNpcPos, this.spriteKey, this.sourceIndex);
        this.npc.setCollideWorldBounds(true);

        const hitboxWidth = this.tileSize * 0.6;
        const hitboxHeight = this.tileSize * 0.8;
        this.npc.body.setSize(hitboxWidth, hitboxHeight);
        this.npc.body.setOffset((this.tileSize - hitboxWidth) / 2, (this.tileSize - hitboxHeight) / 2);

        this.scene.physics.add.collider(this.npc, this.collisionLayer);

        this.interactionZone = this.scene.add.zone(this.xNpcPos, this.yNpcPos, this.interactionRange, this.interactionRange);
        this.scene.physics.add.existing(this.interactionZone);
        this.interactionZone.body.setAllowGravity(false);
        this.interactionZone.body.setImmovable(true);
       
        this.animKeys = {
            up: `${this.npcName}-walk-up`,
            down: `${this.npcName}-walk-down`,
            right: `${this.npcName}-walk-right`
        };

        this.ensureAnim(this.animKeys.up, this.sourceIndex + 0, this.sourceIndex + 2);
        this.ensureAnim(this.animKeys.down, this.sourceIndex + 20, this.sourceIndex + 22);
        this.ensureAnim(this.animKeys.right, this.sourceIndex + 10, this.sourceIndex + 12);
    }

    ensureAnim(key, start, end) {
        if (this.scene.anims.exists(key)) return;
        this.scene.anims.create({
            key,
            frames: this.scene.anims.generateFrameNumbers(this.spriteKey, { start, end }),
            frameRate: 12,
            repeat: -1
        });
    }

    setPlayerInteraction(playerInteraction) {
        this.playerInteraction = playerInteraction;
    }


    npcMovement() {
        this.scene.time.addEvent({
        delay: Phaser.Math.Between(2000, 4000),
        loop: true,
            callback: () => {
                const step = this.collisionLayer?.tilemap?.tileWidth || this.tileSize;

                const directions = Phaser.Utils.Array.Shuffle([
                    { dx: 0, dy: -step, velocity: { x: 0, y: -this.speed }, anim: this.animKeys.up, flipX: false },
                    { dx: 0, dy: step,  velocity: { x: 0, y: this.speed },  anim: this.animKeys.down, flipX: false },
                    { dx: -step, dy: 0, velocity: { x: -this.speed, y: 0 }, anim: this.animKeys.right, flipX: true },
                    { dx: step, dy: 0,  velocity: { x: this.speed, y: 0 },  anim: this.animKeys.right, flipX: false },
                ]);

                this.npc.setVelocity(0);

                const nextMove = directions.find(dir => this.canMoveTo(dir.dx, dir.dy));

                if (nextMove) {
                    this.npc.setVelocity(nextMove.velocity.x, nextMove.velocity.y);
                    this.npc.anims.play(nextMove.anim, true);
                    this.npc.setFlipX(nextMove.flipX);

                    this.scene.time.delayedCall(500, () => {
                        if (!this.npc || !this.npc.body) return;
                        this.npc.setVelocity(0);
                        this.npc.anims.stop();
                        this.npc.setFrame(this.sourceIndex + 21);
                    });
                } else {
                    this.npc.anims.stop();
                    this.npc.setFrame(this.sourceIndex + 21);
                }
            }
        });
    }

    NPCInteraction() {
        if (this.interactionZone) {
            this.interactionZone.setPosition(this.npc.x, this.npc.y);
        }

        if (this.playerInteraction && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            // this.scene.cameras.main.setAlpha(0.2);
            this.scene.scene.pause(this.scene.scene.key);
            this.scene.scene.launch('Dialogue', { npc: this.npcName, npcSourceIndex: this.charactersData[this.npcName].faceSourceIndex, playerSourceIndex: this.charactersData[this.scene.player.playerName].faceSourceIndex});
            this.scene.scene.bringToTop('Dialogue');
        }

        this.playerInteraction = false;
    }
}