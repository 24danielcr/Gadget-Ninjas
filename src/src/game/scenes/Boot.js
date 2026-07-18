import { Scene } from 'phaser';
import { preloadMusic } from '../BackgroundMusic';
import { preloadSoundEffects } from '../SoundEffects';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        this.load.image("terrain", import.meta.env.BASE_URL + "assets/images/terrain.png");
        this.load.image("decorations", import.meta.env.BASE_URL + "assets/images/decorations.png");
        this.load.spritesheet("characters", import.meta.env.BASE_URL + "assets/characters/CGabrielChars24x24.png", {
            frameWidth: 24,
            frameHeight: 24
        });

        this.load.spritesheet("exclamationMark", import.meta.env.BASE_URL + "assets/images/exclamationmark.png", {
            frameWidth: 17,
            frameHeight: 17
        });

        this.load.spritesheet("characters_face", import.meta.env.BASE_URL + "assets/characters/CGabrielFaces48x48.png", {
            frameWidth: 48,
            frameHeight: 48
        });

        this.load.json('characters_data', import.meta.env.BASE_URL + 'assets/characters/data/characters.json');
        this.load.json('characters_positions', import.meta.env.BASE_URL + 'assets/characters/data/positions.json');
        this.load.json('missions', import.meta.env.BASE_URL + 'assets/characters/data/missions.json');
        this.load.json('missions_order', import.meta.env.BASE_URL + 'assets/characters/data/missions_order.json');

        preloadMusic(this);
        preloadSoundEffects(this);
    }

    create ()
    {
         this.scene.start('Preloader');
    }
}
