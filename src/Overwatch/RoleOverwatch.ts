import {getAccessibleFaces} from "utils/GetAccessibleFaces";
import {Harvester} from "../Creeps/Harvester";
import {drop} from "lodash";

export class RoleOverwatch {
  constructor(room: Room) {
    // Collect data. "Borrowed" from Solon's code.
    const spawnEnergy = room.energyAvailable;
    const maxEnergy = room.energyCapacityAvailable;

    const sources: Source[] = room.find(FIND_SOURCES)

    const harvesters: Creep[] = _.filter(room.find(FIND_MY_CREEPS), creep => creep.memory.role === "Harvester")
    const distributors: Creep[] = _.filter(room.find(FIND_MY_CREEPS), creep => creep.memory.role === "Distributor")
    const builders: Creep[] = _.filter(room.find(FIND_MY_CREEPS), creep => creep.memory.role === "Builder")
    const spawn: StructureSpawn = room.find(FIND_MY_SPAWNS)[0]

    // TODO rewrite roleOverwatch to make it dependent on need:
    //  Energy reserves not being used AND opportunity to fix, more harvesters. If a harvester is moving there at the moment, don't make another.
    //  Lots of construction, lots of builders.
    //  Lots of creeps needing to manually get things, lots of distributors.
    //  Controller not being maintained, controller-specific builders

    this.balanceHarvesters(room, sources, harvesters, spawn, spawnEnergy)

    this.balanceControllerBuilders(room, spawn, spawnEnergy)

    this.balanceBuilders(room, spawn, spawnEnergy, builders, sources)

    //this.balanceDistributors(room, spawn, spawnEnergy, builders, distributors)

    //this.balanceSpecificDistributors(room, spawn, spawnEnergy)
  }

  private getGroundEnergy(room: Room): number {
    // Get how much energy is on the ground

  }

