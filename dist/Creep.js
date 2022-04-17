const main = (creep) => {
  console.log("")
}

Creep.prototype.run = function () {
  if (this.spawning && Game.time % 10 === 0) {
    log(`${this.name}`, LOG_INFO, this.room.name)
    return
  }

  if (this.memory.relocate) {
    const rallyPoint = Game.flags.reloc
    if (rallyPoint) {
      if (this.room.name !== rallyPoint.pos.roomName) return this.moveTo(rallyPoint)
      this.memory.relocate = false
    }
  }
  try {
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
  } catch (error) {
    log(error, LOG_FATAL)
  }
}

function allowedStorages(storages) {
  return strc => storages.includes(strc.structureType) && strc.store.getFreeCapacity(RESOURCE_ENERGY) > 0
}


Creep.prototype.roleGrave = function () {
  if (this.memory.harvesting) return this.goHarvest(FIND_DROPPED_RESOURCES)
  return this.goDeposit()
}

function storageFilter(strc) {
  let aStorages = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN]
  if (strc.room.energyAvailable === strc.room.energyCapacityAvailable) {
    aStorages = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_STORAGE]
  }
  return aStorages.includes(strc.structureType) && strc.store.getFreeCapacity(RESOURCE_ENERGY) > 0
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