require('WarCreep')

const REUSEPATHARGS = { reusePath: 6 }

Creep.prototype.run = function () {
  if (this.spawning && Game.time % 10 === 0) {
    log(`${this.name}`, LOG_INFO, this.room.name)
    return
  }

  if (ARMYROLES.includes(this.memory.role)) {
    this.memory.ARMYROLES = ARMYROLES
    return this.roleArmy()
  }

  if (this.memory.relocate) {
    const rallyPoint = Game.flags.reloc
    if (rallyPoint) {
      if (this.room.name !== rallyPoint.pos.roomName) return this.moveTo(rallyPoint)
      this.memory.relocate = false
    }
  }
  switch (this.memory.role) {
    case 'buil':
      return this.roleBuilder()
    case 'harv':
      return this.roleHarvester()
    case 'upgr':
      return this.roleUpgrader()
    case 'claim':
      return this.roleClaimer()
    case 'rharv':
      return this.roleRemoteHarvester()
    case 'buff':
      return this.roleBuff()
    case 'loot':
      return this.roleLooter()
    case 'seed':
      return this.roleSeeder()
    case 'migr':
      return this.roleMigrate()
    case 'truck':
      return this.roleEuroTruck()
    case 'linker':
      return this.roleLinker()
    case 'grave':
      return this.roleGrave()
    case 'mason':
      return this.roleMason()
    case 'trader':
      return this.roleTrader()
    case 'srharv':
      return this.roleStaticRharv()
  }
}

function allowedStorages (storages) {
  return strc => storages.includes(strc.structureType) && strc.store.getFreeCapacity(RESOURCE_ENERGY) > 0
}

Creep.prototype.roleEuroTruck = function () {
  const road = Game.rooms[this.memory.default_room].getHighway(146)
  if (!road) {
    log(`[${this.room.name}]${this.name}:No road found`, LOG_WARN, 'HIGHWAYS')
    return
  }
  let action, dest
  if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    action = 'withdraw'
    dest = road[road.length - 1]
  } else {
    action = 'transfer'
    dest = road[0]
  }

  dest = new RoomPosition(dest.x, dest.y, dest.roomName)
  if (this.pos.inRangeTo(dest, 2)) {
    const target = this.room.lookForAtArea(
      LOOK_STRUCTURES, dest.y - 1, dest.x - 1, dest.y + 1, dest.x + 1, true
    )
    this[action](target[0].structure, RESOURCE_ENERGY)
  }
  this.moveTo(dest, { reusePath: 100 })
}

Creep.prototype.lookArround = function (lookType) {
  const target = this.room.lookForAtArea(
    lookType, this.pos.y - 1, this.pos.x - 1, this.pos.y + 1, this.pos.x + 1, true
  )
  return _.get(target, '[0].structure.id', false)
}

Creep.prototype.roleStaticRharv = function () {
  const rPos = this.memory.remotePos
  if (!rPos) return

  const remotePos = new RoomPosition(rPos.x, rPos.y, rPos.roomName)

  if (rPos.roomName !== this.room.name || !this.pos.inRangeTo(remotePos, 0)) {
    return this.moveTo(remotePos)
  }

  if (this.memory.building) {
    this.memory.role = 'buil'
    return this.roleBuilder()
  }

  const nosrcerrmsg = `[${this.room.name}][${this.name}] Source not found`
  const nocontainererrmsg = `[${this.room.name}][${this.name}] Container not found`
  if (!this.memory.source) {
    const sourceId = this.lookArround(LOOK_SOURCES)
    this.memory.source = sourceId
    if (!sourceId) return log(nosrcerrmsg, LOG_WARN, 'STATIC_RHARV')
  }

  if (!this.memory.container) {
    const containerId = this.lookArround(LOOK_STRUCTURES)
    this.memory.container = containerId
    if (!containerId) {
      log(nocontainererrmsg, LOG_INFO, 'STATIC_RHARV')
      if (!this.memory.destConstSite) {
        const conSiteId = this.lookArround(LOOK_CONSTRUCTION_SITES)
        if (!conSiteId) {
          this.room.createConstructionSite(this.pos.x, this.pos.y, STRUCTURE_CONTAINER)
          this.memory.destConstSite = this.lookArround(LOOK_CONSTRUCTION_SITES)
        } // !conSiteId
        this.memory.building = true
        this.memory.role = 'buil'
        return this.roleBuilder()
      } // !this.memory.destConstSite
    } // !containerId
  } // !this.memory.container

  const source = Game.getObjectById(this.memory.source)
  if (!source) return log(nosrcerrmsg, LOG_WARN, 'STATIC_RHARV')

  const container = Game.getObjectById(this.memory.container)
  if (!container) {
    log(nocontainererrmsg, LOG_WARN, 'STATIC_RHARV')
    this.memory.container = false
    return
  }

  if (this.store.getFreeCapacity === 0 && container.hits < container.hitsMax) {
    return this.repair(container)
  }

  this.harvest(source)
} // roleStaticRharv

