Room.prototype.cleanHways = function () {
  return this.memory.Highways = {}
}

Room.prototype.getHighway = function (HwayId) {
  return this.memory.Highways[HwayId] || false
}

Room.prototype.genHwayId = function (Pos) {
  return `${Pos.x}${Pos.y}`
}

Room.prototype.addHighway = function (homePos, destPos) {
  if (!homePos || !destPos) return false
  if (typeof homePos === 'string') homePos = Game.getObjectById(homePos).pos
  if (typeof destPos === 'string') destPos = Game.getObjectById(destPos).pos

  const hwayId = this.genHwayId(destPos)

  if (this.getHighway(hwayId)) {
    log(`[${this.name}]${hwayId} already exists`, LOG_WARN, 'HIGHWAYS')
    return false
  }

  const lane = PathFinder.search(
    homePos, destPos, { swampCost: 2, ignoreCreeps: true, ignoreRoads: true }
  )
  this.memory.Highways[hwayId] = { homePos: homePos, destPos: destPos, lane: lane }
  log(`[${this.name}]${hwayId} added`, LOG_WARN, 'HIGHWAYS')

  return true
}

Room.prototype.buildHway = function (HwayId) {
  const laneKey = `Highways.${HwayId}.lane`
  const lane = _.get(this.memory, laneKey, false)
  if (!lane) {
    log(`[${this.name}]${hwayId} unable to find lane`, LOG_WARN, 'HIGHWAYS')
  }
  let step
  for (step of lane.path) {
    // this.createConstructionSite(step.x, step.y, STRUCTURE_ROAD)
    Game.rooms[step.roomName].createFlag(step.x, step.y, `${HwayId}_${step.x}${step.y}`)
  }
}

Room.prototype.removeFlags = function (prefix) {
  _.forEach(_.filter(Game.flags, flg => flg.name.split('_')[0] === prefix), flg => flg.remove())
}

// Game.rooms['W8S17'].addHighway('5fe61bfdc1ac9af95e162e4c', '5bbcac649099fc012e63562f')
