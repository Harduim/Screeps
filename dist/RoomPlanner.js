const BASE_LAYOUT = {
  road: [
    { x: 0, y: -1, dist: 1 },
    { x: 1, y: 0, dist: 1 },
    { x: -1, y: -2, dist: 2 },
    { x: -2, y: -1, dist: 2 },
    { x: 2, y: 1, dist: 2 },
    { x: 1, y: 2, dist: 2 },
    { x: -2, y: -3, dist: 3 },
    { x: 3, y: -3, dist: 3 },
    { x: -3, y: 0, dist: 3 },
    { x: 3, y: 0, dist: 3 },
    { x: -3, y: 2, dist: 3 },
    { x: 3, y: 2, dist: 3 },
    { x: -2, y: 3, dist: 3 },
    { x: 0, y: 3, dist: 3 },
    { x: -4, y: -4, dist: 4 },
    { x: -3, y: -4, dist: 4 },
    { x: -2, y: -4, dist: 4 },
    { x: 2, y: -4, dist: 4 },
    { x: 4, y: -2, dist: 4 },
    { x: 4, y: -1, dist: 4 },
    { x: -4, y: 1, dist: 4 },
    { x: 4, y: 3, dist: 4 },
    { x: -1, y: 4, dist: 4 },
    { x: 4, y: 4, dist: 4 },
    { x: -2, y: -5, dist: 5 },
    { x: -1, y: -5, dist: 5 },
    { x: 0, y: -5, dist: 5 },
    { x: 1, y: -5, dist: 5 },
    { x: -5, y: -3, dist: 5 },
    { x: 5, y: -1, dist: 5 },
    { x: -5, y: 0, dist: 5 },
    { x: 5, y: 0, dist: 5 },
    { x: 5, y: 1, dist: 5 },
    { x: -5, y: 2, dist: 5 },
    { x: 5, y: 2, dist: 5 },
    { x: 5, y: 3, dist: 5 },
    { x: -5, y: 5, dist: 5 },
    { x: -2, y: 5, dist: 5 },
    { x: 0, y: 5, dist: 5 },
    { x: 3, y: 5, dist: 5 },
    { x: -6, y: -2, dist: 6 },
    { x: -6, y: -1, dist: 6 },
    { x: -6, y: 3, dist: 6 },
    { x: -6, y: 4, dist: 6 },
    { x: -4, y: 6, dist: 6 },
    { x: -3, y: 6, dist: 6 },
    { x: 1, y: 6, dist: 6 },
    { x: 2, y: 6, dist: 6 },
    { x: -7, y: -1, dist: 7 },
    { x: -7, y: 0, dist: 7 },
    { x: -7, y: 1, dist: 7 },
    { x: -7, y: 2, dist: 7 },
    { x: -7, y: 3, dist: 7 },
    { x: -3, y: 7, dist: 7 },
    { x: -2, y: 7, dist: 7 },
    { x: -1, y: 7, dist: 7 },
    { x: 0, y: 7, dist: 7 },
    { x: 1, y: 7, dist: 7 }
  ],
  observer: [
    { x: -1, y: -4, dist: 4 }
  ],
  lab: [
    { x: 1, y: -1, dist: 1 },
    { x: 0, y: -2, dist: 2 },
    { x: 1, y: -2, dist: 2 },
    { x: 2, y: -2, dist: 2 },
    { x: -1, y: -3, dist: 3 },
    { x: 0, y: -3, dist: 3 },
    { x: 1, y: -3, dist: 3 },
    { x: 2, y: -3, dist: 3 },
    { x: 0, y: -4, dist: 4 },
    { x: 1, y: -4, dist: 4 }
  ],
  extension: [
    { x: 2, y: -1, dist: 2 },
    { x: 2, y: 2, dist: 2 },
    { x: -3, y: -3, dist: 3 },
    { x: -3, y: -2, dist: 3 },
    { x: 3, y: -2, dist: 3 },
    { x: -3, y: -1, dist: 3 },
    { x: 3, y: -1, dist: 3 },
    { x: 3, y: 1, dist: 3 },
    { x: -3, y: 3, dist: 3 },
    { x: 1, y: 3, dist: 3 },
    { x: 2, y: 3, dist: 3 },
    { x: 3, y: 3, dist: 3 },
    { x: -4, y: -3, dist: 4 },
    { x: -4, y: -2, dist: 4 },
    { x: -4, y: -1, dist: 4 },
    { x: -4, y: 0, dist: 4 },
    { x: 4, y: 0, dist: 4 },
    { x: 4, y: 1, dist: 4 },
    { x: 4, y: 2, dist: 4 },
    { x: -4, y: 3, dist: 4 },
    { x: -4, y: 4, dist: 4 },
    { x: -3, y: 4, dist: 4 },
    { x: -2, y: 4, dist: 4 },
    { x: 1, y: 4, dist: 4 },
    { x: 2, y: 4, dist: 4 },
    { x: 3, y: 4, dist: 4 },
    { x: -5, y: -2, dist: 5 },
    { x: -5, y: -1, dist: 5 },
    { x: -5, y: 1, dist: 5 },
    { x: -5, y: 3, dist: 5 },
    { x: -5, y: 4, dist: 5 },
    { x: -4, y: 5, dist: 5 },
    { x: -3, y: 5, dist: 5 },
    { x: -1, y: 5, dist: 5 },
    { x: 1, y: 5, dist: 5 },
    { x: 2, y: 5, dist: 5 },
    { x: -6, y: 0, dist: 6 },
    { x: -6, y: 1, dist: 6 },
    { x: -6, y: 2, dist: 6 },
    { x: -2, y: 6, dist: 6 },
    { x: -1, y: 6, dist: 6 },
    { x: 0, y: 6, dist: 6 }
  ],
  tower: [
    { x: 1, y: 1, dist: 1 },
    { x: -2, y: -2, dist: 2 },
    { x: 2, y: 0, dist: 2 },
    { x: -3, y: 1, dist: 3 },
    { x: -4, y: 2, dist: 4 },
    { x: 0, y: 4, dist: 4 }
  ],
  nuker: [
    { x: -2, y: 0, dist: 2 }
  ],
  spawn: [
    { x: 0, y: 0, dist: 0 },
    { x: -1, y: 0, dist: 1 },
    { x: -1, y: 2, dist: 2 }
  ],
  storage: [
    { x: -2, y: 1, dist: 2 }
  ],
  terminal: [
    { x: 0, y: 1, dist: 1 }
  ],
  powerSpawn: [
    { x: -2, y: 2, dist: 2 }
  ],
  link: [
    { x: 0, y: 2, dist: 2 }
  ]
}

