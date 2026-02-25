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

    const tilesets_depth = {
      l_Terrain: 0,
      l_Front_Renders: 1,
      l_Trees_1: 10,
      l_Trees_2: 10,
      l_Trees_3: 10,
      l_Trees_4: 10,
      l_Landscape_Decorations: 0,
      l_Landscape_Decorations_2: 0,
      l_Houses: 9,
      l_House_Decorations: 10,
      l_Characters: 8
    };

    const charactersData = this.cache.json.get("characters_data")
    
    // Render layers
    const gameMap = new GameMap(this, layersData, tilesets, tilesets_depth, mapTile);

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
    this.player = new Player(this, "charles", charactersData.characters, tilesets.l_Characters, charTile, 60, collisionLayer, 100, 100);
    //this.player = new Player(this, "charles", charactersData.characters, tilesets.l_Characters, 0, charTile, 60, collisionLayer, 100, 100);

    // NPC
    this.npc = new NPC(this, "theo_brook", charactersData.characters,  tilesets.l_Characters, charTile, 60, collisionLayer, 200, 200);

    this.npc2 = new NPC(this, "talia_carter", charactersData.characters, tilesets.l_Characters, charTile, 60, collisionLayer, 500, 500);

    this.npc3 = new NPC(this, "archer_solen", charactersData.characters, tilesets.l_Characters, charTile, 60, collisionLayer, 300, 500);

    

    this.physics.add.collider(
      this.player.player,
      this.npc.npc,
      () => {  },
      undefined,
      this
    );

    // this.physics.add.overlap(this.player.player, this.npc.interactionZone, () => {
    //   this.npc.setPlayerInteraction(true);
    //   this.player.setInteraction(true);
    // });

    // this.physics.add.overlap(this.player.player, this.npc2.interactionZone, () => {
    //   this.npc2.setPlayerInteraction(true);
    //   this.player.setInteraction(true);
    // });

    // this.physics.add.overlap(this.player.player, this.npc3.interactionZone, () => {
    //   this.npc3.setInteraction(true);
    //   this.player.setInteraction(true);
    // });

    // CAMERA
    // this.cameras.main.startFollow(this.player);
  }

  pauseScene(overlap) {
    if (overlap) {
      this.cameras.main.fade(150, 0, 0, 0, false, (_, progress) => {
        if (progress === 1) {
          console.log("yo");
        }
      });
      
    } else {

     this.cameras.main.resetFX();
    }
  }

  update() {
    const overlap1 = this.physics.overlap(this.player.player, this.npc.interactionZone);
    const overlap2 = this.physics.overlap(this.player.player, this.npc2.interactionZone);
    const overlap3 = this.physics.overlap(this.player.player, this.npc3.interactionZone);

    this.npc.setPlayerInteraction(overlap1);
    this.npc2.setPlayerInteraction(overlap2);
    this.npc3.setPlayerInteraction(overlap3);

    const anyOverlap = overlap1 || overlap2 || overlap3;
    this.player.setInteraction(anyOverlap);

    this.player.playerMovement();

    this.player.playerInteraction();
    this.npc.NPCInteraction();
    this.npc2.NPCInteraction();
    this.npc3.NPCInteraction();

    // this.pauseScene(anyOverlap);
  }
}
