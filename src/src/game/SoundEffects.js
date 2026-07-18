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

const STORAGE_KEY = 'gn:sfxVolume';

let sfxVolume = readStoredVolume();

function readStoredVolume() {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const value = raw === null ? 0.6 : parseFloat(raw);
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.6;
}

export function getSfxVolume() {
    return sfxVolume;
}

export function setSfxVolume(value) {
    sfxVolume = Math.min(1, Math.max(0, value));
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(sfxVolume));
    }
}

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
    scene.sound.play(key, { volume: sfxVolume, ...config });
}
