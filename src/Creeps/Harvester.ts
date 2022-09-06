export class Harvester {
  role = "Harvester";

  constructor(creep: Creep) {
    let targetID = creep.memory.targetID;

    if (targetID) {
      let source = Game.getObjectById(targetID);

      // Attempt to harvest. If not in range, move to it.
      if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        // Move to it
        creep.moveTo(source.pos.x, source.pos.y, { visualizePathStyle: { stroke: "#ff7a33" }})
      }
    }
  }
}
