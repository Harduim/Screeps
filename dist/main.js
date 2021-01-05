require('Config')
require('Room')
require('Spawn')
require('Creep')
require('StructureTower')
require('overrides')
require('Highways')
require('RoomPlanner')
require('RoomPosition')
require('LogisticQueue')

const log = require('logger')
const SpawnQueue = require('SpawnQueue')

function every300Ticks () {
  if (Game.time % 300 !== 0) { return }
  log('Runnig 300 Tks Maintenance', LOG_DEBUG)
  balanceCreeps()

  let name
  for (name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name]
    }
  }
}

function balanceCreeps () {
  _.forEach(Game.creeps, function (crp) { crp.memory.role = crp.name.split('_')[0] })
}

module.exports.loop = function () {
  global.log = log
  global.SpawnQueue = new SpawnQueue()
  every300Ticks()

  if (Game.cpu.bucket < 500) {
    log('Extremely low bucket - skipping loop', LOG_FATAL)
    return
  }

  _.invoke(Game.rooms, 'run')
  _.invoke(Game.creeps, 'run')
}
