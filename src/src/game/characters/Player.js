export class Player {
    constructor(scene, playerName, charactersData, characterPositions, spriteKey, tileSize, speed, collisionLayer, xPlayerPos, yPlayerPos) {
        this.scene = scene;
        this.player = null;
        this.playerName = playerName;
        this.spriteKey = spriteKey;
        this.tileSize = tileSize;
        this.characterPositions = characterPositions;
        this.sourceIndex = this.calculateSourceIndex(charactersData[this.playerName].spriteSourceIndex);
        this.xPlayerPos = xPlayerPos;
        this.yPlayerPos = yPlayerPos;
        this.lastFacing = "down";

        this.speed = speed;
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.keys = this.scene.input.keyboard.addKeys("W,A,S,D");
        this.collisionLayer = collisionLayer;

        this.create()
    }

    calculateSourceIndex(characterIndex) {
        const heroFrameCount = 60;
        const followerFrameCount = 30;

        if (characterIndex <= 0) return 0;
        return heroFrameCount + (characterIndex - 1) * followerFrameCount;
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

    playerMovement() {
        const left = this.cursors.left.isDown || this.keys.A.isDown;
        const right = this.cursors.right.isDown || this.keys.D.isDown;
        const up = this.cursors.up.isDown || this.keys.W.isDown;
        const down = this.cursors.down.isDown || this.keys.S.isDown;

        this.player.setVelocity(0);

        if (left) {
            this.player.setVelocityX(-this.speed);
            this.player.anims.play(this.animKeys.right, true);
            this.player.setFlipX(true);
            this.lastFacing = "left";
        } else if (right) {
            this.player.setVelocityX(this.speed);
            this.player.anims.play(this.animKeys.right, true);
            this.player.setFlipX(false);
            this.lastFacing = "right";
        }

        if (up) {
            this.player.setVelocityY(-this.speed);
            this.player.anims.play(this.animKeys.up, true);
            this.player.setFlipX(false);
            this.lastFacing = "up";
        } else if (down) {
            this.player.setVelocityY(this.speed);
            this.player.anims.play(this.animKeys.down, true);
            this.player.setFlipX(false);
            this.lastFacing = "down";
        } else if (!left && !right) {
            this.player.anims.stop();
            const idle = this.idleFrames[this.lastFacing] ?? this.idleFrames.down;
            this.player.setFrame(idle);
            this.player.setFlipX(this.lastFacing === "left");
        }
    }

    create() {
        this.player = this.scene.physics.add.sprite(this.xPlayerPos, this.yPlayerPos, this.spriteKey, this.sourceIndex);
        this.player.setCollideWorldBounds(true);

        const hitboxWidth = this.tileSize * 0.6;
        const hitboxHeight = this.tileSize * 0.8;
        this.player.body.setSize(hitboxWidth, hitboxHeight);
        this.player.body.setOffset((this.tileSize - hitboxWidth) / 2, (this.tileSize - hitboxHeight) / 2);


        this.scene.physics.add.collider(this.player, this.collisionLayer);

        this.animKeys = {
            up: `${this.playerName}-up-walk`,
            down: `${this.playerName}-down-walk`,
            right: `${this.playerName}-right-walk`
        };

        this.idleFrames = {
            up: this.frame("up-stand"),
            down: this.frame("down-stand"),
            right: this.frame("right-stand"),
            left: this.frame("right-stand")
        };

        this.ensureAnim(this.animKeys.up, this.frame("up-walk-left"), this.frame("up-walk-right"));
        this.ensureAnim(this.animKeys.down, this.frame("down-walk-left"), this.frame("down-walk-right"));
        this.ensureAnim(this.animKeys.right, this.frame("right-walk-left"), this.frame("right-walk-right"));

    }

    frame(positionKey) {
        const offset = this.characterPositions?.[positionKey] ?? 0;
        return this.sourceIndex + offset;
    }
}