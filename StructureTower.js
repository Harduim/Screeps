StructureTower.prototype.run = function run () {
    let closestHostile = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS)
    if (closestHostile) {
        return this.attack(closestHostile)
    }

    let closestMyCreep = this.pos.findClosestByRange(FIND_MY_CREEPS, {
        filter: (creep) => creep.hits < creep.hitsMax
    })
    if (closestMyCreep && Game.time % 2 == 0) {
        return this.heal(closestMyCreep)
    }
    let closestDamagedStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => (structure.hits < structure.hitsMax) && structure.structureType != STRUCTURE_WALL
    })
    if (closestDamagedStructure && Game.time % 4 == 0) {
        return this.repair(closestDamagedStructure)
    }
}
