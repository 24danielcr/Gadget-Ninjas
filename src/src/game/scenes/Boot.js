import { Scene } from 'phaser';

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
        this.load.spritesheet("characters", "../../../assets/characters/CGabrielChars24x24.png", {
            frameWidth: 24,
            frameHeight: 24
        });
        
        this.load.spritesheet("exclamationMark", "../../../assets/exclamationmark.png", {
            frameWidth: 17,
            frameHeight: 17
        });

        this.load.spritesheet("characters_face", "../../../assets/characters/CGabrielFaces48x48.png", {
            frameWidth: 48,
            frameHeight: 48
        });

    //     this.load.json('characters_data', new URL('../characters/data/characters.json', import.meta.url).href);
        this.load.json('characters_data', '/assets/characters/data/characters.json');
        this.load.json('characters_positions', '/assets/characters/data/positions.json');
    }

    create ()
    {
         // const player = this.physics.add.sprite(100, 100, "player");
         // player.setCollideWorldBounds(true);

         this.scene.start('Preloader');
    }
}
