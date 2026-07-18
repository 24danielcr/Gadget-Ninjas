const MUSIC_DIR = import.meta.env.BASE_URL + 'assets/gamemusic';
const TRACKS = [
    'Kevin MacLeod - Itty Bitty 8 Bit  NO COPYRIGHT 8-bit Music',
    'Kevin MacLeod - Pixelland  NO COPYRIGHT 8-bit Music',
    'Monplaisir - Soundtrack  NO COPYRIGHT 8-bit Music',
];

const trackKey = (name) => `music:${name}`;

const STORAGE_KEY = 'gn:musicVolume';

let started = false;
let currentTrack = null;
let musicVolume = readStoredVolume();

function readStoredVolume() {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const value = raw === null ? 0.5 : parseFloat(raw);
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.5;
}

export function getMusicVolume() {
    return musicVolume;
}

export function setMusicVolume(value) {
    musicVolume = Math.min(1, Math.max(0, value));
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(musicVolume));
    }
    if (currentTrack) {
        currentTrack.setVolume(musicVolume);
    }
}

export function preloadMusic(scene) {
    for (const name of TRACKS) {
        const key = trackKey(name);
        if (!scene.cache.audio.exists(key)) {
            scene.load.audio(key, `${MUSIC_DIR}/${encodeURIComponent(name)}.mp3`);
        }
    }
}

export function startMusic(scene) {
    if (started) return;
    started = true;

    const sound = scene.sound;
    let lastIndex = -1;

    const playNext = () => {
        let index = Math.floor(Math.random() * TRACKS.length);
        if (TRACKS.length > 1 && index === lastIndex) {
            index = (index + 1) % TRACKS.length;
        }
        lastIndex = index;

        const track = sound.add(trackKey(TRACKS[index]), { volume: musicVolume });
        currentTrack = track;
        track.once('complete', () => {
            track.destroy();
            playNext();
        });
        track.play();
    };

    if (sound.locked) {
        sound.once('unlocked', playNext);
    } else {
        playNext();
    }
}

export function pauseMusic() {
    if (currentTrack && currentTrack.isPlaying) {
        currentTrack.pause();
    }
}

export function resumeMusic() {
    if (currentTrack && currentTrack.isPaused) {
        currentTrack.resume();
    }
}
