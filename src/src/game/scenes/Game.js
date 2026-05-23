import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
