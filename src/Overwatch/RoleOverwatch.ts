import { getAccessibleFaces } from "utils/GetAccessibleFaces";

export class RoleOverwatch {
  constructor(room: Room) {
    // Collect data. "Borrowed" from Solon's code.
    const spawnEnergy = room.energyAvailable;
    const maxEnergy = room.energyCapacityAvailable;

    const sources: Source[] = room.find(FIND_SOURCES)

    const harvesters: Creep[] = _.filter(room.find(FIND_MY_CREEPS), creep => creep.memory.role == "Harvester")
    const distributors: Creep[] = _.filter(room.find(FIND_MY_CREEPS), creep => creep.memory.role == "Distributor")
    const builders: Creep[] = _.filter(room.find(FIND_MY_CREEPS), creep => creep.memory.role == "Builder")
    const spawn = room.find(FIND_MY_SPAWNS)[0]

    // Every harvester should have a distributor. TODO variable amounts based on average time between spawn and harvesters
    if (distributors.length < (harvesters.length * 2) + (builders.length / 2)) {
      spawn.spawnCreep(this.creepGenerator(spawnEnergy, "Distributor"), "Distributor " + Math.random() + ":" + Game.time, { memory: { role: "Distributor" } });
    }

    if (distributors.length > 4 && room.controller && room.controller.level > 2) {
      let amountOfBuildersDisabled = 0

      for (const i in distributors) {
        if (distributors[i].memory.disableBuilders) {
          amountOfBuildersDisabled++;
        }
      }

      const amountOfBuildersDisabledRequired = Math.floor(distributors.length / 3)

      if (amountOfBuildersDisabledRequired > amountOfBuildersDisabled) {
        spawn.spawnCreep(this.creepGenerator(spawnEnergy, "Distributor"), "Distributor - No Builders -" + Math.random() + ":" + Game.time, { memory: { role: "Distributor", disableBuilders: true } });
      }
    }

    // TODO make this based on how quickly the source is depleted
    // Go over each source
    for (const i in sources) {
      const source = sources[i]

      // Get how many harvesters and work units there are
      let harvesterCount = 0;
      let workUnitCount = 0;

      for (const j in harvesters) {
        const harvester = harvesters[j]

        if (harvester.memory.targetID === source.id) {
          harvesterCount++;

          for (let w = 0; w < harvester.body.length; w++) {
            const part = harvester.body[w].type
            if (part === "work") {
              workUnitCount++;
            }
          }
        }
      }

      const faceCount: number = getAccessibleFaces(source.pos).length

      if (harvesterCount < faceCount && workUnitCount * 2 < 10) {
        if (spawnEnergy >= 300) {
          spawn.spawnCreep(this.creepGenerator(spawnEnergy, "Harvester"), "Harvester" + Math.random() + ":" + Game.time, { memory: { role: "Harvester", targetID: source.id}})
        }
      }
    }

    if (harvesters.length >= 2 && room.controller) {
      // TODO modify this based on if the existing builders are actually getting energy
      const buildersTarget = Math.ceil(sources.length * room.controller.level * 2)

      if (builders.length < buildersTarget) {
        console.log("Making builder")
        spawn.spawnCreep(this.creepGenerator(spawnEnergy, "Builder"), "Builder" + Math.random() + ":" + Game.time, { memory: { role: "Builder"}})
      }
    }
  }

  creepGenerator(energy: number, name: string): BodyPartConstant[] {
    let budget: number;
    const body: BodyPartConstant[] = [];

    switch (name) {
      case "Harvester":
        if (energy > 749) {
          return [WORK, WORK,
            WORK, WORK,
            WORK, WORK,
            MOVE, MOVE,
            MOVE]
        }

        // lvl 2. Takes 500 energy, needs roads
        if (energy > 499) {
          return [WORK, WORK,
                  WORK, WORK,
                  MOVE,MOVE]
        }

        // Base. Takes 250 energy, needs roads
        if (energy > 299) {
          return [WORK, WORK, MOVE]
        }

      case "Distributor":
        // Doesn't need roads
        budget = Math.floor(energy / 100)
        for (let i = 0; i < budget; i++) {
          body.push(MOVE)
          body.push(CARRY)
        }

        return body;

      case "Builder":
        budget = Math.floor(energy / 200)

        for (let i = 0; i < budget; i++) {
          body.push(MOVE)
          body.push(WORK)
          body.push(CARRY)
        }

        return body;

      default:
        return []
    }
  }
}
