const SFX_DIR = '/assets/soundfx';

const EFFECTS = [
    'open_dialogue',
    'close_dialogue',
    'open_menu',
    'close_menu',
    'play_playagain',
    'menu_button_press',
    'open_close_mission_button',
];

const sfxKey = (name) => `sfx:${name}`;

export function preloadSoundEffects(scene) {
    for (const name of EFFECTS) {
        const key = sfxKey(name);
        if (!scene.cache.audio.exists(key)) {
            scene.load.audio(key, `${SFX_DIR}/${name}.wav`);
        }
    }
}

export function playSfx(scene, name, config = {}) {
    if (!scene || !scene.sound) return;
    const key = sfxKey(name);
    if (!scene.cache.audio.exists(key)) return;
    scene.sound.play(key, { volume: 0.6, ...config });
}
