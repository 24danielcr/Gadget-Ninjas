import Phaser from "phaser";

export class NPC {
    constructor(scene, npcName, spriteKey, sourceIndex, tileSize, speed, collisionLayer, xNpcPos, yNpcPos) {
        this.scene = scene;
        this.npc = null;
        this.npcName = npcName;
        this.spriteKey = spriteKey;
        this.sourceIndex = this.calculateSourceIndex(sourceIndex);
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

                const randomDirection = Phaser.Math.Between(0, 3);

                this.npc.setVelocity(0);
                let moved = false;

                switch (randomDirection) {
                    case 0:
                        this.npc.setVelocityY(-this.speed); // Move up
                        this.npc.anims.play(this.animKeys.up, true);
                        moved = true;
                        break;
                    case 1:
                        this.npc.setVelocityY(this.speed); // Move down
                        this.npc.anims.play(this.animKeys.down, true);
                        moved = true;
                        break;
                    case 2:
                        this.npc.setVelocityX(-this.speed); // Move left
                        this.npc.anims.play(this.animKeys.right, true);
                        this.npc.setFlipX(true);
                        moved = true;
                        break;
                    case 3:
                        this.npc.setVelocityX(this.speed); // Move right
                        this.npc.anims.play(this.animKeys.right, true);
                        this.npc.setFlipX(false);
                        moved = true;
                }

                if (moved) {
                    this.scene.time.delayedCall(500, () => {
                        if (!this.npc || !this.npc.body) return;
                        this.npc.setVelocity(0);
                        this.npc.anims.stop();
                        this.npc.setFrame(this.sourceIndex + 21);
                    });
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
            this.scene.scene.launch('Dialogue', { npc: this.npcName, npcSourceIndex: 8, playerSourceIndex: 0});
            this.scene.scene.bringToTop('Dialogue');
        }

        this.playerInteraction = false;
    }
}