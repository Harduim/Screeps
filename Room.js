const MAXRHARV = 2
const SMALLCARRYPTS = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]
const BIGCARRYPTS = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, CARRY, MOVE, CARRY, MOVE]
const FREE_SPAWNS = { filter: spn => spn.spawning == null };


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
            this.controllerRoadMaker()
            this.runTowers()
            break;
        case 4:
        case 5:
        case 6:
        case 7:
        case 8:
            this.runTowers()
            this.teleportEnergy()
            break;
    }
}


Room.prototype.creepFilterByRole = function (role, creepList) {
    return _.filter(creepList, crp => crp.memory.role == role);
}

Room.prototype.creepFilterByPrefix = function (prefix, creepList) {
    return _.filter(creepList, crp => crp.name.split("_")[0] == prefix);
}

Room.prototype.roomCoordinator = function () {
    if (this.MYDEBUG) {
        console.log(`[${this.name}] Room coordenation`);
    }
    const hostiles = this.find(FIND_HOSTILE_CREEPS);
    if (hostiles.length > 0) {
        this.memory.underAttack = true
    } else {
        this.memory.underAttack = false
    }
    this.memory.hostiles = hostiles.length

    const controllerId = this.controller.id;
    const structs = this.find(FIND_MY_STRUCTURES);
    const constSites = this.find(FIND_CONSTRUCTION_SITES);
    const creepsOwned = _.filter(Game.creeps, creep => (
        creep.memory.default_controller == controllerId && creep.name.split("_")[0] != "seed"
    ));

    this.census(creepsOwned);
    this.runSpawns();
    this.structureCensus(structs);
    this.buffLinkerDirectives(creepsOwned, structs);
    this.harvUpgrBuilDirectives(creepsOwned, constSites);
    if (this.energyAvailable == this.energyCapacityAvailable) {
        this.remoteHarvest()
    }
}


Room.prototype.census = function (creepsOwned) {
    this.memory.censusByRole = _.countBy(creepsOwned, crp => crp.memory.role);
    this.memory.censusByPrefix = _.countBy(creepsOwned, crp => crp.name.split("_")[0]);

    if (this.memory.MYDEBUG) {
        console.log(`[${this.name}] Census =>:${JSON.stringify(this.memory.censusByPrefix)}`);
    }

    if (this.energyCapacityAvailable < 1800) {
        this.memory.harvMax = this.memory.sourcesCount + 2
        this.memory.upgrMax = this.memory.sourcesCount
        this.memory.builMax = this.memory.sourcesCount + 1
        this.memory.maxBasicSize = 1600;
    } else {
        this.memory.harvMax = this.memory.sourcesCount
        this.memory.upgrMax = 1
        this.memory.builMax = 1
        this.memory.maxBasicSize = 2200;
    }

    if (this.name == "sim") {
        this.memory.harvMax = 3;
        this.memory.upgrMax = 2;
    }
}


Room.prototype.structureCensus = function (structs) {
    const mStorage = this.storage;

    // Link cache
    if ((!this.memory.mainLink || !Game.getObjectById(this.memory.mainLink.id)) && mStorage) {
        const mlFilter = strc => strc.structureType == STRUCTURE_LINK && strc.pos.inRangeTo(mStorage, 5);
        const mLink = _.filter(structs, mlFilter);
        if (mLink.length > 0) {
            this.memory.mainLink = mLink[0];
        }
    }
    if (mStorage) {
        const blFilter = strc => strc.structureType == STRUCTURE_LINK && !strc.pos.inRangeTo(mStorage, 5);
        this.memory.borderLinks = _.filter(structs, blFilter);
    }

}


