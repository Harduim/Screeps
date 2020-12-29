Room.prototype.run = function run () {
  if (!this.controller || !this.controller.level || !this.controller.my) return
  this.memory.sourcesCount = this.memory.sourcesCount || this.find(FIND_SOURCES).length

  this.runTaksSchedule(
    [
      { controllerLvl: [3, 8], schedule: 1, name: 'runTowers', args: false },
      { controllerLvl: [4, 8], schedule: 4, name: 'teleportEnergy', args: false },
      { controllerLvl: [3, 8], schedule: 13, name: 'roadMaker', args: false },
      { controllerLvl: [1, 8], schedule: 14, name: 'roomCoordinator', args: false },
      { controllerLvl: [1, 8], schedule: 16, name: 'defend', args: false },
      { controllerLvl: [3, 3], schedule: 51, name: 'controllerRoadMaker', args: false },
      { controllerLvl: [3, 8], schedule: 52, name: 'towerMaker', args: false }
    ]
  )
}


Room.prototype.nameToInt = function (name) {
  const nums = []
  let c
  for (c of name) nums.push(c.charCodeAt(0))
  return nums.join('')

}

Room.prototype.testFunc = function (arg = '!arg', arg2 = '!arg2', arg3 = '!arg3') {
  log(`testFunc args: ${arg}|${arg2}|${arg3}`, LOG_FATAL, this.name)
}

Room.prototype.runTaksSchedule = function (tasks) {
  const cLvl = this.controller.level
  let tsk, minLvl, maxlvl
  for (tsk of tasks) {
    [minLvl, maxlvl] = tsk.controllerLvl
    if (cLvl < minLvl || cLvl > maxlvl || Game.time % tsk.schedule !== 0) {
      continue
    }
    tsk.args ? this[tsk.name](...tsk.args) : this[tsk.name]()
  }
}

Room.prototype.creepFilterByRole = function (role, creepList) {
  return _.filter(creepList, crp => crp.memory.role === role)
}

Room.prototype.creepFilterByPrefix = function (prefix, creepList) {
  return _.filter(creepList, crp => crp.name.split('_')[0] === prefix)
}

Room.prototype.roomCoordinator = function () {
  const hostiles = this.find(FIND_HOSTILE_CREEPS)
  if (hostiles.length > 0) {
    this.memory.underAttack = true
  } else {
    this.memory.underAttack = false
  }
  this.memory.hostiles = hostiles.length

  const controllerId = this.controller.id
  const structs = this.find(FIND_MY_STRUCTURES)
  const constSites = this.find(FIND_CONSTRUCTION_SITES)
  const creepsOwned = _.filter(Game.creeps, creep => (
    creep.memory.default_controller === controllerId && creep.name.split('_')[0] !== 'seed'
  ))

  this.census(creepsOwned)
  this.queueBasics()
  this.structureCensus(structs)
  this.buffLinkerDirectives(creepsOwned, structs)
  this.harvUpgrBuilDirectives(creepsOwned, constSites)
  if (this.storage) {
    const buffBody = this.energyCapacityAvailable > 1800 ? BIGCARRYPTS : SMALLCARRYPTS
    this.queueLocal('buff', 4, buffBody)
    if (this.memory.mainLink) this.queueLocal('linker', 5, SMALLCARRYPTS) 
  }
  if (this.energyAvailable === this.energyCapacityAvailable) {
    this.queueRemote('rharv', 4)
    this.queueRemote('claim', 5, [MOVE, MOVE, CLAIM, CLAIM])
  }
  structs.filter(strc => strc.structureType == STRUCTURE_SPAWN && strc.consumeQueue())
}

Room.prototype.census = function (creepsOwned) {
  this.memory.censusByRole = _.countBy(creepsOwned, crp => crp.memory.role)
  this.memory.censusByPrefix = _.countBy(creepsOwned, crp => crp.name.split('_')[0])

  log(`Census =>${JSON.stringify(this.memory.censusByPrefix)}`, LOG_INFO, this.name)

  if (this.energyCapacityAvailable < 1800) {
    this.memory.harvMax = this.memory.sourcesCount + 2
    this.memory.upgrMax = this.memory.sourcesCount
    this.memory.builMax = this.memory.sourcesCount + 1
    this.memory.maxBasicSize = 1600
  } else {
    this.memory.harvMax = this.memory.sourcesCount
    this.memory.upgrMax = 1
    this.memory.builMax = 1
    this.memory.maxBasicSize = 2200
  }

  if (this.name === 'sim') {
    this.memory.harvMax = 3
    this.memory.upgrMax = 2
  }
}

