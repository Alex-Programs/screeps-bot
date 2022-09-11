import {ErrorMapper} from "utils/ErrorMapper";
import {Harvester} from "./Creeps/Harvester";
import {RoleOverwatch} from "./Overwatch/RoleOverwatch";
import {Distributor} from "./Creeps/Distributor";
import {Builder} from "Creeps/Builder";
import {ConstructionOverwatch} from "./Overwatch/ConstructionOverwatch"
import {TowerOverwatch} from "./Overwatch/TowerOverwatch";

declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definiton alone.
          You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */

  interface CreepMemory {
    role: string;
    targetID?: Id<any>;
    disableBuilders?: boolean;
    movingTowardsTarget?: boolean;
    controllerOnly?: boolean;
    isIdle?: boolean;
  }

  interface Player {
    name: string;
    hostile: boolean;
    permanentlyHostile: boolean;
    wasLastHostile: number;
  }

  interface RoomMemory {
    time: number;
    havePlannedRoads: boolean;
    lastControllerRefresh: number;
    roadConstructionSites: RoomPosition[];
    sourceMemories: SourceMemory[];
    idleBuildingTicks: number[];
    lastBuilderSpawnTime: number;
    builderTravellingTicks: BuilderTravellingStorage[];
    lastGeneralDistributorSpawnTime: number;
    lastSpecialDistributorSpawnTime: number;
  }

  interface BuilderTravellingStorage {
    totalBuilders: number;
    buildersTravelling: number;
  }

  interface SourceMemory {
    srcID: string;
    lastEnergy: number;
    avgEnergyDrop: number;
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
    }
  }
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code

export const loop = ErrorMapper.wrapLoop(() => {
  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  const room: Room = Game.spawns["Spawn1"].room;
  if (room.memory.time == null || room.memory.time == undefined) {
    room.memory.time = 0;
  } else {
    room.memory.time++;
  }

  if (!room.memory.sourceMemories) {
    room.memory.sourceMemories = [];
  }

  if (!room.memory.idleBuildingTicks) {
    room.memory.idleBuildingTicks = [];
  }

  if (!room.memory.builderTravellingTicks) {
    room.memory.builderTravellingTicks = []
  }

  if (!room.memory.lastSpecialDistributorSpawnTime) {
    room.memory.lastSpecialDistributorSpawnTime = 0;
    room.memory.lastGeneralDistributorSpawnTime = 0;
    room.memory.lastBuilderSpawnTime = 0;
    room.memory.lastControllerRefresh = room.memory.time;
  }

  const time = room.memory.time;

  // TODO defensive overwatch that populates the factions list based on going over screeps in the room and checking they're not damaging/harvesting - unless they're invaders. Use event log

  // TODO distributor overwatch that assigns tasks intelligently

  // TODO construction overwatch that intelligently creates extensions, roads to waypoints, turrets, storages

  // TODO refactor to be room-agnostic

  // TODO once room agnostic, make an expand() function

  /* Changes I'm going to make:
      Make the ground energy function work
      Fix it having poor priorities in screep creation.
      Make a distributor overwatch that collects energy sources and energy requirements
      Finds energy requirements, finds the best source for it, and then allocates however many distributors are necessary, keeping distance in mind
      Builders are not given resources by this system. They're handled by a new worker overwatch, which is a simple spread-assignment system based on
      max and min values per item.

      Now, this is going to involve significant rewriting. For the refactor to be easier to think about, I'm renaming things. Distributors -> Haulers,
      builders -> workers.

      After that, I'm making things room-agnostic and an expand() function
   */

  const roleOverwatch: RoleOverwatch = new RoleOverwatch(room);

  new ConstructionOverwatch(room)

  new TowerOverwatch(room);

  // Necessary ones to start with: Harvester and Distributor. MULTITODO
  for (let creepName in Game.creeps) {
    let creep = Game.creeps[creepName]

    if (creep.memory.role == "Harvester") {
      new Harvester(creep);
      continue;
    }

    if (creep.memory.role == "Distributor") {
      new Distributor(creep)
      continue;
    }

    if (creep.memory.role == "Builder") {
      new Builder(creep)
      continue;
    }
  }
});
