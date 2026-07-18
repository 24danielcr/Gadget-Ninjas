import Phaser from 'phaser';
import { EventBus } from './EventBus.js';

export class InteractionManager {
  constructor(scene, player, charactersData, missions, missionManager) {
    this.scene = scene;
    this.player = player;
    this.charactersData = charactersData;
    this.missions = missions;
    this.missionManager = missionManager;
    this.npcs = [];
    this.groups = [];
    this.interactKey = scene.input.keyboard.addKey('E');
    this.interactionIcon = null;

    this._onMissionAccepted  = () => this.missionManager.assignNextMission();
    this._onMissionNpcTalked = () => this.missionManager.markNpcTalked();
    this._onMissionComplete  = (missionKey) => this.missionManager.completeMission(missionKey);

    EventBus.on('mission-accepted',   this._onMissionAccepted);
    EventBus.on('mission-npc-talked', this._onMissionNpcTalked);
    EventBus.on('mission-complete',   this._onMissionComplete);
  }

  addNPC(npc) {
    this.npcs.push(npc);
  }

  addInteraction({ name, participants, zone, repeatable, dialogueName, isMissionGiver = false }) {
    if (!zone.body) {
      this.scene.physics.add.existing(zone);
      zone.body.setAllowGravity(false);
      zone.body.setImmovable(true);
    }

    this.groups.push({
      name,
      participants,
      zone,
      repeatable,
      dialogueName,
      isMissionGiver,
      consumed: false
    });
  }

  launchDialogue(group) {
    const npcSourceIndexes = group.participants.map(p =>                                                                                                                         
        this.charactersData?.[p.npcName]?.faceSourceIndex ?? 0                                                                                                                     
    );

    let mission, missionKey, quizPhase;
    if (group.isMissionGiver) {
      const nextKey = this.missionManager.missionOrder.find(
          m => !this.missionManager.completedMissions.has(m)
        );
        missionKey = nextKey;

        quizPhase = this.missionManager.isInQuizPhase();
      if (quizPhase) {
        mission = this.missions['missions'][this.missionManager.currentMission];
      } else {
        mission = { dialogue: this.missions['bob_introductions'][nextKey] };
      }
    } else {
      mission = this.missions['missions'][group.dialogueName];
      missionKey = group.dialogueName;
    }

    this.scene.scene.pause(this.scene.scene.key);
    this.scene.scene.launch('Dialogue', {
      group,
      npcSourceIndexes,
      mission,
      isMissionGiver: group.isMissionGiver,
      missionKey,
      quizPhase
    });
    this.scene.scene.bringToTop('Dialogue');
  }

  ensureIcon() {
    if (this.interactionIcon) return;
    const { x, y } = this.player.player;
    this.interactionIcon = this.scene.add
      .sprite(x, y - this.player.tileSize, "exclamationMark", 0)
      .setVisible(false)
      .setDepth(1000);
  }

  updateIcon(anyOverlap) {
    if (!this.interactionIcon) return;
    this.interactionIcon.setPosition(this.player.player.x, this.player.player.y - this.player.tileSize);
    this.interactionIcon.setVisible(anyOverlap);
  }

  update() {
    this.ensureIcon();
    let anyOverlap = false;
    let dialogueTriggered = false;

    this.groups.forEach(group => {
      if (group.consumed) return;

      const overlap = this.scene.physics.overlap(this.player.player, group.zone);
      const allowed = group.isMissionGiver
        ? this.missionManager.isMissionGiverAvailable()
        : this.missionManager.isAvailable(group.dialogueName);

      if (!overlap || !allowed) return;

      anyOverlap = true;

      if (!dialogueTriggered && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.launchDialogue(group);
        dialogueTriggered = true;
      }
    });

    this.updateIcon(anyOverlap && !dialogueTriggered);
    return anyOverlap && !dialogueTriggered;
  }

  destroy() {
    EventBus.off('mission-accepted',   this._onMissionAccepted);
    EventBus.off('mission-npc-talked', this._onMissionNpcTalked);
    EventBus.off('mission-complete',   this._onMissionComplete);
  }
}