Room.prototype.drawSquare = function (x = 25, y = 25, squareSize = 9) {
  // Game.rooms['W1S18'].removeFlags('square')
  let i
  for (i = 0; i <= squareSize; i++) {
    this.createFlag(x + i, y, `square_${x + i}${y}`)
    this.createFlag(x + i, y + squareSize, `square_${x + i}${y + squareSize}`)
    this.createFlag(x, y + i, `square_${x}${y + i}`)
    this.createFlag(x + squareSize, y + i, `square_${x + squareSize}${y + i}`)
  }
}

Room.prototype.drawBaseLayout = function (x = 25, y = 25) {
  this.removeFlags('l')
  let crds
  for (crds of BASE_LAYOUT.road) {
    // this.createFlag(crds.x + x, crds.y + y, `l_${crds.x}${crds.y}`, COLOR_GREY)
    this.visual.circle(crds.x + x, crds.y + y)
  }
  for (crds of BASE_LAYOUT.spawn) {
    // this.createFlag(crds.x + x, crds.y + y, `l_${crds.x}${crds.y}`, COLOR_RED)
    this.visual.circle(crds.x + x, crds.y + y, { stroke: COLOR_RED })
  }
}

Room.prototype.buildNext = function (strType, structs, constSites) {
  if (!this.memory.baseCenter) {
    const mSpawn = structs.filter(
      spn => spn.structureType === STRUCTURE_SPAWN && (spn.memory && spn.memory.main === true)
    )
    if (mSpawn.length > 0) this.memory.baseCenter = mSpawn[0].pos
    return
  }
  const bc = this.memory.baseCenter
  const pos = new RoomPosition(bc.x, bc.y, bc.roomName)
  const { x, y } = pos
  if (constSites.length > 0) return
  let strCount = structs.filter(strc => strc.structureType === strType).length

  if (CONTROLLER_STRUCTURES[strType][this.controller.level] <= strCount) return

  let i, offset, ox, oy, tryPos, buildResult
  for (i = 0; i < BASE_LAYOUT[strType].length; i++) {
    offset = BASE_LAYOUT[strType][strCount]
    ox = x + offset.x
    oy = y + offset.y
    tryPos = new RoomPosition(ox, oy, bc.roomName)
    this.visual.circle(ox, oy, { fill: 'solid', color: COLOR_RED })

    if (tryPos.isWallAdjacent() || tryPos.isOccupied()) {
      i++
      strCount++
      continue
    }
    buildResult = this.createConstructionSite(ox, oy, strType)
    if (buildResult === OK) return
    i++
    strCount++
  }
  log(`Unable to build ${strType} [${strCount}] ${ox}/${oy} err:${buildResult}`, LOG_FATAL, this.name)
}

Room.prototype.buildBaseRoads = function () {
  if (!this.memory.baseCenter) return
  if (this.memory.baseRoads) return
  const bc = this.memory.baseCenter
  let pos
  for (pos of BASE_LAYOUT.road) {
    this.createConstructionSite(pos.x + bc.x, pos.y + bc.y, STRUCTURE_ROAD)
  }
  this.memory.baseRoads = true
}
