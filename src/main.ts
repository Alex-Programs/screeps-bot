import {ErrorMapper} from "utils/ErrorMapper";
import {Harvester} from "./Creeps/Harvester";
import {RoleOverwatch} from "./Overwatch/RoleOverwatch";
import {Distributor} from "./Creeps/Distributor";
import { Builder } from "Creeps/Builder";

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
  }

  interface Player {
    name: string;
    hostile: boolean;
    permanentlyHostile: boolean;
    wasLastHostile: number;
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

  // TODO defensive overwatch that populates the factions list based on going over screeps in the room and checking they're not damaging/harvesting - unless they're invaders. Use event log

  // TODO fighter overwatch that intelligently assigns fighters to targets

  // TODO construction overwatch that intelligently creates construction sites, roads to waypoints

  const roleOverwatch: RoleOverwatch = new RoleOverwatch();

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
