Room.prototype.cleanHways = function () {
  this.memory.Highways = {}
}

Room.prototype.getHighway = function (HwayId) {
  return this.memory.Highways[HwayId] || false
}

Room.prototype.genHwayId = function (Pos) {
  return `${Pos.x}${Pos.y}`
}

Room.prototype.addHighway = function (homePos, remotePos) {
  if (!homePos || !remotePos) return false
  if (typeof homePos === 'string') homePos = Game.getObjectById(homePos).pos
  if (typeof remotePos === 'string') remotePos = Game.getObjectById(remotePos).pos

  const hwayId = this.genHwayId(remotePos)

  if (this.getHighway(hwayId)) {
    log(`[${this.name}]${hwayId} already exists`, LOG_WARN, 'HIGHWAYS')
    return false
  }

  const lane = PathFinder.search(
    homePos, remotePos, { swampCost: 2, ignoreCreeps: true, ignoreRoads: true }
  )
  log(JSON.stringify(lane), LOG_FATAL)
  this.memory.Highways[hwayId] = lane.path
  log(`[${this.name}]${hwayId} added`, LOG_WARN, 'HIGHWAYS')

  return true
}

Room.prototype.buildHway = function (HwayId) {
  const laneKey = `Highways.${HwayId}`
  const lane = _.get(this.memory, laneKey, false)
  if (!lane) {
    log(`[${this.name}]${HwayId} unable to find lane`, LOG_WARN, 'HIGHWAYS')
  }
  let step
  for (step of lane) {
    // this.createConstructionSite(step.x, step.y, STRUCTURE_ROAD)
    Game.rooms[step.roomName].createFlag(step.x, step.y, `${HwayId}_${step.x}${step.y}`)
  }
}

Room.prototype.removeFlags = function (prefix) {
  _.forEach(_.filter(Game.flags, flg => flg.name.split('_')[0] === prefix), flg => flg.remove())
}

/*
Reset roads
Game.rooms['W8S17'].cleanHways()

Reset flags
Game.rooms['W8S17'].removeFlags('146')
Game.rooms['W8S17'].buildHway('146')

Test road
Game.rooms['W8S17'].addHighway('5fe61bfdc1ac9af95e162e4c', '5bbcac649099fc012e63562f')

Test creep
Game.spawns['Spawn8'].easySpawnCreep({role: 'truck', body: [MOVE, MOVE, CARRY, CARRY]})

Game.spawns['Spawn8'].easySpawnCreep({role: 'srharv', body: [MOVE, MOVE, CARRY, WORK, WORK]})

*/