Room.prototype.buffLinkerDirectives = function (creepsOwned, structs) {
    /*  ---------- Linker <=> Buff ---------
        - If all links are empty or on cooldown Linker should assume Buff role.
        - If there is no Buff, a Linker should assume the Buff role.
        - If there a Linker on the buff role and Buff exists Linker should switch back to linker role.
    */
    if ((this.memory.censusByRole["linker"] || 0) == 0 || !this.storage) { return }

    if ((this.memory.censusByRole["buff"] || 0) == 0) {
        const linker = this.creepFilterByRole("linker", creepsOwned)[0];
        linker.memory.role = "buff"
        if (this.memory.MYDEBUG) { console.log(`[${this.name}] ${linker.name} => buff`); }
        return
    }

    const linksActive = strc => strc.structureType == STRUCTURE_LINK && strc.store.energy > 0 && strc.cooldown <= 5;

    if ((this.memory.censusByRole["buff"] || 0) > 0 && _.filter(structs, linksActive).length > 0) {
        const linkersBuff = _.filter(
            creepsOwned, crp => crp.memory.role == "buff" && crp.name.split("_")[0] == "linker"
        );
        if (linkersBuff.length > 0) {
            linkersBuff[0].memory.role = "buff"
            if (this.memory.MYDEBUG) { console.log(`[${this.name}] ${linkersBuff[0].name} => linker`); }
        }
    }
}


Room.prototype.harvUpgrBuilDirectives = function (creepsOwned, constSites) {
    /*  ---------- Harvester <=> [Builder, Upgr, Supgr]
        - Should only switch role if:
            - Room energy available == capacity or;
            - There is a Buff and room.store has been filled to at least double room capacity or.
        - Only one should switch to Builder if there is a construction site
        - Should switch to Upgr or Supgr (depending if room.storage exists) if no sources available
    */
    const rHarvs = this.creepFilterByRole("harv", creepsOwned);
    const pHarvs = this.creepFilterByPrefix("harv", creepsOwned);
    let balance = false;
    if (this.storage) {
        if ((this.memory.censusByRole["buff"] || 0) == 0) {
            balance = true;
        }
    } else {
        if (this.energyAvailable < this.energyCapacityAvailable) {
            balance = true;
        }
    }
    if (balance) {
        _.forEach(pHarvs, harv => harv.memory.role = "harv");
        return
    }

    const buildCount = this.memory.censusByRole["buil"] || 0;
    if (this.storage) {
        const storageUsedCapacity = this.storage.store.getUsedCapacity(RESOURCE_ENERGY);
        if (storageUsedCapacity < this.energyCapacityAvailable || buildCount > 0) {
            return
        }
    }

    // Harv => Builder
    if (constSites.length > 0 && buildCount < this.memory.builMax) {
        let builder;
        const harvs = rHarvs.length == 0 ? pHarvs : rHarvs;
        if (harvs.length > 0) {
            builder = harvs[0];
            builder.memory.role = "buil"
            if (this.memory.MYDEBUG) { console.log(`[${this.name}] ${builder.name} => buil`); }
            return
        }
    }
    // Builder => Harv will remain on .goBuild and main.balanceCreeps

    // Harv => Upgr
    if (this.energyAvailable == this.energyCapacityAvailable &&
        (!this.storage || this.find(FIND_SOURCES_ACTIVE).length == 0)) {
        _.forEach(rHarvs, harv => harv.memory.role = "upgr");
        return
    }
    // Upgr => Harv will remain on .roleUpgrader and main.balanceCreeps

}



Room.prototype.runTowers = function () {
    const structs = this.find(FIND_STRUCTURES);
    let towers = _.filter(structs, struc => struc.structureType == STRUCTURE_TOWER);

    if (towers.length == 0) { return }

    let mainSpawn = _.filter(structs,
        struc => struc.structureType == STRUCTURE_SPAWN && struc.memory.hasOwnProperty("main")
    );
    if (mainSpawn.length == 0) {
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

    if (Game.time % 2 == 0) {
        const closestMyCreep = mainSpawn.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (creep) => creep.hits < creep.hitsMax
        })
        if (closestMyCreep && mainSpawn.pos.getRangeTo(closestMyCreep) < 20) {
            _.forEach(towers, tower => tower.heal(closestMyCreep))
            return
        }
    }

    if (Game.time % 10 == 0) {
        const strucWallRampart = [STRUCTURE_WALL, STRUCTURE_RAMPART]
        const lessHits = obj => _.reduce(obj, (a, b) => a.hits <= b.hits ? a : b);

        const nonWallDamaged = _.filter(structs, struc => !strucWallRampart.includes(struc.structureType) && struc.hits < struc.hitsMax);
        if (nonWallDamaged.length > 0) {
            let tower = towers.pop()
            tower.repair(lessHits(nonWallDamaged))
        }

        if (towers.length == 0 || !(this.storage && this.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 30000)) {
            return
        }

        let damaged = _.filter(structs, struc => strucWallRampart.includes(struc.structureType) && struc.hits < struc.hitsMax);
        const target = lessHits(damaged)
        if (damaged.length > 0) { _.forEach(towers, tower => tower.repair(target)) }
    }
}


