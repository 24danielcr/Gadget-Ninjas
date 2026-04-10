import { Scene } from 'phaser';
import { GameMap } from "../map/GameMap.js"
import { Player } from "../characters/Player.js"
import { NPC } from "../characters/NPC.js"
import { InteractionManager } from "../InteractionManager.js"
import { MissionManager } from '../MissionManager.js';

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

    const charactersData = this.cache.json.get("characters_data")?.characters;
    
    const charactersPositions = this.cache.json.get("characters_positions")?.positions;

    const missions = this.cache.json.get("missions");

    const missionsOrder = this.cache.json.get("missions_order")?.missions_order;
    
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
    this.player = new Player(this, "charles", charactersData, charactersPositions, tilesets.l_Characters, charTile, 120, collisionLayer, 100, 100);
    //this.player = new Player(this, "charles", charactersData.characters, tilesets.l_Characters, 0, charTile, 60, collisionLayer, 100, 100);

    // NPC
    this.npc = new NPC(this, "theo_brook", charactersData, charactersPositions, tilesets.l_Characters, charTile, 60, collisionLayer, 284, 72, true);
    this.npc2 = new NPC(this, "luna_reed", charactersData, charactersPositions, tilesets.l_Characters, charTile, 60, collisionLayer, 246, 68, true);

    this.npc3 = new NPC(this, "jasper_fern", charactersData, charactersPositions, tilesets.l_Characters, charTile, 60, collisionLayer, 142, 395, false);

    this.npc4 = new NPC(this, "bob", charactersData, charactersPositions, tilesets.l_Characters, charTile, 40, collisionLayer, 391, 43, false);

    this.npc5 = new NPC(this, "roy_ashwood", charactersData, charactersPositions, tilesets.l_Characters, charTile, 40, collisionLayer, 103, 330, false);

    this.npc6 = new NPC(this, "ivy_grant", charactersData, charactersPositions, tilesets.l_Characters, charTile, 40, collisionLayer, 377, 217, false);
    this.npc7 = new NPC(this, "eli_carter", charactersData, charactersPositions, tilesets.l_Characters, charTile, 40, collisionLayer, 404, 217, false);

    this.npc8 = new NPC(this, "amara_bennet", charactersData, charactersPositions, tilesets.l_Characters, charTile, 40, collisionLayer, 345, 402, false);
    this.npc9 = new NPC(this, "zoe_porter", charactersData, charactersPositions, tilesets.l_Characters, charTile, 40, collisionLayer, 360, 402, false);

    this.physics.add.collider(
      this.player.player,
      this.npc.npc,
      () => {  },
      undefined,
      this
    );

    this.missionManager = new MissionManager(missionsOrder['world_one']);
    // this.missionManager.assignNextMission();

    this.interactionManager = new InteractionManager(this, this.player, charactersData, missions, this.missionManager);
    [
      // this.npc,
      // this.npc2,
      this.npc3,
      // this.npc4,
      this.npc5,
      this.npc6,
      this.npc7,
      this.npc8,
      this.npc9
    ].forEach(npc => this.interactionManager.addNPC(npc));

    this.interactionManager.addInteraction({
      name: "bob_mission_giver",
      participants: [this.npc4],
      zone: this.add.zone(391, 52, 80, 80),
      repeatable: true,
      dialogueName: "mission_giver",
      isMissionGiver: true
    });

    this.interactionManager.addInteraction({
      name: "theo_luna_duo",
      participants: [this.npc, this.npc2],
      zone: this.add.zone(265, 70, 80, 80),
      repeatable: true,
      dialogueName: "webcam"
    });

    this.interactionManager.addInteraction({
      name: "jasper_fern_solo",
      participants: [this.npc3],
      zone: this.add.zone(141, 398, 40, 40),
      repeatable: true,
      dialogueName: "headphones"
    });

    this.interactionManager.addInteraction({
      name: "roy_ashwood_solo",
      participants: [this.npc5],
      zone: this.add.zone(106, 337, 40, 40),
      repeatable: true,
      dialogueName: "smart_watch"
    });

    this.interactionManager.addInteraction({
      name: "eli_ivy_duo",
      participants: [this.npc6, this.npc7],
      zone: this.add.zone(392, 219, 40, 40),
      repeatable: true,
      dialogueName: "printer"
    });

    this.interactionManager.addInteraction({
      name: "amara_zoe_duo",
      participants: [this.npc8, this.npc9],
      zone: this.add.zone(351, 410, 40, 40),
      repeatable: true,
      dialogueName: "digital_camera"
    });

      // this.input.on('pointermove', (pointer) => {
      //   // pointer.x / pointer.y are canvas coordinates
      //   // pointer.worldX / worldY give world coordinates with cameras
      //   console.log(`x=${pointer.x}, y=${pointer.y}`);
      // });

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
    this.interactionManager.update();
    // this.player.setInteraction(anyOverlap);

    this.player.playerMovement();

    // this.player.playerInteraction();

    // this.pauseScene(anyOverlap);
  }
}
