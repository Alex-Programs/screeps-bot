export class TowerOverwatch {
  constructor(room: Room) {
      const hostiles = room.find(FIND_HOSTILE_CREEPS)

      const towers: StructureTower[] = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER }})

      // TODO add healing

      for (let i = 0; i < towers.length; i++) {
        const tower = towers[i]

        if (hostiles.length > 0) {
          const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS)

          if (closestHostile) {
            tower.attack(closestHostile)
          }
        }
      }
  }
}
