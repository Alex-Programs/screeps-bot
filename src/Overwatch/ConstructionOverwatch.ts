import {getAccessibleFaces} from "../utils/getAccessibleFaces";
import {spawn} from "child_process";

export class ConstructionOverwatch {
  totalExtensions: number = 0;
  totalStorage: number = 0;
  totalTowers: number = 0;

  constructor(room: Room) {
    // Only run if at total capacity, to give roleoverwatch a chance
    if (room.energyAvailable !== room.energyCapacityAvailable) {
      return;
    }

    this.setTotalBuildableBuildings(room)

    let sources: Source[] = room.find(FIND_SOURCES);
    let spawnPos: RoomPosition = room.find(FIND_MY_SPAWNS)[0].pos;

    if (room.controller && room.controller.level > 1) {
      this.placeRoads(room, sources, spawnPos)
    }

    if (room.controller && room.controller.level > 1 && room.memory.time % 10 == 0) {
      this.renewRoads(room);
    }

    // TODO place extensions, towers
  }

  renewRoads(room: Room) {
    for (let i = 0; i < room.memory.roadConstructionSites.length; i++) {
      const position: RoomPosition = room.memory.roadConstructionSites[i];

      if (room.lookForAt(LOOK_STRUCTURES, position.x, position.y).length === 0 && room.lookForAt(LOOK_CONSTRUCTION_SITES, position.x, position.y).length === 0) {
        room.createConstructionSite(position.x, position.y, STRUCTURE_ROAD);
      }
    }
  }

  removeSites(room: Room) {
    const sites: ConstructionSite[] = room.find(FIND_CONSTRUCTION_SITES)
    for (const site of sites) {
      site.remove();
    }
  }

  placeRoads(room: Room, sources: Source[], spawnPos: RoomPosition) {
    if (room.memory.havePlannedRoads) {
      return
    }
    const roadConstructionSites: RoomPosition[] = [];

    // Create box of roads around spawn
    const spawnBound: any = room.lookForAtArea(LOOK_TERRAIN,
      spawnPos.y - 1,
      spawnPos.x - 1,
      spawnPos.y + 1,
      spawnPos.x + 1,
      true
    )

    for (const i in spawnBound) {
      if (spawnBound[i].terrain.includes("plain") || spawnBound[i].terrain.includes("swamp")) {
        if (room.lookForAt(LOOK_STRUCTURES, spawnBound[i].x, spawnBound[i].y).length === 0) {
          room.createConstructionSite(spawnBound[i].x, spawnBound[i].y, STRUCTURE_ROAD);
          roadConstructionSites.push(new RoomPosition(spawnBound[i].x, spawnBound[i].y, room.name))
        }
      }
    }

    const roadNodes: RoomPosition[] = [];

    for (let i = 0; i < sources.length; i++) {
      roadNodes.push(sources[i].pos)

      // I'm not taking any chances. Make paths to every visible face, to avoid gaps. Oh, and range 2, so you can go around them
      const faces = getAccessibleFaces(sources[i].pos, 2)
      for (const faceName in faces) {
        const face = faces[faceName]

        room.createConstructionSite(face.x, face.y, STRUCTURE_ROAD);
        roadConstructionSites.push(new RoomPosition(face.x, face.y, room.name))
      }
    }

    roadNodes.push(spawnPos)

    if (room.controller) {
      roadNodes.push(room.controller.pos)
    }

    for (const i in roadNodes) {
      for (const j in roadNodes) {
        const roadPath = roadNodes[i].findPathTo(roadNodes[j], {
          maxOps: 400,
          ignoreCreeps: true,
          plainCost: 5,
          swampCost: 10,
        })

        for (let i = 0; i < roadPath.length; i++) {
          if (!room.lookForAt(LOOK_TERRAIN, roadPath[i].x, roadPath[i].y).includes("wall")) {
            room.createConstructionSite(roadPath[i].x, roadPath[i].y, STRUCTURE_ROAD)
            roadConstructionSites.push(new RoomPosition(roadPath[i].x, roadPath[i].y, room.name))
          }
        }
      }
    }

    room.memory.havePlannedRoads = true;
    room.memory.roadConstructionSites = roadConstructionSites;
  }

  setTotalBuildableBuildings(room: Room): void {
    let roomLevel = room.controller?.level;

    if (roomLevel) {
      switch (roomLevel) {
        case 0:
          this.totalExtensions = 0;
          this.totalStorage = 0;
          this.totalTowers = 0;
          break;

        case 1:
          this.totalExtensions = 0;
          this.totalStorage = 0;
          this.totalTowers = 0;
          break;

        case 2:
          this.totalExtensions = 5;
          this.totalStorage = 0;
          this.totalTowers = 0;
          break;

        case 3:
          this.totalExtensions = 10;
          this.totalStorage = 0;
          this.totalTowers = 1;
          break;

        case 4:
          this.totalExtensions = 20;
          this.totalStorage = 1;
          this.totalTowers = 1;
          break;

        case 5:
          this.totalExtensions = 30;
          this.totalStorage = 1;
          this.totalTowers = 2;
          break;

        case 6:
          this.totalExtensions = 40;
          this.totalStorage = 1;
          this.totalTowers = 2;
          break;

        case 7:
          this.totalExtensions = 50;
          this.totalStorage = 1;
          this.totalTowers = 3;
          break;

        case 8:
          this.totalExtensions = 60;
          this.totalStorage = 1;
          this.totalTowers = 6;
          break;
      }
    }
  }
}
