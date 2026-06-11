import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
    }

    preload ()
    {
        // Queue every voiceline referenced by an "audio" field in the mission data.
        // The missions JSON was already loaded by the Boot scene, so it's available here.
        const missionsData = this.cache.json.get('missions');
        const missions = missionsData?.missions ?? {};
        const queued = new Set();

        for (const mission of Object.values(missions)) {
            for (const line of mission.dialogue ?? []) {
                if (line.audio && !queued.has(line.audio)) {
                    queued.add(line.audio);
                    this.load.audio(line.audio, `/assets/voicelines/${line.audio}.mp3`);
                }
            }
        }
    }

    create ()
    {
        this.scene.start('MainMenu');
    }
}
