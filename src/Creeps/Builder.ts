import { Worker } from "./Worker"

export class Builder extends Worker {
    role = "Builder"

    constructor(creep: Creep) {
        super()
        if (this.retrieveEnergy(creep)) {
            if (creep.room.find(FIND_CONSTRUCTION_SITES).length > 0) {
                // Try to finish a construction site
                const target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES)

                if (target) {
                    if (creep.build(target) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: "#ff7a33" }, reusePath: 5 })
                    }
                }
            } else {
                let controller = creep.room.controller;

                if (controller) {
                    if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(controller, { visualizePathStyle: { stroke: "#ff7a33" }, reusePath: 5})
                    }
                }
            }
        }
    }
}
