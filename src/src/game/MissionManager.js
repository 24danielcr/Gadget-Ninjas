import { EventBus } from './EventBus.js';

export class MissionManager {
    constructor(missionOrder) {

        this.states = Object.freeze({
            idle: "idle",
            active: "active",
            awaiting_quiz: "awaiting_quiz"
        });

        this.currentState = this.states.idle;
        this.missionOrder = missionOrder;
        this.currentMission = null;
        this.completedMissions = new Set();
    }

    assignNextMission() {
        const next = this.missionOrder.find(m => !this.completedMissions.has(m));

        if (next) {
            this.currentMission = next
            this.currentState = this.states.active;
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
    }

    isInQuizPhase() {
        return this.currentState === this.states.awaiting_quiz;
    }
}