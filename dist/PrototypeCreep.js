Creep.prototype.run = function () {
  return ROLES[this.memory.role]()
}

Creep.prototype.toString = function () {
  return `[${this.name}] Role:${this.memory.role} Room:${this.room.name}`
}

Creep.prototype.lookArround = function (lookType) {
  const target = this.room.lookForAtArea(
    lookType, this.pos.y - 1, this.pos.x - 1, this.pos.y + 1, this.pos.x + 1, true
  )
  const objPath = `[0].${lookType}.id`
  return _.get(target, objPath, false)
}

Creep.prototype.shouldFlee = function (range = 5) {
  if (this.hits < this.hitsMax || this.pos.findInRange(FIND_HOSTILE_CREEPS, range).length > 0) {
    return true
  }
  return false
}

Creep.prototype.passingRepair = function () {
  const allowed = [STRUCTURE_ROAD, STRUCTURE_CONTAINER]
  const damaged = this.pos.findInRange(
    FIND_STRUCTURES, 1, { filter: (strc) => allowed.includes(strc.structureType) && strc.hits < strc.hitsMax }
  )
  if (damaged.length > 0) this.repair(damaged[0])
}