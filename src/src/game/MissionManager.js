export class MissionManager {
    constructor(missionOrder) {
        this.missionOrder = missionOrder;
        this.currentMission = null;
        this.completedMissions = new Set();
    }

    assignNextMission() {
        const next = this.missionOrder.find(m => !this.completedMissions.has(m));

        if (next) {
            this.currentMission = next
        }

        return next ?? null;
    }

    isAvailable(mission) {
        return this.currentMission === mission;
    }

    completeMission(mission) {
        if (this.isAvailable(mission)) {
            this.completedMissions.add(mission);
            this.currentMission = null;
        }
    }

    isMissionGiverAvailable() {
        return this.currentMission === null && this.missionOrder.some(m => !this.completedMissions.has(m));
    }
}