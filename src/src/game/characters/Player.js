export class Player {
    constructor(scene, playerName, spriteKey, sourceIndex, tileSize, speed, collisionLayer, xPlayerPos, yPlayerPos) {
        this.scene = scene;
        this.player = null;
        this.playerName = playerName;
        this.spriteKey = spriteKey;
        this.tileSize = tileSize;
        this.sourceIndex = this.calculateSourceIndex(sourceIndex);
        this.xPlayerPos = xPlayerPos;
        this.yPlayerPos = yPlayerPos;

        this.speed = speed;
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.keys = this.scene.input.keyboard.addKeys("W,A,S,D");
        this.collisionLayer = collisionLayer;

        this.interaction = false;
        this.interactionIcon = null;

        this.create()
    }

    calculateSourceIndex(characterIndex) {
        const heroFrameCount = 60;
        const followerFrameCount = 30;

        if (characterIndex <= 0) return 0;
        return heroFrameCount + (characterIndex - 1) * followerFrameCount;
    }

    create() {
        this.player = this.scene.physics.add.sprite(this.xPlayerPos, this.yPlayerPos, this.spriteKey, this.sourceIndex);
        this.player.setCollideWorldBounds(true);

        const hitboxWidth = this.tileSize * 0.6;
        const hitboxHeight = this.tileSize * 0.8;
        this.player.body.setSize(hitboxWidth, hitboxHeight);
        this.player.body.setOffset((this.tileSize - hitboxWidth) / 2, (this.tileSize - hitboxHeight) / 2);


        this.scene.physics.add.collider(this.player, this.collisionLayer);

        this.interactionIcon = this.scene.add
            .sprite(this.xPlayerPos, this.yPlayerPos - this.tileSize, "exclamationMark", this.sourceIndex)
            .setVisible(false)
            .setDepth(1000);
    
        if (!this.scene.anims.exists("walk-up")) {
            this.scene.anims.create({
                key: "walk-up",
                frames: this.scene.anims.generateFrameNumbers(this.spriteKey, { start: this.sourceIndex + 0, end: this.sourceIndex + 2 }),
                frameRate: 12,
                repeat: -1
            });
        }

        if (!this.scene.anims.exists("walk-down")) {
            this.scene.anims.create({
                key: "walk-down",
                frames: this.scene.anims.generateFrameNumbers(this.spriteKey, { start: this.sourceIndex + 20, end: this.sourceIndex + 22 }),
                frameRate: 12,
                repeat: -1
            });
        }

        if (!this.scene.anims.exists("walk-right")) {
            this.scene.anims.create({
                key: "walk-right",
                frames: this.scene.anims.generateFrameNumbers(this.spriteKey, { start: this.sourceIndex + 10, end: this.sourceIndex + 12 }),
                frameRate: 12,
                repeat: -1
            });
        }

        // this.player.setAlpha(0.5);
    }

    playerMovement() {
        const left = this.cursors.left.isDown || this.keys.A.isDown;
        const right = this.cursors.right.isDown || this.keys.D.isDown;
        const up = this.cursors.up.isDown || this.keys.W.isDown;
        const down = this.cursors.down.isDown || this.keys.S.isDown;

        this.player.setVelocity(0);

        if (left) {
            this.player.setVelocityX(-this.speed);
            this.player.anims.play("walk-right", true);
            this.player.setFlipX(true);
        } else if (right) {
            this.player.setVelocityX(this.speed);
            this.player.anims.play("walk-right", true);
            this.player.setFlipX(false)
        }

        if (up) {
            this.player.setVelocityY(-this.speed);
            this.player.anims.play("walk-up", true);
        } else if (down) {
            this.player.setVelocityY(this.speed);
            this.player.anims.play("walk-down", true);
        } else if (!left && !right) {
            this.player.anims.stop();
        }

        // this.playerInteraction();
    }

    setInteraction(interaction) {
        this.interaction = interaction;
    }

    playerInteraction() {
        this.updateInteractionIcon();
        this.interaction = false;
    }

    updateInteractionIcon() {
        if (!this.interactionIcon) return;

        this.interactionIcon.setPosition(this.player.x, this.player.y - this.tileSize);
        this.interactionIcon.setVisible(this.interaction);
    }
}