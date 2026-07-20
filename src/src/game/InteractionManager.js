import Phaser from 'phaser';
import { EventBus } from './EventBus.js';

// How far above an NPC's centre the "talk to me" marker floats.
const MARKER_OFFSET_Y = 20;
const MARKER_BOB = 4;

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
    this.prompt = null;

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

    const group = {
      name,
      participants,
      zone,
      repeatable,
      dialogueName,
      isMissionGiver,
      consumed: false
    };

    this.groups.push(group);
    this.createMarker(group);
  }

  // Every interactable group carries its own marker so the player can spot who
  // to talk to from anywhere on the map, not only once they're standing in the zone.
  createMarker(group) {
    group.marker = this.scene.add
      .sprite(0, 0, "exclamationMark", 0)
      .setVisible(false)
      .setDepth(1000);

    group.bob = { offset: 0 };
    group.bobTween = this.scene.tweens.add({
      targets:  group.bob,
      offset:   -MARKER_BOB,
      duration: 650,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    });
  }

  markerAnchor(group) {
    const sprites = group.participants.map(p => p?.npc).filter(Boolean);
    if (!sprites.length) return null;

    return {
      x: sprites.reduce((sum, sprite) => sum + sprite.x, 0) / sprites.length,
      y: Math.min(...sprites.map(sprite => sprite.y))
    };
  }

  updateMarker(group, visible, inRange) {
    const marker = group.marker;
    if (!marker) return;

    const anchor = visible ? this.markerAnchor(group) : null;
    if (!anchor) {
      marker.setVisible(false);
      return;
    }

    marker.setPosition(anchor.x, anchor.y - MARKER_OFFSET_Y + group.bob.offset);
    marker.setScale(inRange ? 1.3 : 1);
    marker.setAlpha(inRange ? 1 : 0.7);
    marker.setVisible(true);
  }

  ensurePrompt() {
    if (this.prompt) return;
    this.prompt = this.scene.add
      .text(0, 0, 'Press E', {
        fontFamily: 'Arial',
        fontSize: '9px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.75)',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setVisible(false)
      .setDepth(1001);
  }

  updatePrompt(visible) {
    if (!this.prompt) return;
    this.prompt.setPosition(this.player.player.x, this.player.player.y - this.player.tileSize / 2);
    this.prompt.setVisible(visible);
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

  update() {
    this.ensurePrompt();
    let anyOverlap = false;
    let dialogueTriggered = false;

    const states = this.groups.map(group => {
      const available = !group.consumed && (group.isMissionGiver
        ? this.missionManager.isMissionGiverAvailable()
        : this.missionManager.isAvailable(group.dialogueName));

      const overlap = available && this.scene.physics.overlap(this.player.player, group.zone);

      if (overlap) {
        anyOverlap = true;

        if (!dialogueTriggered && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
          this.launchDialogue(group);
          dialogueTriggered = true;
        }
      }

      return { group, available, overlap };
    });

    states.forEach(({ group, available, overlap }) =>
      this.updateMarker(group, available, overlap)
    );

    this.updatePrompt(anyOverlap && !dialogueTriggered);
    return anyOverlap && !dialogueTriggered;
  }

  destroy() {
    EventBus.off('mission-accepted',   this._onMissionAccepted);
    EventBus.off('mission-npc-talked', this._onMissionNpcTalked);
    EventBus.off('mission-complete',   this._onMissionComplete);

    this.groups.forEach(group => {
      group.bobTween?.stop();
      group.bobTween = null;
      group.marker?.destroy();
      group.marker = null;
    });

    this.prompt?.destroy();
    this.prompt = null;
  }
}
