import { EventBus } from './EventBus.js';

const STORAGE_KEY = 'gadget-ninjas-progress';
const STORAGE_TTL = 60 * 60 * 1000;

export class MissionManager {
    constructor(missionOrder) {

        this.states = Object.freeze({
            idle: "idle",
            active: "active",
            awaiting_quiz: "awaiting_quiz"
        });

        this.missionOrder = missionOrder;
        this.currentState = this.states.idle;
        this.currentMission = null;
        this.completedMissions = new Set();

        this.load();
    }

    save() {
        try {
            const data = {
                currentState: this.currentState,
                currentMission: this.currentMission,
                completedMissions: [...this.completedMissions],
                savedAt: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save progress', e);
        }
    }

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            const data = JSON.parse(raw);

            if (data.savedAt == null || Date.now() - data.savedAt > STORAGE_TTL) {
                MissionManager.clearProgress();
                return;
            }

            this.currentState = data.currentState ?? this.states.idle;
            this.currentMission = data.currentMission ?? null;
            this.completedMissions = new Set(data.completedMissions ?? []);
        } catch (e) {
            console.warn('Failed to load progress', e);
        }
    }

    reset() {
        this.currentState = this.states.idle;
        this.currentMission = null;
        this.completedMissions = new Set();
        MissionManager.clearProgress();
    }

    static clearProgress() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.warn('Failed to clear progress', e);
        }
    }

    assignNextMission() {
        const next = this.missionOrder.find(m => !this.completedMissions.has(m));

        if (next) {
            this.currentMission = next
            this.currentState = this.states.active;
            this.save();
        }

        return next ?? null;
    }

    isAvailable(mission) {
        return (this.currentState === this.states.active || this.currentState === this.states.awaiting_quiz) && this.currentMission === mission;
    }

    completeMission(mission) {
        if (this.isAvailable(mission)) {
            this.completedMissions.add(mission);
            this.currentMission = null;
            this.currentState = this.states.idle;
            this.save();

            if (this.completedMissions.size === this.missionOrder.length) {
                EventBus.emit('all-missions-complete');
            }
        }
    }

    isMissionGiverAvailable() {
        return this.currentState === this.states.idle || this.currentState === this.states.awaiting_quiz;
    }

    markNpcTalked() {
        this.currentState = this.states.awaiting_quiz;
        this.save();
    }

    isInQuizPhase() {
        return this.currentState === this.states.awaiting_quiz;
    }
}