  private balanceSpecificDistributors(room: Room, spawn: StructureSpawn, spawnEnergy: number) {
    if (room.memory.lastSpecialDistributorSpawnTime + 30 > room.memory.time) {
      return;
    }

    if (room.memory.time % 2 === 1) {
      return;
    }

    const towers: StructureTower[] = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}})
    const extensions: StructureExtension[] = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_EXTENSION}})
    const storages: StructureStorage[] = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_STORAGE}})
    let totalPercentage = 0;

    for (let i = 0; i < towers.length; i++) {
      totalPercentage = totalPercentage + (towers[i].energy / towers[i].energyCapacity)
    }

    for (let i = 0; i < extensions.length; i++) {
      totalPercentage = totalPercentage + (extensions[i].energy / extensions[i].energyCapacity)
    }

    for (let i = 0; i < storages.length; i++) {
      totalPercentage = totalPercentage + (storages[i].store.getUsedCapacity(RESOURCE_ENERGY) / storages[i].store.getCapacity(RESOURCE_ENERGY))
    }

    const avgPercentage = 100 * (totalPercentage / (towers.length + extensions.length + storages.length))

    if (avgPercentage < 60) {
      const totalDropped = this.getGroundEnergy(room);

      if (totalDropped > 500) {
        const [success, creep] = this.creepGenerator(spawnEnergy, "Distributor")

        if (success && !spawn.spawning) {
          spawn.spawnCreep(creep, "Specific Distributor"
            + Game.time, {
            memory: {
              role: "Distributor",
              disableBuilders: true,
            }
          })
          console.log("Making a distributor because too much on-the-ground energy is not being used")
          room.memory.lastSpecialDistributorSpawnTime = room.memory.time;
        }
      }
    }
  }

  // Reason for not basing logic on "Are the distributors standing still or doing stuff" is they have a habit of continually trying and failing to all
  // do the same task
  private balanceDistributors(room: Room, spawn: StructureSpawn, spawnEnergy: number, builders: Creep[], distributors: Creep[]) {
    if (room.memory.builderTravellingTicks.length > 50) {
      room.memory.builderTravellingTicks.splice(0, 1)
    }

    // Cap
    if (distributors.length > 15) {
      return;
    }

    if (room.memory.lastGeneralDistributorSpawnTime + 30 < room.memory.time) {
      let sumOfPercentages = 0;
      for (let i = 0; i < room.memory.builderTravellingTicks.length; i++) {
        const data = room.memory.builderTravellingTicks[i]

        sumOfPercentages = sumOfPercentages + (data.buildersTravelling / data.totalBuilders)
      }

      const travellingPercent = 100 * (sumOfPercentages / room.memory.builderTravellingTicks.length)
      console.log("Travelling percent: " + travellingPercent)

      if (travellingPercent > 40) {
        const [success, creep] = this.creepGenerator(spawnEnergy, "Distributor")

        if (success && !spawn.spawning) {
          spawn.spawnCreep(creep, "Distributor"
            + Game.time, {
            memory: {
              role: "Distributor",
              disableBuilders: false,
            }
          })
          console.log("Making a distributor because builders are travelling too much")
          room.memory.lastGeneralDistributorSpawnTime = room.memory.time;
        }
      }
    }

    // Make the latest in the records
    room.memory.builderTravellingTicks.push({totalBuilders: builders.length, buildersTravelling: 0})
  }

  private balanceBuilders(room: Room, spawn: StructureSpawn, spawnEnergy: number, builders: Creep[], sources: Source[]) {
    // Track if they're idle...
    let idleAmount = 0;

    for (let i = 0; i < builders.length; i++) {
      if (builders[i].memory.isIdle) {
        idleAmount = idleAmount + 1;
      }
    }

    room.memory.idleBuildingTicks.push((idleAmount / builders.length) * 100)
    if (room.memory.idleBuildingTicks.length > 50) {
      room.memory.idleBuildingTicks.splice(0, 1)
    }

    // Builder cap
    if (builders.length > 40) {
      return;
    }

    // Have we done this in the last 30 ticks?
    if (room.memory.lastBuilderSpawnTime + 30 < room.memory.time) {
      // If they haven't been idle more than 20% of the time in the last 50 ticks...

      let idleSum = 0;
      for (let i = 0; i < room.memory.idleBuildingTicks.length; i++) {
        idleSum = idleSum + room.memory.idleBuildingTicks[i];
      }

      const percentage = idleSum / room.memory.idleBuildingTicks.length

      console.log(percentage + " is the % of idle builders over the last 50 ticks")

      //Get energy on the ground
      const totalDropped = this.getGroundEnergy(room);

      if (percentage <= 30 || (room.controller && room.controller.level * sources.length * 3 < builders.length) || totalDropped > 1000) {
        // Make a builder
        const [success, creep] = this.creepGenerator(spawnEnergy, "Builder")
        if (success && !spawn.spawning) {
          spawn.spawnCreep(creep, "Builder" + Game.time, {
            memory: {
              role: "Builder",
              controllerOnly: false
            }
          })
          console.log("Making a builder because they're too busy/below minimum/too much energy on the ground")
          room.memory.lastBuilderSpawnTime = room.memory.time;
        }
      }
    }
  }

  private balanceControllerBuilders(room: Room, spawn: StructureSpawn, spawnEnergy: number) {
    // Time check for speedup.
    if (room.memory.time % 2 !== 0) {
      return;
    }

    // Check there actually is one
    if (!room.controller) {
      return;
    }

    // Check controller lvl over 1 - don't want this early on
    if (room.controller.level < 2) {
      return;
    }

    // Is room controller being neglected
    if (room.memory.lastControllerRefresh + 120 < room.memory.time) {
      // Is there already an allocated one?
      const existingAmount: number = _.filter(room.find(FIND_MY_CREEPS), creep => creep.memory.role === "Builder" && creep.memory.controllerOnly === true).length

      if (existingAmount > 0) {
        return;
      }

      const [success, creep] = this.creepGenerator(spawnEnergy, "Builder")
      if (success && !spawn.spawning) {
        // Create one
        spawn.spawnCreep(creep, "Controller Only Builder" + Game.time, {
          memory: {
            role: "Builder",
            controllerOnly: true
          }
        })
        console.log("Making a controller only builder because it's being neglected")
      }
    }
  }

  // TODO also make it regen immediately when one dies
  private balanceHarvesters(room: Room, sources: Source[], harvesters: Creep[], spawn: StructureSpawn, spawnEnergy: number): void {
    function getSourceMemory(source: Source): SourceMemory | null {
      for (let i = 0; i < room.memory.sourceMemories.length; i++) {
        if (room.memory.sourceMemories[i].srcID === source.id) {
          return room.memory.sourceMemories[i]
        }
      }

      return null;
    }

    // Track mining rate...
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i]
      const memory: SourceMemory | null = getSourceMemory(source)

      if (!memory) {
        room.memory.sourceMemories.push({srcID: source.id, lastEnergy: source.energy, avgEnergyDrop: -1})
        continue
      }

      if (memory.lastEnergy === 0) {
        memory.lastEnergy = source.energy;
        continue
      }

      const energyDrop = Math.abs(memory.lastEnergy - source.energy)

      if (memory.avgEnergyDrop === -1) {
        memory.avgEnergyDrop = energyDrop;
      } else {
        const difference = energyDrop - memory.avgEnergyDrop;
        memory.avgEnergyDrop = memory.avgEnergyDrop + (difference / 20)
      }

      memory.lastEnergy = source.energy;

      for (let j = 0; j < room.memory.sourceMemories.length; j++) {
        if (room.memory.sourceMemories[j].srcID === source.id) {
          room.memory.sourceMemories[j] = memory;
        }
      }

      // Is mining rate below optimal? (Optimal is 3000/300, aka 10). Also a time requirement
      if (memory.avgEnergyDrop < 10 && room.memory.time % 5 === 0) {
        // Is there already a harvester going there? Also get count assigned to it
        let alreadyOne = false;
        let harvesterCount = 0;

        for (let j = 0; j < harvesters.length; j++) {
          const harvester: Creep = harvesters[j]
          if (harvester.memory.targetID === source.id) {
            if (!alreadyOne && harvester.memory.movingTowardsTarget) {
              alreadyOne = true;
            }

            harvesterCount = harvesterCount + 1;
          }
        }

        if (!alreadyOne) {
          // Would a new one even have somewhere to go?
          const faceCount: number = getAccessibleFaces(source.pos).length
          if (harvesterCount < faceCount) {
            const [success, creep] = this.creepGenerator(spawnEnergy, "Harvester")

            if (success && !spawn.spawning) {
              spawn.spawnCreep(creep, "Harvester" + Game.time, {
                memory: {
                  role: "Harvester",
                  targetID: source.id
                }
              })
              console.log("Making a harvester because the current setup is suboptimal")
              return
            }
          }
        }
      }
    }
  }

  private creepGenerator(energy: number, name: string): [boolean, BodyPartConstant[]] {
    let budget: number;
    const body: BodyPartConstant[] = [];

    switch (name) {
      case "Harvester":
        // Over 749 we're assuming you really don't need the ability to move fast
        if (energy > 749) {
          budget = Math.floor((energy - 100) / 100)
          for (let i = 0; i < budget; i++) {
            body.push(WORK)
          }

          body.push(MOVE)
          body.push(MOVE)
        }

        // lvl 2. Takes 500 energy, needs roads
        if (energy > 499) {
          return [true, [WORK, WORK,
            WORK, WORK,
            MOVE, MOVE]]
        }

        // Base. Takes 250 energy, needs roads
        if (energy > 299) {
          return [true, [WORK, WORK, MOVE]]
        }

        return [false, []]

      case "Distributor":
        // Doesn't need roads
        budget = Math.floor(energy / 100)

        if (budget < 2) {
          return [false, []]
        }

        for (let i = 0; i < budget; i++) {
          body.push(MOVE)
          body.push(CARRY)
        }

        return [true, body];

      case "Builder":
        budget = Math.floor(energy / 200)

        if (budget < 1) {
          return [false, []]
        }

        for (let i = 0; i < budget; i++) {
          body.push(MOVE)
          body.push(WORK)
          body.push(CARRY)
        }

        return [true, body];

      default:
        return [false, []]
    }
  }
}
