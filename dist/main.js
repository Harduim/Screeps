require('Global')

require('Spawn')
require('StructureTower')
require('Highways')
require('RoomPlanner')
require('RoomPositionPrototype')
require('LogistiQueue')

require('Room')
require('RoomPrototype')

require('Creep')
require('CreepPrototype')
require('CreepRoleHarvester')
require('CreepRoleUpgrader')
require('CreepRoleBuilder')
require('CreepRoleEuroTruck')

require('SourcePrototype')


const log = require('Logger')
const SpawnQueue = require('FeatureSpawnQueue')
const scheduler = require('FeatureScheduler')
const maintenanceTasks = require('FeatureMaintenance')

module.exports.loop = function () {
  global.log = log
  global.SpawnQueue = new SpawnQueue()
  scheduler(maintenanceTasks)

  if (Game.cpu.bucket < 500) {
    log('Extremely low bucket - skipping loop', LOG_FATAL)
    return
  }

  _.invoke(Game.rooms, 'run')
  _.invoke(Game.creeps, 'run')
}
