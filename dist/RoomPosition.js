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
    } // y for loop
  } // X for loop

  return positions
} // getNerby

RoomPosition.prototype.isWallAdjacent = function () {
  const nearby = this.getAdjacent()
  const terrain = Game.map.getRoomTerrain(this.roomName)
  let pos
  for (pos of nearby) {
    if (terrain.get(pos.x, pos.x) === TERRAIN_MASK_WALL) {
        Game.rooms[this.roomName].visual.circle(pos.x, pos.y, { stroke: COLOR_RED, color: COLOR_RED, fill: 'solid'})
        //return true
    }
    log(`${terrain.get(pos.x, pos.x)} ${pos}`)
  }
  return false
}
