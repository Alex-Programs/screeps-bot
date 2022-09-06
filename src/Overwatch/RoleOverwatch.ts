import { getAccessibleFaces } from "utils/GetAccessibleFaces";

export class RoleOverwatch {
  constructor() {
    // Collect data. "Borrowed" from Solon's code. MULTITODO
    const spawnEnergy = Game.spawns["Spawn1"].room.energyAvailable;
    const sources: Source[] = Game.spawns["Spawn1"].room.find(FIND_SOURCES)

    const harvesters: Creep[] = _.filter(Game.creeps, creep => creep.memory.role == "Harvester")
    const distributors: Creep[] = _.filter(Game.creeps, creep => creep.memory.role == "Distributor")
    const builders: Creep[] = _.filter(Game.creeps, creep => creep.memory.role == "Builder")

    // Every harvester should have a distributor
    if (distributors.length < harvesters.length * 3) {
      // MULTITODO
      Game.spawns["Spawn1"].spawnCreep(this.creepGenerator(spawnEnergy, "Distributor"), "Distributor " + Math.random() + ":" + Game.time, { memory: { role: "Distributor" } });
    }

    if (distributors.length > 1) {
      const amountOfBuildersDisabled = Game.spawns["Spawn1"].room.find(FIND_CREEPS).filter((creep) => {creep.memory.role == "Distributor" && creep.memory.disableBuilders == true}).length

      const amountOfBuildersDisabledRequired = Math.ceil(distributors.length / 3)

      if (amountOfBuildersDisabledRequired > amountOfBuildersDisabled) {
        Game.spawns["Spawn1"].spawnCreep(this.creepGenerator(spawnEnergy, "Distributor"), "Distributor " + Math.random() + ":" + Game.time, { memory: { role: "Distributor", disableBuilders: true } });
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
      let buildersTarget = sources.length * 6

      if (buildersTarget < 2) {
        buildersTarget = 2;
      }

      if (builders.length < buildersTarget) {
        //MULTITODO
        Game.spawns["Spawn1"].spawnCreep(this.creepGenerator(spawnEnergy, "Builder"), "Builder" + Math.random() + ":" + Game.time, { memory: { role: "Builder"}})
      }
    }

    // TODO handle fighters, towers
  }

  creepGenerator(energy: number, name: string): BodyPartConstant[] {
    let body: BodyPartConstant[] = [];
    let budget: number;

    switch (name) {
      case "Harvester":
        budget = Math.floor((energy - 100) / 100)

        // limit to 10
        budget = budget > 10 ? 10 : budget

        for (let i = 0; i < budget; i++) {
          body.push(WORK)
        }

        body.push(MOVE)
        //body.push(MOVE)

        return body;

      case "Distributor":
        budget = Math.floor(energy / 100)

        for (let i = 0; i < budget; i++) {
          body.push(CARRY)
          body.push(MOVE)
        }

        return body;

      case "Builder":
        budget = Math.floor(energy / 200)
        for (let i = 0; i < budget; i++) {
          body.push(WORK)
          body.push(MOVE)
          body.push(CARRY)
        }

        return body;

      default:
        return []
    }
  }
}
