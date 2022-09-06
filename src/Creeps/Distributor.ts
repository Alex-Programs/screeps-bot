import {Worker} from "./Worker";

// This one's going to look similar to Solon's because Solon's is pretty good
export class Distributor extends Worker {
  role = "Distributor"

  constructor(creep: Creep) {
    super()
    if (this.refillSpawn(creep)) {
      if (this.refillExtension(creep)) {
        if (this.refillTowers(creep)) {
          if (this.refillStorage(creep)) {
            if (!creep.memory.disableBuilders) {
              this.refillBuilder(creep)
            }
          }
        }
      }
    }
  }

  refillSpawn(creep: Creep): boolean {
    const spawns = creep.room.find(FIND_MY_SPAWNS);

    const unfilledSpawns = _.filter(spawns, function (i) {
      return i.store[RESOURCE_ENERGY] < 300;
    });

    if (unfilledSpawns.length > 0) {
      const closestSpawn = creep.pos.findClosestByRange(unfilledSpawns)

      // Ensure they have the energy to do so
      if (this.retrieveEnergy(creep)) {
        if (closestSpawn) {
          if (creep.transfer(closestSpawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            // Move to it
            creep.moveTo(closestSpawn, {
              visualizePathStyle: {stroke: "#ff7a33"},
              reusePath: 1,
            })
          }
        }
      }
      return false;
    } else {
      return true;
    }
  }

  refillExtension(creep: Creep): boolean {
    // Find empty extensions
    const extensions: StructureExtension[] = creep.room.find(FIND_MY_STRUCTURES, {
      filter: {structureType: STRUCTURE_EXTENSION}
    })

    const unfilledExtensions = _.filter(extensions, function (i) {
      return i.store[RESOURCE_ENERGY] < 50;
    });

    if (unfilledExtensions.length > 0) {
      if (this.retrieveEnergy(creep)) {
        const closestEmptyExtension = creep.pos.findClosestByRange(unfilledExtensions)

        if (closestEmptyExtension) {
          if (creep.transfer(closestEmptyExtension, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            // Move to it
            creep.moveTo(closestEmptyExtension, {
              visualizePathStyle: {stroke: "#ff7a33"},
              reusePath: 1
            });
          }
        }
      }
      return false;
    } else {
      return true;
    }
  }

  refillTowers(creep: Creep): boolean {
    // I'm tired of half-copying Solon's stuff when it's just changing a few words around, but just enough that generics don't work. Copying from here. Credit https://github.com/1Solon/Aesara-Screeps/blob/7aec34d65e5147748ac865417408abcebd1c8056/src/creeps/Hauler.ts

    // Find empty towers
    const towers: StructureTower[] = creep.room.find(FIND_MY_STRUCTURES, {
      filter: {structureType: STRUCTURE_TOWER}
    });
    const unfilledTowers = _.filter(towers, function (i) {
      return i.store[RESOURCE_ENERGY] < 600;
    });

    // If there are any towers that are not full
    if (unfilledTowers.length > 0) {
      const closestTower = creep.pos.findClosestByRange(unfilledTowers);

      // Make sure the creep has enough energy to achieve this task
      if (this.retrieveEnergy(creep)) {
        // Try to transfer energy to the tower, if not in range
        if (closestTower) {
          if (creep.transfer(closestTower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            // Move to it
            creep.moveTo(closestTower, {
              visualizePathStyle: {stroke: "#ff7a33"},
              reusePath: 1
            });
          }
        }
      }

      return false;
    } else {
      return true;
    }
  }

  refillStorage(creep: Creep): boolean {
    // Find empty Storages
    const storages: StructureStorage[] = creep.room.find(FIND_MY_STRUCTURES, {
      filter: {structureType: STRUCTURE_STORAGE}
    });
    const unfilledStorages = _.filter(storages, function (i) {
      return i.store[RESOURCE_ENERGY] < 1000000;
    });

    // If there are any storages that are not full
    if (unfilledStorages.length > 0) {
      const closestStorage = creep.pos.findClosestByRange(unfilledStorages);

      // Make sure the creep has enough energy to achieve this task
      if (creep.store.energy == 0) {
        // Find energy on the ground
        const droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
          filter: resource => resource.resourceType == RESOURCE_ENERGY && resource.amount > 50
        });

        // Find the closest dropped energy
        const closestDroppedEnergy = creep.pos.findClosestByRange(droppedEnergy);

        // Try to pickup the energy. If it's not in range
        if (closestDroppedEnergy) {
          if (creep.pickup(closestDroppedEnergy) == ERR_NOT_IN_RANGE) {
            // Move to it
            creep.moveTo(closestDroppedEnergy, {
              visualizePathStyle: {stroke: "#ff7a33"},
              reusePath: 1
            });
          }
        }
      } else {
        // Try to transfer energy to the storage, if not in range
        if (closestStorage) {
          if (creep.transfer(closestStorage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            // Move to it
            creep.moveTo(closestStorage, {
              visualizePathStyle: {stroke: "#ff7a33"},
              reusePath: 1
            });
          }
        }
      }
      return false;
    } else {
      return true;
    }
  }

  refillBuilder(creep: Creep): boolean {
    // Find empty workers
    const creeps: Creep[] = creep.room.find(FIND_MY_CREEPS);
    const workers = creeps.filter(function (i) {
      return i.memory.role == "Builder"
    });
    const unfilledBuilders = _.filter(workers, function (i) {
      return i.store[RESOURCE_ENERGY] < i.store.getCapacity();
    });

    // If there are any workers that are not full
    if (unfilledBuilders.length > 0) {
      const closestBuilder = creep.pos.findClosestByRange(unfilledBuilders);

      // Make sure the creep has enough energy to achieve this task
      if (this.retrieveEnergy(creep)) {
        // Try to transfer energy to the worker, if not in range
        if (closestBuilder) {
          if (creep.transfer(closestBuilder, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            // Move to it
            creep.moveTo(closestBuilder, {
              visualizePathStyle: {stroke: "#ff7a33"},
              reusePath: 1
            });
          }
        }
      }
      return false;
    } else {
      return true;
    }
  }
}
