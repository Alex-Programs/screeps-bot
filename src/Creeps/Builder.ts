import { Worker } from "./Worker"

export class Builder extends Worker {
    role = "Builder"

    constructor(creep: Creep) {
        super()
        if (this.retrieveEnergy(creep)) {
          creep.memory.isIdle = false;

            if (creep.room.find(FIND_CONSTRUCTION_SITES).length > 0 && creep.memory.controllerOnly === false) {
                // Try to finish a construction site
                const target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES)

                if (target) {
                    if (creep.build(target) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: "#ff7a33" }, reusePath: 1 })
                        creep.room.memory.builderTravellingTicks[creep.room.memory.builderTravellingTicks.length -1].buildersTravelling++;
                    }
                }
            } else {
                const controller = creep.room.controller;

                if (controller) {
                    if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(controller, { visualizePathStyle: { stroke: "#ff7a33" }, reusePath: 1 })
                        creep.room.memory.builderTravellingTicks[creep.room.memory.builderTravellingTicks.length -1].buildersTravelling++;
                    } else {
                      creep.room.memory.lastControllerRefresh = creep.room.memory.time;
                    }
                }
            }
        } else {
          creep.memory.isIdle = true;
        }
    }
}
