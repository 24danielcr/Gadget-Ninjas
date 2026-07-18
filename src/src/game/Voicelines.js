const STORAGE_KEY = 'gn:voicelineVolume';

let voicelineVolume = readStoredVolume();
let currentVoiceline = null;

function readStoredVolume() {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const value = raw === null ? 1 : parseFloat(raw);
    return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
}

export function getVoicelineVolume() {
    return voicelineVolume;
}

export function setVoicelineVolume(value) {
    voicelineVolume = Math.min(1, Math.max(0, value));
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(voicelineVolume));
    }
    if (currentVoiceline) {
        currentVoiceline.setVolume(voicelineVolume);
    }
}

export function registerVoiceline(sound) {
    currentVoiceline = sound;
    if (sound) {
        sound.setVolume(voicelineVolume);
    }
}

export function clearVoiceline(sound) {
    if (currentVoiceline === sound || !sound) {
        currentVoiceline = null;
    }
}