Creep.prototype.roleMason = function () {
  let strucTypes = [STRUCTURE_WALL, STRUCTURE_RAMPART]
  if (this.ticksToLive > 1200) strucTypes = [STRUCTURE_ROAD]

  if (this.store.getUsedCapacity() === 0) {
    this.memory.building = false
    this.memory.goingTo = false
    if (this.room.storage && this.room.storage.store.energy > STORAGE_THRESHOLD_MASON) {
      return this.goWithdraw()
    } else {
      return this.goHarvest()
    }
  }

  if (!this.memory.building && this.store.getFreeCapacity() === 0) {
    this.memory.building = true
  }

  let target = Game.getObjectById(this.memory.goingTo)
  if (!target || !strucTypes.includes(target.structureType) || target.hits === target.hitsMax) {
    const strucs = this.room.find(
      FIND_STRUCTURES,
      { filter: strc => strucTypes.includes(strc.structureType) && strc.hits < strc.hitsMax }
    )
    if (strucs.length === 0) {
      this.memory.role = 'grave'
      return
    }
    if (strucTypes.includes(STRUCTURE_WALL)) {
      target = strucs.sort((a, b) => a.hits - b.hits)[0]
    } else {
      target = this.pos.findClosestByRange(strucs)
    }
    this.memory.goingTo = target.id
  }
  if (!this.pos.inRangeTo(target, 3)) return this.moveTo(target)
  return this.repair(target)
}

Creep.prototype.roleGrave = function () {
  if (this.memory.harvesting) return this.goHarvest(FIND_DROPPED_RESOURCES)
  return this.goDeposit()
}

Creep.prototype.roleTrader = function () {
  if (!this.room.terminal || !this.room.storage) return

  const terminnalEnergy = this.room.terminal.store.getUsedCapacity(RESOURCE_ENERGY)
  const storageEnergy = this.room.storage.store.energy
  if (terminnalEnergy > TERMINAL_ENERGY_BUFFER || storageEnergy < TERMINAL_ENERGY_BUFFER) {
    this.memory.role = 'mason'
    return this.roleMason()
  }

  let energyFrom, energyTo, dest, action
  if (terminnalEnergy > storageEnergy) {
    energyFrom = this.room.storage
    energyTo = this.room.terminal
  } else {
    energyFrom = this.room.terminal
    energyTo = this.room.storage
  }

  if (this.store.getUsedCapacity() > 0) {
    dest = energyFrom
    action = 'transfer'
  } else {
    dest = energyTo
    action = 'withdraw'
  }

  if (!this.pos.isNearTo(dest)) {
    return this.moveTo(dest, REUSEPATHARGS)
  }

  return log(this[action](dest, RESOURCE_ENERGY))
}

Creep.prototype.roleLinker = function () {
  if (this.store.getUsedCapacity(RESOURCE_ENERGY) > 0 || this.memory.harvesting === false) {
    const storages = [STRUCTURE_STORAGE, STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER]
    return this.goDeposit(allowedStorages(storages))
  }

  if (!this.room.memory.mainLink) return
  const mLink = Game.getObjectById(this.room.memory.mainLink.id)
  if (!mLink) return

  if (!this.pos.isNearTo(mLink)) {
    return this.moveTo(mLink, REUSEPATHARGS)
  } else {
    return this.withdraw(mLink, RESOURCE_ENERGY)
  }
}

Creep.prototype.roleBuff = function () {
  if (Game.time % 30 === 0 && this.name.split('_')[0] === 'linker') {
    this.memory.role = 'linker'
    return this.roleLinker()
  }

  if (this.store.getUsedCapacity() > 0 || this.memory.harvesting === false) {
    this.memory.goingTo = false
    const energyFull = this.room.energyAvailable === this.room.energyCapacityAvailable
    const storages = energyFull ? [STRUCTURE_TOWER] : [STRUCTURE_EXTENSION, STRUCTURE_SPAWN]
    return this.goDeposit(allowedStorages(storages))
  } else {
    return this.goWithdraw()
  }
}

Creep.prototype.roleMigrate = function () {
  let flag = Game.flags.from
  if (this.store.getFreeCapacity() === 0) flag = Game.flags.to

  let target = flag
  if (this.room.name === flag.room.name) target = this.room.storage

  if (!this.pos.inRangeTo(target, 1)) return this.moveTo(target, REUSEPATHARGS)

  if (this.store.getFreeCapacity() === 0) {
    this.memory.role = this.name.split('_')[0]
    return this.transfer(this.room.storage, RESOURCE_ENERGY)
  }
  return this.withdraw(this.room.storage, RESOURCE_ENERGY)
}

