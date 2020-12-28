require('WarCreep')

const REUSEPATHARGS = { reusePath: 6 }

Creep.prototype.run = function () {
  if (this.spawning && Game.time % 5 === 0) {
    log(`[${this.room.name}] => ${this.name}`, LOG_INFO, this.room.name)
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
    case 'supgr':
      return this.roleSUpgrader()
    case 'truck':
      return this.roleEuroTruck()
    case 'linker':
      return this.roleLinker()
    case 'grave':
      return this.roleGrave()
    case 'mason':
      return this.roleMason()
  }
}

function allowedStorages (storages) {
  return strc => storages.includes(strc.structureType) && strc.store.getFreeCapacity(RESOURCE_ENERGY) > 0
}

Creep.prototype.roleMason = function () {
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
  if (!target || target.structureType !== STRUCTURE_WALL) {
    const strucs = this.room.find(
      FIND_STRUCTURES,
      { filter: strc => strc.structureType === STRUCTURE_WALL && strc.hits < strc.hitsMax }
    )
    if (strucs.length === 0) {
      this.memory.role = 'upgr'
      return
    }
    target = strucs.sort((a, b) => a.hits - b.hits)[0]
    this.memory.goingTo = target.id
  }
  if (!this.pos.inRangeTo(target, 3)) return this.moveTo(target)
  return this.repair(target)
}

Creep.prototype.roleGrave = function () {
  if (this.memory.harvesting) return this.goHarvest(FIND_DROPPED_RESOURCES)
  return this.goDeposit()
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
  let flag
  let target
  if (this.store.getFreeCapacity() === 0) {
    flag = Game.flags.to
  } else {
    flag = Game.flags.from
  }

  if (this.room.name === flag.room.name) {
    target = this.room.storage
  } else {
    target = flag
  }

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

  if (this.room.controller.reservation && this.room.controller.reservation.username !== 'Harduim') {
    return this.attackController(this.room.controller)
  } else if (!this.room.controller.my && !this.room.controller.reservation) {
    return this.attackController(this.room.controller)
  } else {
    return this.reserveController(this.room.controller)
  }
}

Creep.prototype.roleRemoteHarvester = function () {
  const remotePos = this.memory.remotePos

  if (!remotePos) return

  if (this.room.find(FIND_HOSTILE_CREEPS).length > 0 || this.hits < this.hitsMax) {
    this.memory.role = 'upgr'
    return this.moveTo(Game.getObjectById(this.memory.default_spawn))
  }

  if (this.store.getFreeCapacity() > 0 && this.memory.harvesting && !this.memory.building) {
    if (this.pos.inRangeTo(remotePos, 1)) {
      this.memory.goingTo = false
      return this.goHarvest()
    } else {
      return this.moveTo(new RoomPosition(remotePos.x, remotePos.y, remotePos.roomName))
    }
  }

  if (!this.room.controller || !this.room.controller.my) {
    this.memory.goingTo = false
    const constructSite = Game.getObjectById(this.memory.destConstSite) || this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES)
    if (constructSite) {
      this.memory.destConstSite = constructSite
      this.memory.building = true
      return this.goBuild()
    }
    const closestDamagedStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (strc) => strc.structure === STRUCTURE_ROAD && strc.hits < strc.hitsMax
    })
    if (closestDamagedStructure && this.pos.inRangeTo(closestDamagedStructure, 3)) {
      this.repair(closestDamagedStructure)
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

  if (Game.time % 16 === 0) {
    const closestDamagedStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: strc => strc.hits < strc.hitsMax && ![STRUCTURE_WALL, STRUCTURE_RAMPART].includes(strc.structureType)
    })
    if (closestDamagedStructure && this.pos.inRangeTo(closestDamagedStructure, 3)) {
      this.repair(closestDamagedStructure)
    }
  }

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

Creep.prototype.roleSUpgrader = function () {
  const originalRole = this.name.split('_')[0]
  if (Game.time % 50 === 0 && originalRole !== 'supgr' && this.store[RESOURCE_ENERGY] === 0) {
    this.memory.role = originalRole
    return
  }
  if (this.memory.upgrading && this.store[RESOURCE_ENERGY] === 0) this.memory.upgrading = false
  if (!this.memory.upgrading && this.store.getFreeCapacity() === 0) this.memory.upgrading = true

  const controller = Game.getObjectById(this.memory.default_controller)
  if (this.memory.upgrading) {
    if (this.upgradeController(controller) === ERR_NOT_IN_RANGE) {
      this.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } })
    }
    return
  }
  return this.goWithdraw()
}

Creep.prototype.roleUpgrader = function () {
  const originalRole = this.name.split('_')[0]
  if (Game.time % 5 === 0 && originalRole !== 'upgr' && this.store[RESOURCE_ENERGY] === 0) {
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
  if (originalRole !== 'upgr' || !this.room.storage || this.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 150000) {
    return this.goHarvest()
  }
  return this.goWithdraw()
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

Creep.prototype.goBuild = function () {
  const constructSite = Game.getObjectById(this.memory.destConstSite) || this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES)
  if (!constructSite) {
    this.memory.role = 'harv'
    this.memory.building = false
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
