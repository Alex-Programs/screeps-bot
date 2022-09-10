import { getAccessibleFaces } from "utils/GetAccessibleFaces";

export class RoleOverwatch {
  constructor() {
    // Collect data. "Borrowed" from Solon's code. MULTITODO
    const spawnEnergy = Game.spawns["Spawn1"].room.energyAvailable;
    const maxEnergy = Game.spawns["Spawn1"].room.energyCapacityAvailable;

    const sources: Source[] = Game.spawns["Spawn1"].room.find(FIND_SOURCES)

    const harvesters: Creep[] = _.filter(Game.creeps, creep => creep.memory.role == "Harvester")
    const distributors: Creep[] = _.filter(Game.creeps, creep => creep.memory.role == "Distributor")
    const builders: Creep[] = _.filter(Game.creeps, creep => creep.memory.role == "Builder")

    // Every harvester should have a distributor
    if (distributors.length < harvesters.length * 2) {
      // MULTITODO
      Game.spawns["Spawn1"].spawnCreep(this.creepGenerator(spawnEnergy, "Distributor"), "Distributor " + Math.random() + ":" + Game.time, { memory: { role: "Distributor" } });
    }

    if (distributors.length > 4) {
      let amountOfBuildersDisabled = 0

      for (const i in distributors) {
        if (distributors[i].memory.disableBuilders == true) {
          amountOfBuildersDisabled++;
        }
      }

      const amountOfBuildersDisabledRequired = Math.floor(distributors.length / 3)

      if (amountOfBuildersDisabledRequired > amountOfBuildersDisabled) {
        Game.spawns["Spawn1"].spawnCreep(this.creepGenerator(spawnEnergy, "Distributor"), "Distributor - Builders Only -" + Math.random() + ":" + Game.time, { memory: { role: "Distributor", disableBuilders: true } });
      }
    }

    // Could be timered
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
          Game.spawns["Spawn1"].spawnCreep(this.creepGenerator(spawnEnergy, "Harvester"), "Harvester" + Math.random() + ":" + Game.time, { memory: { role: "Harvester", targetID: source.id}})
        }
      }
    }

    if (harvesters.length >= 2) {
      let buildersTarget = sources.length * 3

      if (buildersTarget < 2) {
        buildersTarget = 2;
      }

      if (builders.length < buildersTarget) {
        console.log("Making builder")
        Game.spawns["Spawn1"].spawnCreep(this.creepGenerator(spawnEnergy, "Builder"), "Builder" + Math.random() + ":" + Game.time, { memory: { role: "Builder"}})
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
