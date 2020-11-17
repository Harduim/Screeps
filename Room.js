const MAXRHARV = 2
const SMALLCARRYPTS = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]
const BIGCARRYPTS = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, CARRY, MOVE, CARRY, MOVE]

function freeSpawns(spn) { return spn.spawning == null }

Room.prototype.run = function run(MYDEBUG) {
    if (!this.controller || !this.controller.level || !this.controller.my) { return }
    this.memory.MYDEBUG = MYDEBUG
    this.memory.sourcesCount = this.memory.sourcesCount || this.find(FIND_SOURCES).length
    this.every1000Ticks()
    this.every500Ticks()
    this.every100Ticks()
    this.every50Ticks()
    this.every15Ticks()

    switch (this.controller.level) {
        case 1:
            this.seedRoom()
            break;
        case 2:
            this.seedRoom()
            break;
        case 3:
            this.runStructs(STRUCTURE_TOWER)
            this.controllerRoadMaker()
            break;
        case 4:
            this.runStructs(STRUCTURE_TOWER)
            this.storageMaker()
            break;
        case 5:
        case 6:
        case 7:
        case 8:
            this.teleportEnergy()
            this.runStructs(STRUCTURE_TOWER)
            break;
    }
}


Room.prototype.runStructs = function runStructs(strucType) {
    let strucFilter = { filter: { structureType: strucType } }
    _.forEach(this.find(FIND_MY_STRUCTURES, strucFilter), function (str) { str.run() })
}


Room.prototype.teleportEnergy = function () {
    if (!this.storage || Game.time % 5 != 0) { return }

    let links = this.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_LINK } })
    if (links.length == 0) { return }

    let roomStorage = this.storage
    let borderLinks = _.filter(links, function (lnk) { return !lnk.pos.inRangeTo(roomStorage, 5) })
    if (borderLinks.length == links.length) { return }
    let mainLink = _.filter(links, function (lnk) { return lnk.pos.inRangeTo(roomStorage, 5) })[0]

    _.forEach(borderLinks, function (lnk) {
        if (lnk.cooldown > 0) { return }
        lnk.transferEnergy(mainLink)
    })

}


Room.prototype.controllerRoadMaker = function () {
    if (this.memory.controller_road) { return }

    let sources = this.find(FIND_SOURCES)
    for (let src in sources) {
        let path = this.findPath(sources[src].pos, this.controller.pos, {
            ignoreCreeps: true,
            maxOps: 200,
            swampCost: 4,
            ignoreRoads: true
        });
        path.splice(-1, 1)
        path.splice(0, 1)
        for (let coord in path) {
            let coords = path[coord]
            let result = this.createConstructionSite(coords.x, coords.y, STRUCTURE_ROAD)
            console.log("Create controller road result: " + result)
        }
    }
    this.memory.controller_road = true
}

Room.prototype.seedRoom = function () {
    if (!this.controller.my || this.memory.basicCount > 1) {
        return
    }

    let controllerId = this.controller.id
    let mycreepsHere = _.filter(Game.creeps, function (creep) {
        return creep.memory.default_controller == controllerId
    });
    let seedCount = this.creepCounter('seed', mycreepsHere)
    if (seedCount > 4) { return }

    for (var name in Game.rooms) {
        var otherRoom = Game.rooms[name]
        if ((!otherRoom.controller.my) || (this.name == otherRoom.name)) {
            continue
        }
        break;
    }
    let otherSpawns = otherRoom.find(FIND_MY_SPAWNS, { filter: freeSpawns })
    if (otherSpawns.length == 0) { return }

    let seedingResult = otherSpawns[0].spawnCreep(
        [TOUGH, CARRY, MOVE, MOVE, MOVE, WORK, MOVE, MOVE, CARRY, WORK],
        "seed_" + Game.time + "_400", {
        memory: {
            role: "upgr",
            default_controller: this.controller.id,
        }
    }
    )
    console.log("seeding spawn result: " + seedingResult)

}