Room.prototype.runStructs = function runStructs(strucType) {
    let strucFilter = { filter: { structureType: strucType } }
    _.forEach(this.find(FIND_MY_STRUCTURES, strucFilter), function (str) { str.run() })
}


Room.prototype.teleportEnergy = function () {
    if (!this.storage || Game.time % 5 != 0 || !this.memory.mainLink) { return }

    const mLink = Game.getObjectById(this.memory.mainLink.id);

    _.forEach(this.memory.borderLinks, function (lnk) {
        if (lnk.cooldown > 0 || mLink.store.energy >= 770) { return }
        const bLink = Game.getObjectById(lnk.id);
        if (bLink) {
            bLink.transferEnergy(mLink)
        }
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
    if (!this.controller || !this.controller.my || this.memory.basicCount > 0) {
        return
    }

    const controllerId = this.controller.id
    const mycreepsHere = _.filter(Game.creeps, function (creep) {
        return creep.memory.default_controller == controllerId
    });
    let seedCount = this.creepCounterByPrefix('seed', mycreepsHere)
    if (seedCount > 4) { return }

    for (let name in Game.rooms) {
        var otherRoom = Game.rooms[name]
        if ((!otherRoom.controller) || (!otherRoom.controller.my) || (this.name == otherRoom.name)) {
            continue
        }
        break;
    }
    let otherSpawns = otherRoom.find(FIND_MY_SPAWNS, FREE_SPAWNS)
    if (otherSpawns.length == 0) { return }

    let seedingResult = otherSpawns[0].spawnCreep(
        [TOUGH, CARRY, MOVE, MOVE, MOVE, WORK, MOVE, MOVE, MOVE, WORK, CARRY, WORK, MOVE, WORK],
        "seed_" + Game.time + "_400", {
        memory: {
            role: "upgr",
            default_controller: this.controller.id,
        }
    }
    )
    console.log(`${this.name} Seeding => ${otherRoom.name} | Spawn Result:${seedingResult}`)

}


Room.prototype.maintainClaim = function () {
    let roomName = this.name
    let desiredRoom = _.filter(Game.flags, function (flag) {
        let nameSplit = flag.name.split("_")
        return nameSplit[0] == roomName && nameSplit[1] == "claim"
    }
    )
    if (!desiredRoom) { return }

    let spawns = this.find(FIND_MY_SPAWNS, FREE_SPAWNS)
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

        spawns = _.filter(spawns, snp => snp.spawning == null)
        if (spawns.length == 0) { return }
        let spawn = spawns[0]
        console.log(`[${roomName}] ${src} Count:${reserver} of 1 Spawning reserver`)
        let memory = spawn.memoryBuilder("claim", src)
        spawn.spawnCreep([TOUGHT, MOVE, MOVE, MOVE, MOVE, CLAIM, CLAIM], `claim_${Game.time}_700`, memory)
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

    let spawns = this.find(FIND_MY_SPAWNS, FREE_SPAWNS)
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

        spawns = _.filter(spawns, snp => snp.spawning == null)
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

    let spawns = this.find(FIND_MY_SPAWNS, FREE_SPAWNS)
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

        spawns = _.filter(spawns, snp => snp.spawning == null)
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
        (this.memory.censusByPrefix["linker"] || 0) > 0 ||
        this.controller.level < 5 ||
        this.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_LINK } }).length == 0
    ) {
        return
    }

    const spawns = this.find(FIND_MY_SPAWNS, FREE_SPAWNS)
    if (spawns.length == 0) { return }
    const spawn = spawns[0]
    return spawn.easySpawnCreep("linker", 600, SMALLCARRYPTS)
}


