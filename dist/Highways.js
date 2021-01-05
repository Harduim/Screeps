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

Room.prototype.buildHway = function (HwayId, dryrun = true) {
  const laneKey = `Highways.${HwayId}`
  const lane = _.get(this.memory, laneKey, false)
  if (!lane) {
    log(`[${this.name}]${HwayId} unable to find lane`, LOG_WARN, 'HIGHWAYS')
  }
  let step
  for (step of lane) {
    if (dryrun) {
      Game.rooms[step.roomName].createFlag(step.x, step.y, `${HwayId}_${step.x}${step.y}`)
    } else {
      Game.rooms[step.roomName].createConstructionSite(step.x, step.y, STRUCTURE_ROAD)
    }
  }
}

Room.prototype.removeFlags = function (prefix) {
  _.forEach(_.filter(Game.flags, flg => flg.name.split('_')[0] === prefix), flg => flg.remove())
}

/*
Reset roads
Game.rooms['sim'].cleanHways()

1917 / 2317
Reset flags
Game.rooms['sim'].removeFlags('1917')
Game.rooms['sim'].buildHway('51', false)

Test road
Game.rooms['sim'].addHighway('d7500ca4714c1dec7d28e0e5', '2de11bcdd869b2908d0a87b3')
Game.rooms['sim'].addHighway('35dcbcc5b80460e55dec340e', 'fc24fd3ebd41b434e985ba3a')

Test creep
Game.spawns['Spawn1'].easySpawnCreep({role: 'truck', body: [MOVE, MOVE, MOVE, CARRY, CARRY, WORK]})

Game.spawns['Spawn1'].easySpawnCreep({role: 'srharv', body: [MOVE, MOVE, CARRY, WORK, WORK]})

Game.spawns['Spawn1'].easySpawnCreep({role: 'srharv', body: [MOVE, MOVE, MOVE, MOVE, CARRY, WORK, WORK, WORK, WORK]})

*/
