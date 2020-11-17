Creep.prototype.roleArmy = function () {
    let rallyPoint = Game.flags["point_" + this.name.split("_")[2]]

    if (rallyPoint) {
        if (this.room.name != rallyPoint.pos.roomName) {
            return this.moveTo(rallyPoint)
        }
    }

    switch (this.memory.role) {
        case 'shaman':
            return this.roleShaman()
        case 'grunt':
            return this.roleGrunt()
        case 'demolisher':
            return this.roleDemolisher()
        case 'hunter':
            return this.roleHunter()
    }
}


Creep.prototype.roleGrunt = function () {
    var tgt = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (!tgt) {
        tgt = this.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
    }

    if (!tgt) { return }

    if (this.pos.inRangeTo(tgt, 1)) { return this.attack(tgt) }
    else { return this.moveTo(tgt) }
}


Creep.prototype.roleDemolisher = function () {
    let toDemo = this.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
        filter: function (struc) {
            return struc.structureType != STRUCTURE_STORAGE
        }
    })
    if (toDemo) {
        if (this.pos.inRangeTo(toDemo, 1)) { return this.dismantle(toDemo) }
        else { return this.moveTo(toDemo) }
    }
}


Creep.prototype.roleShaman = function () {
    if (this.hits < (this.hitsMax * 0.8)) {
        return this.heal(this)
    }
    let ARMYROLES = this.memory.ARMYROLES
    let closestHurt = this.pos.findClosestByRange(
        FIND_MY_CREEPS,
        {
            filter: function (creep) {
                return ARMYROLES.includes(creep.memory.role) && creep.hits < creep.hitsMax
            }
        }
    )
    if (closestHurt) {
        if (this.pos.inRangeTo(closestHurt, 1)) {
            return this.heal(closestHurt)
        }
        else {
            return this.moveTo(closestHurt)
        }
    }

    if (this.hits < this.hitsMax) {
        return this.heal(this)
    }
    // temporário até criar formações
    let closestAttacker = this.pos.findClosestByRange(
        FIND_MY_CREEPS,
        {
            filter: function (creep) {
                return ["demolisher", "grunt"].includes(creep.memory.role)
            }
        }
    )
    this.moveTo(closestAttacker)
}
