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
require('CreepRoleBuilder')
require('CreepRoleClaimer')
require('CreepRoleEnergyBuffer')
require('CreepRoleEuroTruck')
require('CreepRoleHarvester')
require('CreepRoleLinker')
require('CreepRoleMason')
require('CreepRoleMigrator')
require('CreepRoleUpgrader')
require('CreepRoleRemoteHarvester')
require('CreepRoleRemoteStaticHarvester')
require('CreepRoleTrader')
require('CreepRoleSeeder')

require('SourcePrototype')

const log = require('Logger')
const SpawnQueue = require('FeatureSpawnQueue')
const scheduler = require('FeatureScheduler')
const maintenanceTasks = require('FeatureMaintenance')
const ci = require('ConsoleInterface')


module.exports.loop = function () {
  global.ci = ci
  global.log = log
  global.SpawnQueue = new SpawnQueue()
  scheduler(maintenanceTasks)

  if (Game.cpu.bucket < 500) {
    log('Extremely low bucket - skipping loop', LOG_FATAL)
    return
  }

  try { _.invoke(Game.rooms, 'run') } catch (e) { log(e, LOG_FATAL) }
  try { _.invoke(Game.creeps, 'run') } catch (e) { log(e, LOG_FATAL) }

}