Room.prototype.maintainBuff = function maintainBuff() {
    if (!this.storage ||
        !this.controller ||
        (this.memory.censusByPrefix["buff"] || 0) > 0 ||
        (this.storage.store.getUsedCapacity(RESOURCE_ENERGY) == 0 && (this.memory.censusByPrefix["linker"] || 0) == 0)
    ) {
        return
    }

    let spawns = this.find(FIND_MY_SPAWNS, FREE_SPAWNS)
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
        (this.memory.censusByPrefix["supgr"] || 0) >= 1
    ) {
        return
    }

    let spawns = this.find(FIND_MY_SPAWNS, FREE_SPAWNS)
    if (spawns.length == 0) { return }
    let spawn = spawns[0]

    return spawn.easySpawnCreep("supgr", this.energyCapacityAvailable)
}


Room.prototype.maintainMigr = function () {
    let spawns = this.find(FIND_MY_SPAWNS, FREE_SPAWNS)
    if (spawns.length == 0) { return }
    let spawn = spawns[0]

    var buffPts = SMALLCARRYPTS
    if (this.energyCapacityAvailable > 1800) {
        buffPts = BIGCARRYPTS
    }
    return spawn.easySpawnCreep("migr", 600, buffPts)
}


Room.prototype.runSpawns = function () {
    const spawns = this.find(FIND_MY_SPAWNS, FREE_SPAWNS)
    if (spawns.length == 0) { return }
    const spawn = spawns[0]
    const minEnergy = this.energyAvailable > 300 ? this.energyAvailable : 300
    const harvCount = this.memory.censusByPrefix["harv"] || 0;
    const upgrCount = this.memory.censusByPrefix["upgr"] || 0;

    switch (true) {
        case (harvCount == 0):
            return spawn.easySpawnCreep('harv', minEnergy);

        case (harvCount < this.memory.harvMax):
            return spawn.easySpawnCreep('harv', this.energyCapacityAvailable);

        case (upgrCount < this.memory.upgrMax):
            if (this.storage && this.storage.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                return spawn.easySpawnCreep('upgr', minEnergy);
            }
            return spawn.easySpawnCreep('upgr', this.energyCapacityAvailable);
    }
}


Room.prototype.every15Ticks = function () {
    if (Game.time % 15 != 0) { return }

    const enemyCreeps = this.find(FIND_CREEPS, {
        filter: (crp) => !crp.my &&
            crp.owner.username != 'Invader' &&
            (crp.getActiveBodyparts(ATTACK) > 0 || crp.getActiveBodyparts(RANGED_ATTACK) > 0)
    })
    if (enemyCreeps.length > 0) {
        const spawns = this.find(FIND_MY_SPAWNS, FREE_SPAWNS);
        const energyCap = this.energyCapacityAvailable < 1800 ? 1600 : 2200;
        this.createFlag(25, 25, "point_999");
        _.forEach(spawns, function (spn) { spn.easySpawnFighter("grunt", energyCap, 999) });
        this.controller.activateSafeMode()
    }

    this.roomCoordinator()
    this.maintainBuff()
    this.maintainLinker()
    this.maintainEuroTruck()
    this.maintainSuperUpgrader()
    this.towerMaker()
    this.extencionMaker()
}


Room.prototype.every50Ticks = function () {
    if (Game.time % 50 != 0) { return }
    console.log("Running 50 tks maintenance")
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
    if (!spawn) { return }
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
    if (!spawn) { return }
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
    if (!spawn) { return }
    let coordX = spawn.pos.x
    let coordY = spawn.pos.y
    let [offsetX, offsetY] = extensionOffsetFinder(extsNum)
    let construct = this.createConstructionSite(coordX + offsetX, coordY + offsetY, STRUCTURE_EXTENSION)
    console.log("Construct ext result: " + construct + offsetX + offsetY)

}
