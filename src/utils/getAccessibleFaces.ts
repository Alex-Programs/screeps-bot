import { Direction } from "../Types/Direction"

export function getAccessibleFaces(position: RoomPosition, range = 1): RoomPosition[] {
    const terrainAround = Game.rooms[position.roomName].lookForAtArea(LOOK_TERRAIN, position.y - range, position.x - range, position.y + range, position.x + range, true)

    let output: RoomPosition[] = []

    for (let i in terrainAround) {
        const coordinate = terrainAround[i]

        if (coordinate.terrain == "plain") {
            output.push(new RoomPosition(coordinate.x, coordinate.y, position.roomName))
        }
    }

    return output
}