Creep.prototype.roleClaimer = function () {
  let remotePos = this.memory.remotePos
  remotePos = new RoomPosition(remotePos.x, remotePos.y, remotePos.roomName)

  if (!this.pos.inRangeTo(remotePos, 1)) return this.moveTo(remotePos)

  const ctlr = this.room.controller
  if (!ctlr.my && ctlr.reservation && ctlr.reservation.username !== 'Harduim') {
    this.callReinforcements()
    return this.attackController(ctlr)
  }
  return this.reserveController(ctlr)
}

Creep.prototype.roleRemoteHarvester = function () {
  const remotePos = this.memory.remotePos
  if (!remotePos) return

  if (this.shouldFlee()) {
    this.memory.role = 'upgr'
    this.memory.goingTo = this.memory.default_spawn
    return this.moveTo(Game.getObjectById(this.memory.default_spawn))
  }

  if (this.memory.harvesting && !this.memory.building) {
    if (this.pos.inRangeTo(remotePos, 1)) {
      this.memory.goingTo = false
      return this.goHarvest()
    } else {
      return this.moveTo(new RoomPosition(remotePos.x, remotePos.y, remotePos.roomName))
    }
  }

  if (!this.room.controller || !this.room.controller.my) {
    if (this.memory.building) {
      return this.goBuild(false)
    }
    this.memory.goingTo = false
    const constructSites = this.pos.findInRange(FIND_CONSTRUCTION_SITES, 2)
    if (constructSites.length > 0) {
      this.memory.destConstSite = constructSites[0].id
      this.memory.building = true
      return this.goBuild(false)
    }
    const damagedStruc = this.pos.findInRange(
      FIND_STRUCTURES, 2,
      { filter: (strc) => [STRUCTURE_ROAD, STRUCTURE_CONTAINER].includes(strc.structureType) && strc.hits < strc.hitsMax }
    )
    if (damagedStruc.length > 0) {
      return this.repair(damagedStruc[0])
    }
    return this.moveTo(Game.getObjectById(this.memory.default_controller))
  } else {
    return this.goDeposit(
      function (struc) {
        return [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_STORAGE, STRUCTURE_LINK].includes(struc.structureType) &&
          struc.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      }
    )
  }
}

Creep.prototype.roleHarvester = function () {
  if (this.memory.harvesting) return this.goHarvest()

  if (!this.memory.goingTo) {
    const closeLink = this.pos.findInRange(FIND_MY_STRUCTURES, 2, {
      filter: strc => (strc.structureType === STRUCTURE_LINK && strc.store.energy < 795)
    })

    if (closeLink.length > 0 && (this.room.memory.censusByPrefix.linker || 0) > 0) {
      this.memory.goingTo = closeLink[0].id
    }
  }

  return this.goDeposit()
}

function storageFilter (strc) {
  let aStorages = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN]
  if (strc.room.energyAvailable === strc.room.energyCapacityAvailable) {
    aStorages = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_STORAGE]
  }
  return aStorages.includes(strc.structureType) && strc.store.getFreeCapacity(RESOURCE_ENERGY) > 0
}

Creep.prototype.roleSeeder = function roleSeeder () {
  if (!this.room.controller || this.room.controller.id !== this.memory.default_controller) {
    return this.moveTo(Game.getObjectById(this.memory.default_controller))
  }

  this.memory.role = 'harv'
  return this.roleHarvester()
}

Creep.prototype.roleBuilder = function () {
  if (this.memory.building) return this.goBuild()

  if (!this.memory.building && this.store.getFreeCapacity() === 0) {
    this.memory.building = true
    this.say('🚧 build')
    return this.goBuild()
  }
  if (this.room.storage && this.room.storage.store.energy > 1000) return this.goWithdraw()

  return this.goHarvest()
}

Creep.prototype.roleUpgrader = function () {
  const originalRole = this.name.split('_')[0]
  if (originalRole !== 'upgr' && this.store[RESOURCE_ENERGY] === 0) {
    this.memory.role = originalRole
    return
  }
  if (this.memory.upgrading && this.store[RESOURCE_ENERGY] === 0) this.memory.upgrading = false
  if (!this.memory.upgrading && this.store.getFreeCapacity() === 0) this.memory.upgrading = true

  const ctrl = Game.getObjectById(this.memory.default_controller)
  if (this.memory.upgrading) {
    if (this.upgradeController(ctrl) === ERR_NOT_IN_RANGE) this.moveTo(ctrl, { visualizePathStyle: { stroke: '#ffffff' } })
    return
  }
  if (originalRole !== 'upgr' || (this.room.storage && this.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 50000)) {
    return this.goWithdraw()
  }
  return this.goHarvest()
}