Room.prototype.maintainClaim = function () {
    let roomName = this.name
    let desiredRoom = _.filter(Game.flags, function (flag) {
        let nameSplit = flag.name.split("_")
        return nameSplit[0] == roomName && nameSplit[1] == "claim"
    }
    )
    if (!desiredRoom) { return }

    let spawns = this.find(FIND_MY_SPAWNS, { filter: freeSpawns })
    _.forEach(desiredRoom, function (src) {
        var reserver = _.filter(Game.creeps, function (creep) {
            return creep.memory.remotePos &&
                creep.memory.remotePos.roomName == src.pos.roomName &&
                creep.memory.remotePos.x == src.pos.x &&
                creep.memory.remotePos.y == src.pos.y
        }
        )

        reserver = reserver ? reserver.length : 0
        console.log(`[${roomName}] Reserver ${src} => ${reserver}`)
        if (reserver >= 1) { return }

        spawns = _.filter(spawns, freeSpawns)
        if (spawns.length == 0) { return }
        let spawn = spawns[0]
        console.log(`[${roomName}] ${src} Count:${reserver} of 1 Spawning reserver`)
        let memory = spawn.memoryBuilder("claim", src)
        spawn.spawnCreep([MOVE, MOVE, CLAIM, CLAIM], `claim_${Game.time}_700`, memory)
    }
    )
}


Room.prototype.remoteHarvest = function () {
    let roomName = this.name
    let remoteSources = _.filter(Game.flags, function (flag) {
        let nameSplit = flag.name.split("_")
        return nameSplit[0] == roomName && nameSplit[1] == "rharv"
    }
    )

    if (!remoteSources) { return }

    remoteSources = _.sortBy(remoteSources, "name")

    let spawns = this.find(FIND_MY_SPAWNS, { filter: freeSpawns })
    _.forEach(remoteSources, function (src) {
        var remoteHarver = _.filter(Game.creeps, function (creep) {
            return creep.memory.remotePos &&
                creep.memory.remotePos.roomName == src.pos.roomName &&
                creep.memory.remotePos.x == src.pos.x &&
                creep.memory.remotePos.y == src.pos.y
        }
        )

        remoteHarver = remoteHarver ? remoteHarver.length : 0
        console.log(`[${roomName}] Remote ${src} => ${remoteHarver}`)
        if (remoteHarver >= MAXRHARV) { return }

        spawns = _.filter(spawns, freeSpawns)
        if (spawns.length == 0) { return }
        let spawn = spawns[0]
        console.log(`[${roomName}] ${src} Count:${remoteHarver} of ${MAXRHARV} Spawning new`)
        spawn.remoteHarvest(src)
    }
    )
}


Room.prototype.maintainEuroTruck = function () {
    let roomName = this.name
    let controllerID = this.controller.id
    let remoteStorages = _.filter(Game.flags, function (flag) {
        let nameSplit = flag.name.split("_")
        return nameSplit[0] == roomName && nameSplit[1] == "rstorage"
    }
    )
    if (!remoteStorages) { return }

    let spawns = this.find(FIND_MY_SPAWNS, { filter: freeSpawns })
    _.forEach(remoteStorages, function (src) {
        var truck = _.filter(Game.creeps, function (creep) {
            return creep.memory.remotePos &&
                creep.memory.remotePos.roomName == src.pos.roomName &&
                creep.memory.remotePos.x == src.pos.x &&
                creep.memory.remotePos.y == src.pos.y
        }
        )
        truck = truck ? truck.length : 0
        console.log(`[${roomName}] Truck ${src} => ${truck}`)
        if (truck >= 1) { return }

        spawns = _.filter(spawns, freeSpawns)
        if (spawns.length == 0) { return }
        let spawn = spawns[0]
        let memory = {
            memory:
            {
                role: "truck",
                default_controller: controllerID,
                remotePos: src.pos,
                default_spawn: spawn.id,
                default_spawn_name: spawn.name,
            }
        }
        let bodyPts = spawn.bodyBuilder(1600, 80, 1000)
        return spawn.easySpawnCreep("truck", 800, bodyPts, memory)
    }
    )
}


Room.prototype.maintainLinker = function () {
    if (!this.storage ||
        !this.controller ||
        this.memory.linkerCount > 0 ||
        this.controller.level < 5 ||
        this.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 2000 ||
        this.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_LINK } }).length == 0
    ) {
        return
    }

    let spawns = this.find(FIND_MY_SPAWNS, { filter: freeSpawns })
    if (spawns.length == 0) { return }
    let spawn = spawns[0]
    return spawn.easySpawnCreep("linker", 600, SMALLCARRYPTS)
}


