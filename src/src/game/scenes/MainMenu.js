import { Scene } from 'phaser';
import { GameMap } from "../map/GameMap.js"
import { Player } from "../characters/Player.js"
import { NPC } from "../characters/NPC.js"

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
} from "../map/mapData/index.js";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  preload() {
  }

  create() {
    const mapTile = 16;
    const charTile = 24;

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
    const gameMap = new GameMap(this, layersData, tilesets, mapTile);

    // COLLISIONS: create a collision tilemap layer from collisions matrix
    const collisionMap = this.make.tilemap({
      data: collisions,
      tileWidth: mapTile,
      tileHeight: mapTile
    });

    const dummyTileset = collisionMap.addTilesetImage("terrain");
    const collisionLayer = collisionMap.createLayer(0, dummyTileset, 0, 0);


    // If collisions are 0/1, then tile index 1 is the solid tile.
    collisionLayer.setCollision(1);

    // Make collision layer invisible
    collisionLayer.setAlpha(0);


    // PLAYER
    this.player = new Player(this, "char0", tilesets.l_Characters, 0, charTile, 60, collisionLayer, 100, 100);

    // NPC
    this.npc = new NPC(this, "char1", tilesets.l_Characters, 1, charTile, 60, collisionLayer, 200, 200);

    this.npc2 = new NPC(this, "char2", tilesets.l_Characters, 2, charTile, 60, collisionLayer, 500, 500);

    this.npc2 = new NPC(this, "char3", tilesets.l_Characters, 3, charTile, 60, collisionLayer, 300, 500);

    this.physics.add.collider(
      this.player.player,
      this.npc.npc,
      () => console.log("collision"),
      undefined,
      this
    );

    // CAMERA
    // this.cameras.main.startFollow(this.player);
  }

  update() {
    this.player.playerMovement()
  }
}
