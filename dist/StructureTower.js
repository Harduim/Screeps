StructureTower.prototype.run = function run () {
  const closestHostile = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
  if (closestHostile && this.pos.getRangeTo(closestHostile) < 25) {
    return this.attack(closestHostile)
  }

  const closestMyCreep = this.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: (creep) => creep.hits < creep.hitsMax
  })
  if (closestMyCreep && Game.time % 2 == 0 && this.pos.getRangeTo(closestMyCreep) < 20) {
    return this.heal(closestMyCreep)
  }
  const closestDamagedStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: (structure) => (structure.hits < structure.hitsMax) && (structure.hits <= 40000)
  })
  if (closestDamagedStructure && Game.time % 5 == 0) {
    return this.repair(closestDamagedStructure)
  }
}
