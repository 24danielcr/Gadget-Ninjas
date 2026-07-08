import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { GameScreen } from './scenes/GameScreen';
import { Dialogue } from './scenes/Dialogue';
import { PauseMenu } from './scenes/PauseMenu';
import Phaser, { Physics } from 'phaser';
import { Preloader } from './scenes/Preloader';

const config = {
    type: Phaser.AUTO,
    width: 448,
    height: 448,
    parent: 'game-container',
    pixelArt: true,
    antialias: false,
    physics: {
        default: "arcade",
        arcade: { debug: false }
    },
    scale: {
        mode: Phaser.Scale.NONE,
        zoom: 2,
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        GameScreen,
        Game,
        GameOver,
        Dialogue,
        PauseMenu,
    ]
};

const StartGame = (parent) => {

    return new Phaser.Game({ ...config, parent });

}

export default StartGame;