Room.prototype.structureCensus = function (structs) {
  const mStorage = this.storage

  // Link cache
  if ((!this.memory.mainLink || !Game.getObjectById(this.memory.mainLink.id)) && mStorage) {
    const mlFilter = strc => strc.structureType === STRUCTURE_LINK && strc.pos.inRangeTo(mStorage, 5)
    const mLink = _.filter(structs, mlFilter)
    if (mLink.length > 0) {
      this.memory.mainLink = mLink[0]
    }
  }
  if (mStorage) {
    const blFilter = strc => strc.structureType === STRUCTURE_LINK && !strc.pos.inRangeTo(mStorage, 5)
    this.memory.borderLinks = _.filter(structs, blFilter)
  }
}

Room.prototype.buffLinkerDirectives = function (creepsOwned, structs) {
  /*  ---------- Linker <=> Buff ---------
        - If all links are empty or on cooldown Linker should assume Buff role.
        - If there is no Buff, a Linker should assume the Buff role.
        - If there a Linker on the buff role and Buff exists Linker should switch back to linker role.
    */
  if ((this.memory.censusByRole.linker || 0) === 0 || !this.storage) return

  if ((this.memory.censusByRole.buff || 0) === 0) {
    const linker = this.creepFilterByRole('linker', creepsOwned)[0]
    linker.memory.role = 'buff'
    log(`${linker.name} => buff`, LOG_DEBUG, this.name)
    return
  }

  const linksActive = strc => strc.structureType === STRUCTURE_LINK && strc.store.energy > 0 && strc.cooldown <= 5

  if ((this.memory.censusByRole.buff || 0) > 0 && _.filter(structs, linksActive).length > 0) {
    const linkersBuff = _.filter(
      creepsOwned, crp => crp.memory.role === 'buff' && crp.name.split('_')[0] === 'linker'
    )
    if (linkersBuff.length > 0) {
      linkersBuff[0].memory.role = 'buff'
      log(`${linkersBuff[0].name} => linker`, LOG_DEBUG, this.name)
    }
  }
}

Room.prototype.harvUpgrBuilDirectives = function (creepsOwned, constSites) {
  /*  ---------- Harvester <=> [Builder, Upgr, Supgr]
        - Should only switch role if:
            - Room energy available === capacity or;
            - There is a Buff and room.store has been filled to at least double room capacity or.
        - Only one should switch to Builder if there is a construction site
        - Should switch to Upgr or Supgr (depending if room.storage exists) if no sources available
    */
  const rHarvs = this.creepFilterByRole('harv', creepsOwned)
  const pHarvs = this.creepFilterByPrefix('harv', creepsOwned)
  let balance = false
  if (this.storage) {
    if ((this.memory.censusByRole.buff || 0) === 0) {
      balance = true
    }
  } else {
    if (this.energyAvailable < this.energyCapacityAvailable) {
      balance = true
    }
  }
  if (balance) {
    _.forEach(pHarvs, function (harv) { harv.memory.role = 'harv' })
    return
  }
  const buildCount = this.memory.censusByRole.buil || 0
  if (this.storage) {
    const storageUsedCapacity = this.storage.store.getUsedCapacity(RESOURCE_ENERGY)
    if (storageUsedCapacity < this.energyCapacityAvailable || buildCount > 0) return
  }

  // Harv => Builder
  if (constSites.length > 0 && buildCount < this.memory.builMax) {
    let builder
    const harvs = rHarvs.length === 0 ? pHarvs : rHarvs
    if (harvs.length > 0) {
      builder = harvs[0]
      builder.memory.role = 'buil'
      log(`${builder.name} => buil`, LOG_DEBUG, this.name)
      return
    }
  }
  // Builder => Harv will remain on .goBuild and main.balanceCreeps

  // Harv => Upgr
  if (this.energyAvailable === this.energyCapacityAvailable &&
    (!this.storage || this.find(FIND_SOURCES_ACTIVE).length === 0)) {
    _.forEach(rHarvs, function (harv) { harv.memory.role = 'upgr' })
  }
  // Upgr => Harv will remain on .roleUpgrader and main.balanceCreeps
}

