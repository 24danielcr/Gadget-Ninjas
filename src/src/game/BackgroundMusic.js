const MUSIC_DIR = '/assets/gamemusic';
const TRACKS = [
    'Kevin MacLeod - Itty Bitty 8 Bit  NO COPYRIGHT 8-bit Music',
    'Kevin MacLeod - Pixelland  NO COPYRIGHT 8-bit Music',
    'Monplaisir - Soundtrack  NO COPYRIGHT 8-bit Music',
];

const trackKey = (name) => `music:${name}`;

let started = false;
let currentTrack = null;

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

        const track = sound.add(trackKey(TRACKS[index]));
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
