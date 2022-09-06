import {getAccessibleFaces} from "../utils/getAccessibleFaces";

export class ConstructionOverwatch {
  totalExtensions: number = 0;
  totalStorage: number = 0;
  totalTowers: number = 0;

  constructor(room: Room) {
    this.setTotalBuildableBuildings(room)

    let sources: Source[] = room.find(FIND_SOURCES);
    let spawnPos: RoomPosition = room.find(FIND_MY_SPAWNS)[0].pos;

    if (room.controller && room.controller.level > 1) {
      this.placeRoads(room, sources, spawnPos)
    }

    this.placeTower(room, spawnPos)
  }

  // Will only create one at a time, using the time-limiting to slightly slow things down
  placeTower(room: Room, spawnPos: RoomPosition) {
    const towerCount = room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}}).length

    // TEMPORARY, TO RUN WHILE I SLEEP
    if (room.controller && room.controller.level > 2) {
      room.createConstructionSite(14, 24, STRUCTURE_TOWER)
    }
  }

  placeRoads(room: Room, sources: Source[], spawnPos: RoomPosition) {
    if (room.memory.havePlannedRoads) {
      // console.log("Skipping road creation for " + room.name + " due to already having it done and it being very CPU-intensive")
      return
    }
    const roadNodes: RoomPosition[] = [];

    for (let i = 0; i < sources.length; i++) {
      roadNodes.push(sources[i].pos)

      // I'm not taking any chances. Make paths to every visible face, to avoid gaps. Oh, and range 2, so you can go around them
      const faces = getAccessibleFaces(sources[i].pos, 2)
      for (const faceName in faces) {
        const face = faces[faceName]

        roadNodes.push(new RoomPosition(face.x, face.y, room.name))
      }
    }

    roadNodes.push(spawnPos)

    if (room.controller) {
      roadNodes.push(room.controller?.pos)
    }

    for (const i in roadNodes) {
      for (const j in roadNodes) {
        const roadPath = roadNodes[i].findPathTo(roadNodes[j], {
          maxOps: 400,
          ignoreCreeps: true,
          plainCost: 5,
          swampCost: 10
        })

        for (let i = 0; i < roadPath.length; i++) {
          if (!room.lookForAt(LOOK_TERRAIN, roadPath[i].x, roadPath[i].y).includes("wall")) {
            room.createConstructionSite(roadPath[i].x, roadPath[i].y, STRUCTURE_ROAD)
          }
        }
      }
    }

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
        }
      }
    }

    room.memory.havePlannedRoads = true;
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
