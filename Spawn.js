Spawn.prototype.bodyBuilder = function bodyBuilder(energyCap, carryFactor = 600, workFactor = 1.8) {
    let carryCount = Math.ceil(energyCap / carryFactor)
    let workCount = Math.floor(Math.floor(energyCap / workFactor) / 100)
    let moveCount = Math.floor((energyCap - ((carryCount * 50) + (workCount * 100))) / 50)

    var bodyPts = []
    for (let i = 1; i <= moveCount; i++) { bodyPts = bodyPts.concat(MOVE) }
    for (let i = 1; i <= carryCount; i++) { bodyPts = bodyPts.concat(CARRY) }
    for (let i = 1; i <= workCount; i++) { bodyPts = bodyPts.concat(WORK) }

    return bodyPts // Está saindo da jaula o monstro!

}


Spawn.prototype.memoryBuilder = function(role, remotePos=false) {
    return {
        memory:
        {
            role: role,
            remotePos: remotePos? remotePos.pos:remotePos,
            default_controller: this.room.controller.id,
            default_spawn: this.id,
            default_spawn_name: this.name,
            default_room: this.room.name,
        }
    }
}


Spawn.prototype.easySpawnCreep = function (creepRole, energyCap, bodyParts = false, memory = false) {
    energyCap = energyCap < this.room.memory.maxBasicSize ? energyCap : this.room.memory.maxBasicSize

    var workPartFactor
    var carryPartFactor
    if (this.room.memory.controller_road && this.room.memory.spawn_roads) {
        workPartFactor = 1.5
        carryPartFactor = 500
    } else {
        workPartFactor = 1.8
        carryPartFactor = 600
    }
    bodyParts = bodyParts ? bodyParts : this.bodyBuilder(energyCap, carryPartFactor, workPartFactor)

    if (!memory) { memory = this.memoryBuilder(creepRole) }

    return this.spawnCreep(bodyParts, `${creepRole}_${Game.time}_${energyCap}`, memory)
}


Spawn.prototype.remoteHarvest = function (remotePos) {
    let memory = this.memoryBuilder("rharv", remotePos)
    let energyCap = Math.ceil(this.room.energyCapacityAvailable * 0.75)
    energyCap = energyCap < this.room.memory.maxBasicSize ? energyCap : this.room.memory.maxBasicSize
    let bodyPts = this.bodyBuilder(energyCap, 600)
    return this.easySpawnCreep("rharv", energyCap, bodyPts, memory)
}


Spawn.prototype.easySpawnFighter = function (creepRole, energyCap = 2000, squad = "000") {
    // Game.spawns["Spawn1"].easySpawnFighter("grunt", 2300)
    let toParts = creepRole == "shaman" ? 0 : Math.ceil(energyCap * 0.003)
    let bodyParts = this.fighterBodyBuilder(creepRole, energyCap, toParts)
    let memory = this.memoryBuilder(creepRole)

    return this.spawnCreep(bodyParts, `${creepRole}_${Game.time}_${squad}`, memory)
}


Spawn.prototype.fighterBodyBuilder = function fighterBodyBuilder(role, energyCap, toughCount = 0) {
    /*
    MOVE			50:     Move
    WORK			100:    Dismantles a structure for 50 hits per tick
    ATTACK			80:		30 hits per tick short-ranged
    RANGED_ATTACK	150:	10 hits per tick long-range 3 squares.
                            Attacks all hostile creeps/structures within 3 squares range with 1-4-10 hits
                            (depending on the range).
    HEAL			250:	Heals 12 hits per tick in short range or 4 hits per tick at a distance.
    TOUGH			10:		No effect, just additional hit points to the creep's body. Can be boosted to resist damage.
    */
    let moveCost = 50
    let workCost = 100
    let attackCost = 80
    let ranged_attackCost = 150
    let healCost = 250
    let toughCost = 10

    let armyRoles = {
        "shaman": [healCost, HEAL],
        "grunt": [attackCost, ATTACK],
        "hunter": [ranged_attackCost, RANGED_ATTACK],
        "demolisher": [workCost, WORK],
    }

    let [roleCost, rolePart] = armyRoles[role];
    let toughEnergy = toughCount * toughCost
    energyCap = energyCap - toughEnergy

    let roleMainProp = Math.ceil(roleCost / moveCost)
    let moveEnergy = energyCap / roleMainProp
    let roleMainEnergy = energyCap - moveEnergy

    let roleCount = Math.floor(roleMainEnergy / roleCost)
    let moveCount = Math.floor(moveEnergy / moveCost)
    var bodyPts = []

    for (let i = 1; i <= toughCount; i++) { bodyPts = bodyPts.concat(TOUGH) }
    for (let i = 1; i <= moveCount; i++) { bodyPts = bodyPts.concat(MOVE) }
    for (let i = 1; i <= roleCount; i++) { bodyPts = bodyPts.concat(rolePart) }

    return bodyPts
}
