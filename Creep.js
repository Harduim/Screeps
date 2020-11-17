require('WarCreep');

const REUSEPATHARGS = { reusePath: 6 }


Creep.prototype.run = function (MYDEBUG) {
    if (this.spawning) {
        if (MYDEBUG && Game.time % 5 == 0) {
            console.log(`[${this.room.name}] => ${this.name}`)
        }
        return
    }
    this.memory.MYDEBUG = MYDEBUG

    let ARMYROLES = ["shaman", "grunt", "hunter", "demolisher"]
    if (ARMYROLES.includes(this.memory.role)) {
        this.memory.ARMYROLES = ARMYROLES
        return this.roleArmy()
    }

    // Tem que virar um map
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
        case "loot":
            return this.roleLooter()
        case "seed":
            return this.roleSeeder()
        case "migr":
            return this.roleMigrate()
        case "supgr":
            return this.roleSUpgrader()
        case "truck":
            return this.roleEuroTruck()
        case "linker":
            return this.roleLinker()
    }
}


Creep.prototype.roleLinker = function () {
    let links = this.room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_LINK } })
    if (links.length == 0) { return }

    if (this.store.getUsedCapacity(RESOURCE_ENERGY) > 0 || this.memory.harvesting == false) {
        return this.goDeposit(function (structure) {
            let allowedStorages = [STRUCTURE_STORAGE, STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER]
            return allowedStorages.includes(structure.structureType) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        })
    }

    let roomStorage = this.room.storage
    let mainLink = _.filter(links, function (lnk) { return lnk.pos.inRangeTo(roomStorage, 5) })[0]
    if (!this.pos.inRangeTo(mainLink, 1)) {
        this.moveTo(mainLink, REUSEPATHARGS)
    }
    else {
        let result = this.withdraw(mainLink, RESOURCE_ENERGY)
        if (result == ERR_NOT_ENOUGH_RESOURCES) {
            this.memory.role = "buff"
        }
    }
}


Creep.prototype.roleBuff = function () {
    if (this.name.split("_")[0] == "linker" && Game.time % 25 == 0) {
        this.memory.role = "linker"
    }
    if (this.store.getFreeCapacity() == 0 || this.memory.harvesting == false) {
        this.memory.goingTo = false
        return this.goDeposit(function (structure) {
            let allowedStorages = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER]
            return allowedStorages.includes(structure.structureType) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        })
    } else {
        return this.goWithdraw()
    }
}


Creep.prototype.roleMigrate = function () {
    var flag;
    var target;
    if (this.store.getFreeCapacity() == 0) {
        flag = Game.flags["to"]
    } else {
        flag = Game.flags["from"]
    }

    if (this.room.name == flag.room.name) {
        target = this.room.storage
    } else {
        target = flag
    }

    if (!this.pos.inRangeTo(target, 1)) {
        return this.moveTo(target, REUSEPATHARGS)
    }

    if (this.store.getFreeCapacity() == 0) {
        return this.transfer(this.room.storage, RESOURCE_ENERGY)
    }
    return this.withdraw(this.room.storage, RESOURCE_ENERGY)
}


Creep.prototype.roleClaimer = function () {
    let remotePos = this.memory.remotePos
    remotePos = new RoomPosition(remotePos.x, remotePos.y, remotePos.roomName)

    if (!this.pos.inRangeTo(remotePos, 1)) {
        return this.moveTo(remotePos)
    }

    if (this.room.controller.reservation && this.room.controller.reservation.username != 'Harduim') {
        return this.attackController(this.room.controller)
    } else {
        return this.reserveController(this.room.controller)
    }
}


Creep.prototype.roleRemoteHarvester = function () {
    let remotePos = this.memory.remotePos

    if (!remotePos) { return }

    if (this.room.find(FIND_HOSTILE_CREEPS).length > 0 || this.hits < this.hitsMax) {
        return this.moveTo(Game.getObjectById(this.memory.default_spawn))
    }

    if (this.store.getFreeCapacity() > 0 && this.memory.harvesting && !this.memory.building) {
        if (this.pos.inRangeTo(remotePos, 1)) {
            this.memory.goingTo = false
            return this.goHarvest()
        }
        else {
            return this.moveTo(new RoomPosition(remotePos.x, remotePos.y, remotePos.roomName))
        }
    }

    if (!this.room.controller || !this.room.controller.my) {
        this.memory.goingTo = false
        var constructSite = Game.getObjectById(this.memory.destConstSite) || this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES)
        if (constructSite) {
            this.memory.destConstSite = constructSite
            this.memory.building = true
            return this.goBuild()
        }
        let closestDamagedStructure = this.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax
        })
        if (closestDamagedStructure && this.pos.inRangeTo(closestDamagedStructure, 3)) {
            this.repair(closestDamagedStructure)
        }
        return this.moveTo(Game.getObjectById(this.memory.default_controller))
    } else {
        return this.goDeposit(
            function (struc) {
                return [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_STORAGE, STRUCTURE_LINK].includes(struc.structureType) &&
                    struc.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            }
        )
    }
}


Creep.prototype.roleHarvester = function () {
    let constructSite = this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES)
    if ((this.room.memory.buffCount && constructSite) ||
        (this.room.energyAvailable == this.room.energyCapacityAvailable && constructSite)) {
        this.memory.role = 'buil'
        return this.roleBuilder()
    }
    if (this.store.getFreeCapacity() > 0 && this.memory.harvesting == true) {
        return this.goHarvest()
    }
    return this.goDeposit()
}


function storageFilter(structure) {
    if ((structure.room.energyAvailable == structure.room.energyCapacityAvailable) && !structure.pos.findClosestByRange(FIND_CONSTRUCTION_SITES)) {
        var allowedStorages = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_STORAGE]
    }
    else {
        var allowedStorages = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN]
    }
    return allowedStorages.includes(structure.structureType) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
}

