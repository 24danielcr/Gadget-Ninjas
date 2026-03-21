import Phaser from 'phaser';

export class InteractionManager {
  constructor(scene, player, charactersData, missions) {
    this.scene = scene;
    this.player = player;
    this.charactersData = charactersData;
    this.missions = missions;
    this.npcs = [];
    this.groups = [];
    this.interactKey = scene.input.keyboard.addKey('E');
    this.interactionIcon = null;
  }

  addNPC(npc) {
    // const range = npc.interactionRange || (npc.tileSize ? npc.tileSize * 1.5 : 32);
    // const zone = this.scene.add.zone(npc.npc.x, npc.npc.y, range, range);
    // this.scene.physics.add.existing(zone);
    // zone.body.setAllowGravity(false);
    // zone.body.setImmovable(true);
    // npc.interactionZone = zone;
    this.npcs.push(npc);
  }

  addInteraction({ name, participants, zone, repeatable = false, dialogueName }) {
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
      consumed: false
    });
  }

  launchDialogue(group) {
    const npcData = this.charactersData?.[group.participants[0].npcName];
    // const playerData = this.charactersData?.[this.player.playerName];
    const npcSourceIndex = npcData?.faceSourceIndex ?? 0;

    const mission = this.missions[group.dialogueName];
    // const playerSourceIndex = playerData?.faceSourceIndex ?? 0;

    this.scene.scene.pause(this.scene.scene.key);
    this.scene.scene.launch('Dialogue', {
      group,
      npcSourceIndex,
      mission
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
    let npcToTalk = null;

    this.groups.forEach(group => {
      if (group.consumed) return;

      const overlap = this.scene.physics.overlap(this.player.player, group.zone);
      if (!overlap) return;

      anyOverlap = true;

      if (!dialogueTriggered && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.launchDialogue(group);
        // const npcName = group.dialogueName ?? group.participants?.[0]?.npcName;
        // if (npcName) {
        //   this.launchDialogue(npcName);
        //   dialogueTriggered = true;
        //   if (!group.repeatable) {
        //     group.consumed = true;
        //   }
        // }
      }
    });

    // this.npcs.forEach(npc => {
    //   if (npc.interactionZone) {
    //     npc.interactionZone.setPosition(npc.npc.x, npc.npc.y);
    //   }

    //   const overlap = this.scene.physics.overlap(this.player.player, npc.interactionZone);
    //   if (overlap && !dialogueTriggered) {
    //     anyOverlap = true;
    //     npcToTalk = npc;
    //   }
    // });

    // if (!dialogueTriggered && npcToTalk && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
    //   this.launchDialogue(npcToTalk.npcName);
    //   dialogueTriggered = true;
    // }

    this.updateIcon(anyOverlap && !dialogueTriggered);
    return anyOverlap && !dialogueTriggered;
  }
}
