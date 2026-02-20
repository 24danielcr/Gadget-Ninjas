import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { MainMenu } from './scenes/MainMenu';
import { Dialogue } from './scenes/Dialogue';
import Phaser, { Physics } from 'phaser';
import { Preloader } from './scenes/Preloader';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
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
   // backgroundColor: '#024af8',
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Game,
        GameOver,
        Dialogue,
    ]
};

const StartGame = (parent) => {

    return new Phaser.Game({ ...config, parent });

}

export default StartGame;