Room.prototype.queueBasics = function () {
  const minEnergy = this.energyAvailable > 300 ? this.energyAvailable : 300
  const harvCount = this.memory.censusByPrefix.harv || 0
  const upgrCount = this.memory.censusByPrefix.upgr || 0
  let harvQ = SpawnQueue.getCountByRole('harv', this.name)
  let upgrQ = SpawnQueue.getCountByRole('upgr', this.name)
  log(`hq:${harvQ} uq:${upgrQ}`, LOG_DEBUG, this.name)

  if (harvCount === 0 && harvQ === 0) {
    SpawnQueue.addCreep({ roomName: this.name, role: 'harv', energy: minEnergy, priority: -1 })
    harvQ++
  }
  if (upgrCount === 0 && upgrQ === 0) {
    SpawnQueue.addCreep({ roomName: this.name, role: 'upgr', energy: minEnergy, priority: 0 })
    upgrQ++
  }
  if (harvQ + harvCount < this.memory.harvMax) {
    SpawnQueue.addCreep({ roomName: this.name, role: 'harv', energy: this.energyCapacityAvailable })
  }
  if (upgrQ + upgrCount < this.memory.upgrMax) {
    SpawnQueue.addCreep({ roomName: this.name, role: 'upgr', energy: this.energyCapacityAvailable })
  }
}

Room.prototype.runTowers = function () {
  const structs = this.find(FIND_STRUCTURES)
  const towers = _.filter(structs, struc => struc.structureType === STRUCTURE_TOWER)

  if (towers.length === 0) return

  let mainSpawn = _.filter(structs,
    struc => struc.structureType === STRUCTURE_SPAWN && struc.memory.hasOwnProperty('main') // eslint-disable-line
  )
  if (mainSpawn.length === 0) {
    // Fallback to individual tower logic
    _.forEach(towers, tower => tower.run())
    return
  }
  mainSpawn = mainSpawn[0]

  // definir limite maximo de ataque, assim as torres vao reparar os muros e ramparts
  const hostile = mainSpawn.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
  if (hostile) {
    _.forEach(towers, tower => tower.attack(hostile))
    return
  }

  if (Game.time % 2 === 0) {
    const closestMyCreep = mainSpawn.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: (creep) => creep.hits < creep.hitsMax
    })
    if (closestMyCreep && mainSpawn.pos.getRangeTo(closestMyCreep) < 20) {
      _.forEach(towers, tower => tower.heal(closestMyCreep))
      return
    }
  }

  if (Game.time % 10 === 0) {
    const strucWallRampart = [STRUCTURE_WALL, STRUCTURE_RAMPART]
    const lessHits = obj => _.reduce(obj, (a, b) => a.hits <= b.hits ? a : b)

    const nonWallDamaged = _.filter(structs, struc => !strucWallRampart.includes(struc.structureType) && struc.hits < struc.hitsMax)
    if (nonWallDamaged.length > 0) {
      const tower = towers.pop()
      tower.repair(lessHits(nonWallDamaged))
    }

    if (towers.length === 0 || !(this.storage && this.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 30000)) return

    const damaged = _.filter(structs, struc => strucWallRampart.includes(struc.structureType) && struc.hits < struc.hitsMax)
    const target = lessHits(damaged)
    if (damaged.length > 0) _.forEach(towers, tower => tower.repair(target))
  }
}

Room.prototype.teleportEnergy = function () {
  if (!this.storage || !this.memory.mainLink) return

  const mLink = Game.getObjectById(this.memory.mainLink.id)

  _.forEach(this.memory.borderLinks, function (lnk) {
    if (lnk.cooldown > 0 || mLink.store.energy >= 770) return
    const bLink = Game.getObjectById(lnk.id)
    if (bLink) {
      bLink.transferEnergy(mLink)
    }
  })
}