Room.prototype.maintainBuff = function maintainBuff() {
    if (!this.storage ||
        !this.controller ||
        this.storage.store.getUsedCapacity(RESOURCE_ENERGY) == 0 ||
        this.memory.buffCount > 0
    ) {
        return
    }

    let spawns = this.find(FIND_MY_SPAWNS, { filter: freeSpawns })
    if (spawns.length == 0) { return }
    let spawn = spawns[0]
    var buffPts = SMALLCARRYPTS
    if (this.energyCapacityAvailable > 1800) {
        buffPts = BIGCARRYPTS
    }
    return spawn.easySpawnCreep("buff", 600, buffPts)
}


Room.prototype.maintainSuperUpgrader = function maintainSuperUpgrader() {
    if (!this.storage ||
        !this.controller ||
        this.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 50000 ||
        this.memory.suCount >= 1
    ) {
        return
    }

    let spawns = this.find(FIND_MY_SPAWNS, { filter: freeSpawns })
    if (spawns.length == 0) { return }
    let spawn = spawns[0]

    return spawn.easySpawnCreep("supgr", this.energyCapacityAvailable)
}


Room.prototype.maintainMigr = function () {
    let spawns = this.find(FIND_MY_SPAWNS, { filter: freeSpawns })
    if (spawns.length == 0) { return }
    let spawn = spawns[0]

    var buffPts = SMALLCARRYPTS
    if (this.energyCapacityAvailable > 1800) {
        buffPts = BIGCARRYPTS
    }
    return spawn.easySpawnCreep("migr", 600, buffPts)
}


Room.prototype.runSpawns = function () {
    if (this.memory.basicCount == null) {
        this.census()
    }

    if (this.memory.basicCount >= this.memory.maxBasicCreeps) {
        if (this.energyAvailable == this.energyCapacityAvailable) {
            return this.remoteHarvest()
        }
        return
    }

    let spawns = this.find(FIND_MY_SPAWNS, { filter: freeSpawns })
    if (spawns.length == 0) { return }
    let spawn = spawns[0]
    let minEnergy = this.energyAvailable > 300 ? this.energyAvailable : 300

    switch (true) {
        case (this.memory.harvCount == 0):
            return spawn.easySpawnCreep('harv', minEnergy);

        case (this.memory.harvCount < this.memory.harvMax):
            return spawn.easySpawnCreep('harv', this.energyCapacityAvailable);

        case (this.memory.upgrCount < this.memory.upgrMax):
            if (this.storage && this.storage.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                return spawn.easySpawnCreep('upgr', minEnergy);
            }
            return spawn.easySpawnCreep('upgr', this.energyCapacityAvailable);
    }
}


Room.prototype.creepCounter = function creepCounter(creepRole, creeps) {
    return _.size(_.filter(creeps, function (crp) { return crp.name.split("_")[0] == creepRole }))
}


Room.prototype.census = function () {
    let controllerId = this.controller.id
    let mycreepsHere = _.filter(Game.creeps, function (creep) {
        return (creep.memory.default_controller == controllerId) && (creep.name.split("_")[0] != "seed")
    });
    this.memory.harvCount = this.creepCounter('harv', mycreepsHere)
    this.memory.upgrCount = this.creepCounter('upgr', mycreepsHere)
    this.memory.buffCount = this.creepCounter('buff', mycreepsHere)
    this.memory.suCount = this.creepCounter('supgr', mycreepsHere)
    this.memory.linkerCount = this.creepCounter('linker', mycreepsHere)
    this.memory.basicCount = this.memory.upgrCount + this.memory.harvCount

    if (this.energyCapacityAvailable < 1800) {
        this.memory.maxBasicCreeps = this.memory.sourcesCount * 3
        this.memory.maxBasicSize = 1600
    } else {
        this.memory.maxBasicCreeps = (this.memory.sourcesCount * 1) + 2
        this.memory.maxBasicCreeps = this.memory.maxBasicCreeps < 3 ? 3 : this.memory.maxBasicCreeps
        this.memory.maxBasicSize = 2200
    }

    this.memory.upgrMax = 1
    this.memory.harvMax = this.memory.maxBasicCreeps - this.memory.upgrMax

    if (this.memory.MYDEBUG) {
        console.log("===")
        console.log(`[${this.name}] Census Basics:${this.memory.basicCount} of ${this.memory.maxBasicCreeps} `)
        console.log(`[${this.name}] Census Harv:${this.memory.harvCount} of ${this.memory.harvMax} Upgr:${this.memory.upgrCount} of ${this.memory.upgrMax}`)
        console.log(`[${this.name}] Census Supgr:${this.memory.suCount}`)
    }
}


