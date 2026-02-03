import { Scene } from 'phaser';

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

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        // this.load.image('background', 'assets/bg.png');

        this.load.image("terrain", "../../../assets/terrain.png");
        this.load.image("decorations", "../../../assets/decorations.png");
        this.load.image("characters", "../../../assets/characters.png", {
            frameWidth: 16,
            frameHeight: 16
        });
    }

    create ()
    {
         const player = this.physics.add.sprite(100, 100, "player");
         player.setCollideWorldBounds(true);

         this.scene.start('Preloader');
    }
}