Room.prototype.controllerRoadMaker = function () {
  if (this.memory.controller_road) return

  const sources = this.find(FIND_SOURCES)
  for (const src in sources) {
    const path = this.findPath(sources[src].pos, this.controller.pos, {
      ignoreCreeps: true,
      maxOps: 200,
      swampCost: 4,
      ignoreRoads: true
    })
    path.splice(-1, 1)
    path.splice(0, 1)
    for (const coord in path) {
      const coords = path[coord]
      this.createConstructionSite(coords.x, coords.y, STRUCTURE_ROAD)
    }
  }
  this.memory.controller_road = true
}

function findFlags (flagRole, roomName) {
  return _.filter(
    Game.flags,
    function (flag) {
      const [fName, fRole] = flag.name.split('_')
      return fName === roomName && fRole === flagRole
    }
  ) // filter
}


Room.prototype.queueLocal = function (queueType = 'harv', controllerLvl = 1, body = false) {
  if (this.controller.level < controllerLvl) return
  if ((this.memory.censusByPrefix[queueType] || 0) > 0) return
  if (SpawnQueue.getCountByRole(queueType) > 0) return

  let energy = Math.ceil(this.energyCapacityAvailable * 0.75)
  energy = energy < this.memory.maxBasicSize ? energy : this.memory.maxBasicSize

  SpawnQueue.addCreep(
    {
      roomName: this.name,
      role: queueType,
      energy: energy,
      priority: DEFAULT_ROLE_PRIORITY[queueType],
      body: body || SpawnQueue.bodyBuilder(energy),
      memory: {
        remotePos: false,
        memory: {
          role: queueType,
          remotePos: false,
          default_controller: this.controller.id,
          default_room: this.name
        } // memory inner
      } // memory outer
    }
  ) // add creep
}


Room.prototype.queueRemote = function (queueType = 'rharv', controllerLvl = 1, body = false) {
  if (this.controller.level < controllerLvl) return
  const roomName = this.name
  let flags = findFlags(queueType, roomName)
  if (flags.length === 0) return
  flags = _.sortBy(flags, 'name')

  const roomQ = SpawnQueue.getRoomQueue(roomName)
  let flg
  for (flg of flags) {
    function creepFilter (crp) {
      return crp.memory.remotePos &&
             crp.memory.remotePos.roomName === flg.pos.roomName &&
             crp.memory.remotePos.x === flg.pos.x &&
             crp.memory.remotePos.y === flg.pos.y
    }

    if (_.filter(Game.creeps, creepFilter).length > 0) continue
    if (roomQ.filter(creepFilter).length > 0) continue

    let energy = Math.ceil(this.energyCapacityAvailable * 0.75)
    energy = energy < this.memory.maxBasicSize ? energy : this.memory.maxBasicSize
    SpawnQueue.addCreep(
      {
        roomName: roomName,
        role: queueType,
        energy: energy,
        priority: DEFAULT_ROLE_PRIORITY[queueType],
        body: body || SpawnQueue.bodyBuilder(energy),
        memory: {
          remotePos: flg.pos,
          memory: {
            role: queueType,
            remotePos: flg.pos,
            default_controller: this.controller.id,
            default_room: roomName
          } // memory inner
        } // memory outer
      }
    ) // add creep
  } // for loop
}

Room.prototype.defend = function () {
  const enemyCreeps = this.find(FIND_CREEPS, {
    filter: (crp) => !crp.my &&
      crp.owner.username !== 'Invader' &&
      (crp.getActiveBodyparts(ATTACK) > 0 || crp.getActiveBodyparts(RANGED_ATTACK) > 0)
  })
  if (enemyCreeps.length > 0) {
    const spawns = this.find(FIND_MY_SPAWNS, FREE_SPAWNS)
    const energyCap = this.energyCapacityAvailable < 1800 ? 1600 : 2200
    this.createFlag(20, 25, 'point_999')
    _.forEach(spawns, function (spn) { spn.easySpawnFighter('grunt', energyCap, 999) })
    this.controller.activateSafeMode()
  }
}

