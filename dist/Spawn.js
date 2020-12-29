Spawn.prototype.run = function () {
  if (this.spawning || Game.time % 10 !== 0 || this.room.energyAvailable < 300) return
  const protoCreep = SpawnQueue.getCreep(this.room.name)

  if (!protoCreep) return

  if (ARMYROLES.includes(protoCreep.role)) {
    return
  }

  const spnResult = this.easySpawnCreep(protoCreep)

  if (spnResult !== 0) {
    log(`Spawn unsuccessful: ${spnResult}`, LOG_DEBUG)
    SpawnQueue.addCreep(protoCreep)
  }

  return spnResult
}

Spawn.prototype.bodyBuilder = function (energyCap, carryFactor = 600, workFactor = 1.8) {
  const carryCount = Math.ceil(energyCap / carryFactor)
  const workCount = Math.floor(Math.floor(energyCap / workFactor) / 100)
  const moveCount = Math.floor((energyCap - ((carryCount * 50) + (workCount * 100))) / 50)

  let bodyPts = []
  for (let i = 1; i <= moveCount; i++) { bodyPts = bodyPts.concat(MOVE) }
  for (let i = 1; i <= carryCount; i++) { bodyPts = bodyPts.concat(CARRY) }
  for (let i = 1; i <= workCount; i++) { bodyPts = bodyPts.concat(WORK) }

  return bodyPts // Está saindo da jaula o monstro!
}

Spawn.prototype.memoryBuilder = function (role, remotePos = false) {
  return {
    memory:
        {
          role: role,
          remotePos: remotePos ? remotePos.pos : remotePos,
          default_controller: this.room.controller.id,
          default_spawn: this.id,
          default_spawn_name: this.name,
          default_room: this.room.name
        }
  }
}

Spawn.prototype.easySpawnCreep = function ({ role, energy, body = false, memory = false }) {
  energy = energy < this.room.memory.maxBasicSize ? energy : this.room.memory.maxBasicSize

  if (energy < 300) return ERR_NOT_ENOUGH_ENERGY

  if (!role) {
    log(`${JSON.stringify(role)} ${JSON.stringify(memory)}`, LOG_FATAL, this.room.name)
    return ERR_INVALID_ARGS
  }

  let workPartFactor
  let carryPartFactor
  if (this.room.memory.controller_road && this.room.memory.spawn_roads) {
    workPartFactor = 1.5
    carryPartFactor = 500
  } else {
    workPartFactor = 1.8
    carryPartFactor = 600
  }
  body = body || this.bodyBuilder(energy, carryPartFactor, workPartFactor)

  if (memory) {
    memory.memory.role = role
    memory.memory.default_spawn = this.id
    memory.memory.default_spawn_name = this.name
  } else {
    memory = this.memoryBuilder(role)
  }

  return this.spawnCreep(body, `${role}_${Game.time}_${energy}`, memory)
}

Spawn.prototype.remoteHarvest = function (remotePos) {
  const memory = this.memoryBuilder('rharv', remotePos)
  let energyCap = Math.ceil(this.room.energyCapacityAvailable * 0.75)
  energyCap = energyCap < this.room.memory.maxBasicSize ? energyCap : this.room.memory.maxBasicSize
  const bodyPts = this.bodyBuilder(energyCap, 600)
  return this.easySpawnCreep('rharv', energyCap, bodyPts, memory)
}

Spawn.prototype.easySpawnFighter = function (creepRole, energyCap = 2000, squad = '000') {
  const toParts = creepRole === 'shaman' ? 0 : Math.ceil(energyCap * 0.003)
  const bodyParts = this.fighterBodyBuilder(creepRole, energyCap, toParts)
  const memory = this.memoryBuilder(creepRole)

  return this.spawnCreep(bodyParts, `${creepRole}_${Game.time}_${squad}`, memory)
}

Spawn.prototype.fighterBodyBuilder = function fighterBodyBuilder (role, energyCap, toughCount = 0) {
  /*
    MOVE           50:     Move
    WORK           100:    Dismantles a structure for 50 hits per tick
    ATTACK         80:     30 hits per tick short-ranged
    RANGED_ATTACK  150:    10 hits per tick long-range 3 squares.
                            Attacks all hostile creeps/structures within 3 squares range with 1-4-10 hits
                            (depending on the range).
    HEAL           250:    Heals 12 hits per tick in short range or 4 hits per tick at a distance.
    TOUGH          10:     No effect, just additional hit points to the creep's body. Can be boosted to resist damage.
    */

  const moveCost = 50
  const workCost = 100
  const attackCost = 80
  const rangedAttackCost = 150
  const healCost = 250
  const toughCost = 10

  const armyRoles = {
    shaman: [healCost, HEAL],
    grunt: [attackCost, ATTACK],
    hunter: [rangedAttackCost, RANGED_ATTACK],
    demolisher: [workCost, WORK],
    tank: [attackCost, TOUGH]
  }

  const [roleCost, rolePart] = armyRoles[role]
  const toughEnergy = toughCount * toughCost
  energyCap = energyCap - toughEnergy

  const roleMainProp = Math.ceil(roleCost / moveCost)
  const moveEnergy = energyCap / roleMainProp
  const roleMainEnergy = energyCap - moveEnergy

  const roleCount = Math.floor(roleMainEnergy / roleCost)
  const moveCount = Math.floor(moveEnergy / moveCost)
  let bodyPts = []

  for (let i = 1; i <= toughCount; i++) { bodyPts = bodyPts.concat(TOUGH) }
  for (let i = 1; i <= roleCount; i++) { bodyPts = bodyPts.concat(rolePart) }
  for (let i = 1; i <= moveCount; i++) { bodyPts = bodyPts.concat(MOVE) }

  return bodyPts
}
