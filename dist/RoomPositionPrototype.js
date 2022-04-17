RoomPosition.prototype.getAdjacent = function () {
  const positions = []

  const startX = this.x - 1 || 1
  const startY = this.y - 1 || 1

  let x, y
  for (x = startX; x <= this.x + 1 && x < 49; x++) {
    for (y = startY; y <= this.y + 1 && y < 49; y++) {
      if (x !== this.x || y !== this.y) {
        positions.push(new RoomPosition(x, y, this.roomName))
      }
    }
  }

  return positions
}

RoomPosition.prototype.isWallAdjacent = function () {
  const nearby = this.getAdjacent()
  const terrain = Game.map.getRoomTerrain(this.roomName)
  let pos
  for (pos of nearby) {
    if (terrain.get(pos.x, pos.y) === 1) {
      Game.rooms[this.roomName].visual.circle(pos.x, pos.y)
      return true
    }
  }
  return false
}

RoomPosition.prototype.isOccupied = function () {
  if (this.lookFor(LOOK_STRUCTURES).length > 0) return true
  if (this.lookFor(LOOK_CONSTRUCTION_SITES).length > 0) return true
}

RoomPosition.prototype.closestDamagedStructure = function () {
  return this.findClosestByRange(
    FIND_STRUCTURES,
    { filter: (structure) => (structure.hits < structure.hitsMax) && (structure.hits <= 40000) }
  )
}