Room.prototype.every15Ticks = function () {
    if (Game.time % 15 != 0) { return }

    this.census()
    this.runSpawns()
    this.seedRoom()
    this.maintainBuff()
    this.maintainEuroTruck()
    this.maintainSuperUpgrader()
    this.towerMaker()
    this.extencionMaker()
}


Room.prototype.every50Ticks = function () {
    if (Game.time % 50 != 0) { return }
    console.log("Running 50 tks maintenance")

    this.census()
    this.maintainLinker()
}


Room.prototype.every100Ticks = function () {
    if (Game.time % 100 != 0) { return }
    console.log("Running 100 tks Room maintenance")

    this.maintainClaim()
}


Room.prototype.every500Ticks = function () {
    if (Game.time % 500 != 0) { return }
    console.log("Running 500 tks Room maintenance")

    this.roadMaker()

}


Room.prototype.every1000Ticks = function () {
    if (Game.time % 50 != 0) { return }
    console.log("Running 1000 tks Room maintenance")

}


Room.prototype.roadMaker = function () {
    if (this.controller.level < 3 || this.memory.spawn_roads) { return }


    let spawn = this.find(FIND_MY_SPAWNS, { filter: (spn) => spn.memory.main == true })[0]
    console.log(`[${this.name}] RoadMaker spawn:${spawn}`)
    let sources = this.find(FIND_SOURCES)
    for (let src in sources) {
        let path = spawn.pos.findPathTo(sources[src], { ignoreCreeps: true, maxOps: 100, swampCost: 4, ignoreRoads: true })
        path.splice(-1, 1)
        path.splice(0, 1)
        for (let coord in path) {
            let coords = path[coord]
            let result = this.createConstructionSite(coords.x, coords.y, STRUCTURE_ROAD)
            console.log("Create road result: " + result)
        }
    }
    this.memory.spawn_roads = true
}

Room.prototype.towerMaker = function () {
    if (!this.controller) { return }
    let controllerLevel = this.controller.level
    if (controllerLevel < 3) { return }
    if (this.find(FIND_CONSTRUCTION_SITES).length != 0) {
        return
    }
    let towerNum = this.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } }).length;
    let towerLimit = { 1: 0, 2: 0, 3: 1, 4: 1, 5: 2, 6: 2, 7: 3, 8: 6 }[controllerLevel]
    if (towerLimit == towerNum) {
        return
    }
    // x and y
    let towerOffets = {
        0: [-1, 2],
        1: [-2, -1],
        2: [2, 1],
        3: [1, -2],
        4: [-1, 2],
        5: [-2, -1],
        6: [2, 1],
        7: [1, -2],
    }[towerNum]

    let spawn = this.find(FIND_MY_SPAWNS, { filter: (spn) => spn.memory.main == true })[0]
    let coordX = spawn.pos.x
    let coordY = spawn.pos.y
    let [offsetX, offsetY] = towerOffets
    let construct = this.createConstructionSite(coordX + offsetX, coordY + offsetY, STRUCTURE_TOWER)
    console.log("Construct result: " + construct)
}


function extensionOffsetFinder(n) {
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
        59: [3, -3],
    }[n]
}


Room.prototype.extencionMaker = function () {
    if (!this.controller.my || this.find(FIND_CONSTRUCTION_SITES).length != 0) { return }

    let extsNum = this.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } }).length;
    let controllerLevel = this.controller.level
    let extencionsMax = { 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60 }[controllerLevel]

    if (extencionsMax == extsNum) { return }

    let spawn = this.find(FIND_MY_SPAWNS, { filter: (spn) => spn.memory.main == true })[0]
    let coordX = spawn.pos.x
    let coordY = spawn.pos.y
    let [offsetX, offsetY] = extensionOffsetFinder(extsNum)
    let construct = this.createConstructionSite(coordX + offsetX, coordY + offsetY, STRUCTURE_EXTENSION)
    console.log("Construct ext result: " + construct + offsetX + offsetY)

}