Room.prototype.roadMaker = function () {
  if (this.controller.level < 3 || this.memory.spawn_roads) return

  const spawn = this.find(FIND_MY_SPAWNS, { filter: (spn) => spn.memory.main === true })[0]
  if (!spawn) return
  log(`RoadMaker spawn:${spawn}`, LOG_DEBUG, this.name)
  const sources = this.find(FIND_SOURCES)
  for (const src in sources) {
    const path = spawn.pos.findPathTo(sources[src], { ignoreCreeps: true, maxOps: 100, swampCost: 4, ignoreRoads: true })
    path.splice(-1, 1)
    path.splice(0, 1)
    for (const coord in path) {
      const coords = path[coord]
      this.createConstructionSite(coords.x, coords.y, STRUCTURE_ROAD)
    }
  }
  this.memory.spawn_roads = true
}

Room.prototype.towerMaker = function () {
  if (!this.controller) return
  const controllerLevel = this.controller.level
  if (controllerLevel < 3) return
  if (this.find(FIND_CONSTRUCTION_SITES).length !== 0) {
    return
  }
  const towerNum = this.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } }).length
  const towerLimit = { 1: 0, 2: 0, 3: 1, 4: 1, 5: 2, 6: 2, 7: 3, 8: 6 }[controllerLevel]
  if (towerLimit === towerNum) {
    return
  }
  // x and y
  const towerOffets = {
    0: [-1, 2],
    1: [-2, -1],
    2: [2, 1],
    3: [1, -2],
    4: [-1, 2],
    5: [-2, -1],
    6: [2, 1],
    7: [1, -2]
  }[towerNum]

  const spawn = this.find(FIND_MY_SPAWNS, { filter: (spn) => spn.memory.main === true })[0]
  if (!spawn) return
  const coordX = spawn.pos.x
  const coordY = spawn.pos.y
  const [offsetX, offsetY] = towerOffets
  this.createConstructionSite(coordX + offsetX, coordY + offsetY, STRUCTURE_TOWER)
}

function extensionOffsetFinder (n) {
  return {
    0: [2, 0],
    1: [-2, 0],
    2: [0, 2],
    3: [0, -2],
    4: [1, 1],
    5: [-1, -1],
    6: [-1, 1],
    7: [1, -1],
    8: [3, 0],
    9: [-3, 0],
    10: [0, 3],
    11: [0, -3],
    12: [3, 1],
    13: [-3, 1],
    14: [3, -1],
    15: [-3, -1],
    16: [1, 3],
    17: [1, -3],
    18: [-1, 3],
    19: [-1, -3],
    20: [2, 2],
    21: [2, -2],
    22: [-2, 2],
    23: [-2, -2],
    24: [4, 0],
    25: [-4, 0],
    26: [0, 4],
    27: [0, -4],
    28: [4, 1],
    29: [4, -1],
    30: [-4, 1],
    31: [-4, -1],
    32: [5, 0],
    33: [-5, 0],
    34: [0, 5],
    35: [0, -5],
    36: [6, 0],
    37: [-6, 0],
    38: [0, 6],
    39: [0, -6],
    40: [1, 5],
    41: [1, -5],
    42: [-1, 5],
    43: [-1, -5],
    44: [5, 1],
    45: [-5, 1],
    46: [5, -1],
    47: [-5, -1],
    48: [2, 4],
    49: [2, -4],
    50: [-2, 4],
    51: [-2, -4],
    52: [4, 2],
    53: [-4, 2],
    54: [4, -2],
    55: [-4, -2],
    56: [-3, -3],
    57: [-3, 3],
    58: [3, -3],
    59: [3, -3]
  }[n]
}

Room.prototype.extencionMaker = function () {
  if (!this.controller.my || this.find(FIND_CONSTRUCTION_SITES).length !== 0) return

  const extsNum = this.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } }).length
  const controllerLevel = this.controller.level
  const extencionsMax = { 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60 }[controllerLevel]

  if (extencionsMax === extsNum) return

  const spawn = this.find(FIND_MY_SPAWNS, { filter: (spn) => spn.memory.main === true })[0]
  if (!spawn) return
  const coordX = spawn.pos.x
  const coordY = spawn.pos.y
  const [offsetX, offsetY] = extensionOffsetFinder(extsNum)
  this.createConstructionSite(coordX + offsetX, coordY + offsetY, STRUCTURE_EXTENSION)
}
