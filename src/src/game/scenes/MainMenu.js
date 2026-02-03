import { Scene } from 'phaser';

// Import your matrices (same as your JS variables)
import {
  l_Terrain,
  l_Front_Renders,
  l_Trees_1,
  l_Trees_2,
  l_Trees_3,
  l_Trees_4,
  l_Landscape_Decorations,
  l_Landscape_Decorations_2,
  l_Houses,
  l_House_Decorations,
  l_Characters,
  collisions
} from "./mapData/index.js";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  preload() {
  }

  create() {
    const TILE = 16;

    const layersData = {
      l_Terrain,
      l_Front_Renders,
      l_Trees_1,
      l_Trees_2,
      l_Trees_3,
      l_Trees_4,
      l_Landscape_Decorations,
      l_Landscape_Decorations_2,
      l_Houses,
      l_House_Decorations,
      l_Characters
    };

    const tilesets = {
      l_Terrain: "terrain",
      l_Front_Renders: "decorations",
      l_Trees_1: "decorations",
      l_Trees_2: "decorations",
      l_Trees_3: "decorations",
      l_Trees_4: "decorations",
      l_Landscape_Decorations: "decorations",
      l_Landscape_Decorations_2: "decorations",
      l_Houses: "decorations",
      l_House_Decorations: "decorations",
      l_Characters: "characters"
    };


    // Render layers
    this.tileLayers = {};
    const toPhaserData = (m) => m.map(row => row.map(v => (v === 0 ? -1 : v - 1)));

    for (const [layerName, matrix] of Object.entries(layersData)) {
      const map = this.make.tilemap({
          data: toPhaserData(matrix),
          tileWidth: TILE,
          tileHeight: TILE,
      });
      
      const tilesetKey = tilesets[layerName];
      const tileset = map.addTilesetImage(tilesetKey, null, TILE, TILE);

      const layer = map.createLayer(0, tileset, 0, 0);
      this.tileLayers[layerName] = layer;
    }

    this.textures.get("characters").add(
      "char0",
      0,
      0, 0,
      16, 16
    );

    this.textures.get("characters").add(
      "char1",
      0,
      0, 16,
      16, 16
    );

    // PLAYER
    this.player = this.physics.add.sprite(100, 100, tilesets.l_Characters, "char0");

    this.npc = this.physics.add.sprite(200, 200, tilesets.l_Characters, "char1");
    this.npc.setCollideWorldBounds(true)

    this.time.addEvent({
    delay: 1000,
    loop: true,
    callback: () => {

        const randomDirection = Phaser.Math.Between(0, 3);
        const speed = 100;  // Movement speed

        switch (randomDirection) {
            case 0:
                this.npc.setVelocityY(-speed); // Move up
                break;
            case 1:
                this.npc.setVelocityY(speed); // Move down
                break;
            case 2:
                this.npc.setVelocityX(-speed); // Move left
                break;
            case 3:
                this.npc.setVelocityX(speed); // Move right
                break;
        }
    }
});

    this.player.setCollideWorldBounds(true);

    // COLLISIONS: create a collision tilemap layer from collisions matrix
    const collisionMap = this.make.tilemap({
      data: collisions,
      tileWidth: TILE,
      tileHeight: TILE
    });

    const dummyTileset = collisionMap.addTilesetImage("terrain");
    const collisionLayer = collisionMap.createLayer(0, dummyTileset, 0, 0);


    // If collisions are 0/1, then tile index 1 is the solid tile.
    collisionLayer.setCollision(1);

    // Make collision layer invisible
    collisionLayer.setAlpha(0);

    this.physics.add.collider(this.player, collisionLayer);
    this.physics.add.collider(this.npc, collisionLayer)

    // INPUT
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D");

    // CAMERA
    // this.cameras.main.startFollow(this.player);
  }

  update() {
    const speed = 120;
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    this.player.setVelocity(0);

    if (left) this.player.setVelocityX(-speed);
    else if (right) this.player.setVelocityX(speed);

    if (up) this.player.setVelocityY(-speed);
    else if (down) this.player.setVelocityY(speed);
  }
}
