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
        this.load.image("terrain", "/assets/images/terrain.png");
        this.load.image("decorations", "/assets/images/decorations.png");
        this.load.spritesheet("characters", "/assets/characters/CGabrielChars24x24.png", {
            frameWidth: 24,
            frameHeight: 24
        });

        this.load.spritesheet("exclamationMark", "/assets/images/exclamationmark.png", {
            frameWidth: 17,
            frameHeight: 17
        });

        this.load.spritesheet("characters_face", "/assets/characters/CGabrielFaces48x48.png", {
            frameWidth: 48,
            frameHeight: 48
        });

        this.load.json('characters_data', '/assets/characters/data/characters.json');
        this.load.json('characters_positions', '/assets/characters/data/positions.json');
        this.load.json('missions', '/assets/characters/data/missions.json');
        this.load.json('missions_order', '/assets/characters/data/missions_order.json');

        preloadMusic(this);
        preloadSoundEffects(this);
    }

    create ()
    {
         this.scene.start('Preloader');
    }
}
