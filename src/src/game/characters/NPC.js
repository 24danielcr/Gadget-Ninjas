import Phaser from "phaser";

export class NPC {
    constructor(scene, npcName, charactersData, characterPositions, spriteKey, tileSize, speed, collisionLayer, xNpcPos, yNpcPos, allowMovement) {
        this.scene = scene;
        this.npc = null;
        this.npcName = npcName;
        this.charactersData = charactersData;
        this.characterPositions = characterPositions;
        this.spriteKey = spriteKey;
        this.sourceIndex = this.calculateSourceIndex(charactersData[this.npcName].spriteSourceIndex);
        this.tileSize = tileSize;
        this.speed = speed;
        this.collisionLayer = collisionLayer;
        this.xNpcPos = xNpcPos;
        this.yNpcPos = yNpcPos;
        // this.interactionRange = this.tileSize * 1.5;
        // this.interactionZone = null;

        this.allowMovement = allowMovement;

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
        this.npc = this.scene.physics.add.sprite(this.xNpcPos, this.yNpcPos, this.spriteKey, this.sourceIndex + this.characterPositions['down-stand']);
        this.npc.setCollideWorldBounds(true);

        const hitboxWidth = this.tileSize * 0.6;
        const hitboxHeight = this.tileSize * 0.8;
        this.npc.body.setSize(hitboxWidth, hitboxHeight);
        this.npc.body.setOffset((this.tileSize - hitboxWidth) / 2, (this.tileSize - hitboxHeight) / 2);

        this.scene.physics.add.collider(this.npc, this.collisionLayer);

        // this.interactionZone = this.scene.add.zone(this.xNpcPos, this.yNpcPos, this.interactionRange, this.interactionRange);
        // this.scene.physics.add.existing(this.interactionZone);
        // this.interactionZone.body.setAllowGravity(false);
        // this.interactionZone.body.setImmovable(true);
       
        this.animKeys = {
            up: `${this.npcName}-up-walk`,
            down: `${this.npcName}-down-walk`,
            right: `${this.npcName}-right-walk`
        };

        this.idleFrames = {
            up: this.frame("up-stand"),
            down: this.frame("down-stand"),
            right: this.frame("right-stand")
        };

        this.ensureAnim(this.animKeys.up, this.frame("up-walk-left"), this.frame("up-walk-right"));
        this.ensureAnim(this.animKeys.down, this.frame("down-walk-left"), this.frame("down-walk-right"));
        this.ensureAnim(this.animKeys.right, this.frame("right-walk-left"), this.frame("right-walk-right"));
    }

    frame(positionKey) {
        const offset = this.characterPositions?.[positionKey] ?? 0;
        return this.sourceIndex + offset;
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


    npcMovement() {
            this.scene.time.addEvent({
            delay: Phaser.Math.Between(2000, 4000),
            loop: true,
                callback: () => {
                    if (this.allowMovement) {

                        const step = this.collisionLayer?.tilemap?.tileWidth || this.tileSize;

                        const directions = Phaser.Utils.Array.Shuffle([
                            { dx: 0, dy: -step, velocity: { x: 0, y: -this.speed }, anim: this.animKeys.up, flipX: false, idle: this.idleFrames.up },
                            { dx: 0, dy: step,  velocity: { x: 0, y: this.speed },  anim: this.animKeys.down, flipX: false, idle: this.idleFrames.down },
                            { dx: -step, dy: 0, velocity: { x: -this.speed, y: 0 }, anim: this.animKeys.right, flipX: true, idle: this.idleFrames.right },
                            { dx: step, dy: 0,  velocity: { x: this.speed, y: 0 },  anim: this.animKeys.right, flipX: false, idle: this.idleFrames.right },
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
                                this.npc.setFrame(nextMove.idle);
                            });
                        } else {
                            this.npc.anims.stop();
                            this.npc.setFrame(this.idleFrames.down);
                        }
                    }
                }
            });
    }
}