Creep.prototype.roleSeeder = function roleSeeder() {
    if (!this.room.controller || this.room.controller.id != this.memory.default_controller) {
        return this.moveTo(Game.getObjectById(this.memory.default_controller))
    }

    this.memory.role = 'harv'
    return this.roleHarvester()

}


Creep.prototype.roleBuilder = function () {
    if (this.memory.building) { return this.goBuild() }

    if (!this.memory.building && this.store.getFreeCapacity() == 0) {
        this.memory.building = true
        this.say('🚧 build')
        return this.goBuild()
    }
    if (this.room.storage && this.room.storage.store.energy > 1000) {
        return this.goWithdraw()
    } else {
        return this.goHarvest()
    }
}


Creep.prototype.roleSUpgrader = function () {
    if (this.memory.upgrading && this.store[RESOURCE_ENERGY] == 0) {
        this.memory.upgrading = false;
    }
    if (!this.memory.upgrading && this.store.getFreeCapacity() == 0) {
        this.memory.upgrading = true;
    }

    let controller = Game.getObjectById(this.memory.default_controller)
    if (this.memory.upgrading) {
        if (this.upgradeController(controller) == ERR_NOT_IN_RANGE) {
            this.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return
    }
    return this.goWithdraw()
}


Creep.prototype.roleUpgrader = function () {
    if (this.memory.upgrading && this.store[RESOURCE_ENERGY] == 0) {
        this.memory.upgrading = false;
    }
    if (!this.memory.upgrading && this.store.getFreeCapacity() == 0) {
        this.memory.upgrading = true;
    }

    let controller = Game.getObjectById(this.memory.default_controller)
    if (this.memory.upgrading) {
        if (this.upgradeController(controller) == ERR_NOT_IN_RANGE) {
            this.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return
    }
    if (!this.room.storage || this.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 300000) {
        return this.goHarvest()
    }
    return this.goWithdraw()
}


Creep.prototype.goDeposit = function (storFilter = storageFilter) {
    if (this.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
        this.memory.harvesting = true
        return
    }

    var energyStorage = Game.getObjectById(this.memory.goingTo)
    if (!energyStorage) {
        if (this.room.memory.buffCount > 0 && !["buff", "rharv"].includes(this.memory.role)) {
            energyStorage = this.room.storage
        } else {
            let targets = this.room.find(FIND_MY_STRUCTURES, { filter: storFilter });
            if (targets.length == 0) { return }
            energyStorage = this.pos.findClosestByRange(targets)
            this.memory.goingTo = energyStorage.id
        }
    }

    if (!this.pos.inRangeTo(energyStorage, 1)) {
        return this.moveTo(energyStorage, REUSEPATHARGS)
    }

    this.memory.harvesting = false
    var transfer_result = this.transfer(energyStorage, RESOURCE_ENERGY);
    if ((transfer_result == ERR_FULL) || (transfer_result == ERR_NOT_ENOUGH_RESOURCES)) {
        this.memory.goingTo = false
        this.goDeposit()
    }
}


Creep.prototype.goHarvest = function (findType = FIND_SOURCES_ACTIVE) {
    if (Game.getObjectById(this.memory.goingTo) == null || this.memory.goingTo == false) {
        let goingTo = this.pos.findClosestByPath(findType)
        if (goingTo) {
            this.memory.goingTo = goingTo.id
        }
        else {
            return
        }
    }
    let energySource = Game.getObjectById(this.memory.goingTo)

    if (this.pos.inRangeTo(energySource, 1)) {
        this.memory.goingTo = false
        switch (findType) {
            case FIND_DROPPED_RESOURCES:
                this.pickup(energySource)
                break;
            case FIND_HOSTILE_STRUCTURES:
                this.dismantle(energySource)
                break;
            case FIND_TOMBSTONES:
                console.log(this.withdraw(energySource, RESOURCE_ENERGY))
                break;
            default:
                this.harvest(energySource)
        }
        if (this.store.getFreeCapacity() == 0) {
            this.memory.harvesting = false
        }
    }
    else {
        this.memory.harvesting = true
        this.moveTo(energySource, REUSEPATHARGS)
    }
}


Creep.prototype.goWithdraw = function (resourceType = RESOURCE_ENERGY) {
    if (!this.room.storage) {
        console.log(`${this.name} não achou storage em ${this.room.name}`)
        return
    }
    if (!this.pos.inRangeTo(this.room.storage, 1)) {
        this.moveTo(this.room.storage, REUSEPATHARGS)
    }
    else {
        this.withdraw(this.room.storage, resourceType)
    }
}


Creep.prototype.goWithdrawFlex = function (resourceType = RESOURCE_ENERGY, storFilter = strc => strc.id == strc.room.storage.id) {
    let stor = this.pos.findClosestByRange(FIND_STRUCTURES, { filter: storFilter });


    if (!this.pos.inRangeTo(stor, 1)) {
        this.moveTo(stor, REUSEPATHARGS)
    }
    else {
        this.withdraw(stor, resourceType)
    }
}


Creep.prototype.goBuild = function () {
    var constructSite = Game.getObjectById(this.memory.destConstSite) || this.pos.findClosestByRange(FIND_CONSTRUCTION_SITES)
    if (!constructSite) {
        this.memory.role = 'harv'
        this.memory.building = false
        return
    }

    if (!this.pos.inRangeTo(constructSite, 3)) {
        return this.moveTo(constructSite)
    }

    this.memory.destConstSite = constructSite.id
    let build_result = this.build(constructSite)
    if (build_result == OK) { return }

    this.memory.building = false
    return this.goHarvest()
}