Creep.prototype.goDeposit = function (storFilter = storageFilter) {
  if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    this.memory.harvesting = true
    return
  }

  let energyStorage = Game.getObjectById(this.memory.goingTo)
  if (!energyStorage) {
    if (this.room.memory.censusByPrefix && (this.room.memory.censusByPrefix.buff || 0) > 0 && !['buff', 'rharv'].includes(this.memory.role)) {
      energyStorage = this.room.storage
    } else {
      const targets = this.room.find(FIND_MY_STRUCTURES, { filter: storFilter })
      if (targets.length === 0) { return ERR_INVALID_TARGET }
      energyStorage = this.pos.findClosestByRange(targets)
      this.memory.goingTo = energyStorage.id
    }
  }

  if (!this.pos.inRangeTo(energyStorage, 1)) return this.moveTo(energyStorage, REUSEPATHARGS)

  this.memory.harvesting = false
  const transferResult = this.transfer(energyStorage, RESOURCE_ENERGY)
  if ((transferResult === ERR_FULL) || (transferResult === ERR_NOT_ENOUGH_RESOURCES)) {
    this.memory.goingTo = false
    this.goDeposit()
  }
}

Creep.prototype.goHarvest = function (findType = FIND_SOURCES_ACTIVE) {
  if (Game.getObjectById(this.memory.goingTo) === null || this.memory.goingTo === false) {
    const goingTo = this.pos.findClosestByPath(findType)
    if (goingTo) {
      this.memory.goingTo = goingTo.id
    } else {
      return ERR_INVALID_TARGET
    }
  }
  const energySource = Game.getObjectById(this.memory.goingTo)

  if (this.pos.inRangeTo(energySource, 1)) {
    this.memory.goingTo = false
    switch (findType) {
      case FIND_DROPPED_RESOURCES:
        this.pickup(energySource)
        break
      case FIND_HOSTILE_STRUCTURES:
        this.dismantle(energySource)
        break
      case FIND_TOMBSTONES:
        this.withdraw(energySource, RESOURCE_ENERGY)
        break
      default:
        this.harvest(energySource)
    }
    if (this.store.getFreeCapacity() === 0) {
      this.memory.harvesting = false
    }
  } else {
    this.memory.harvesting = true
    this.moveTo(energySource, REUSEPATHARGS)
  }
}

Creep.prototype.goWithdraw = function (resourceType = RESOURCE_ENERGY) {
  if (!this.room.storage) {
    log(`${this.name} não achou storage em ${this.room.name}`, LOG_WARN, this.room.name)
    return
  }
  if (!this.pos.inRangeTo(this.room.storage, 1)) return this.moveTo(this.room.storage, REUSEPATHARGS)

  return this.withdraw(this.room.storage, resourceType)
}

Creep.prototype.goWithdrawFlex = function (resourceType = RESOURCE_ENERGY, storFilter = strc => strc.id === strc.room.storage.id) {
  const stor = this.pos.findClosestByRange(FIND_STRUCTURES, { filter: storFilter })

  if (!this.pos.inRangeTo(stor, 1)) {
    this.moveTo(stor, REUSEPATHARGS)
  } else {
    this.withdraw(stor, resourceType)
  }
}

Creep.prototype.goBuild = function (tryFind = true) {
  let constructSite = Game.getObjectById(this.memory.destConstSite)
  if (tryFind && !constructSite) {
    constructSite = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES)
  }
  if (!constructSite) {
    this.memory.role = this.name.split('_')[0]
    this.memory.building = false
    this.memory.destConstSite = false
    return
  }

  if (!this.pos.inRangeTo(constructSite, 3)) {
    return this.moveTo(constructSite)
  }

  this.memory.destConstSite = constructSite.id
  const buildResult = this.build(constructSite)
  if (buildResult === OK) return

  this.memory.building = false
  return this.goHarvest()
}

Creep.prototype.callReinforcements = function (role = 'grunt', limit = 1, energy = false) {
  const squad = this.room.nameToInt()
  this.room.createFlag(25, 25, `point_${squad}`)

  if (_.filter(Game.creeps, crp => crp.name.split('_')[2] === squad && crp.memory.role === role).length >= limit) return
  if (SpawnQueue.getCountByRole(role, this.memory.default_room) >= limit) return

  log(`${this.name} Calling for help`, LOG_INFO, this.room.name)
  if (!energy) energy = this.room.energyCapacityAvailable < 1800 ? 1600 : 2200

  SpawnQueue.addCreep(
    {
      roomName: this.memory.default_room,
      role: role,
      energy: energy,
      memory: { squad: squad }
    }
  )
}

Creep.prototype.shouldFlee = function (range = 5) {
  if (this.hits < this.hitsMax || this.pos.findInRange(FIND_HOSTILE_CREEPS, range).length > 0) {
    return true
  }
  return false
}
