import { Direction } from "../Types/Direction"

export function getAccessibleFaces(position: RoomPosition): RoomPosition[] {
    const terrainAround = Game.rooms[position.roomName].lookForAtArea(LOOK_TERRAIN, position.y - 1, position.x - 1, position.y + 1, position.x +1, true)
    
    let output: RoomPosition[] = []

    for (let i in terrainAround) {
        const coordinate = terrainAround[i]

        if (coordinate.terrain == "plain") {
            output.push(new RoomPosition(coordinate.x, coordinate.y, position.roomName))
        }
    }

    return output
}