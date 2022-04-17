Creep.prototype.roleRemoteHarvester = function () {
    const remotePos = this.memory.remotePos
    if (!remotePos) return
  
    if (this.shouldFlee()) {
      this.memory.role = 'mason'
      this.memory.goingTo = this.memory.default_spawn
      return this.moveTo(Game.getObjectById(this.memory.default_spawn))
    }
  
    if (this.memory.harvesting && !this.memory.building) {
      if (this.pos.inRangeTo(remotePos, 1)) {
        this.memory.goingTo = false
        return this.goHarvest()
      } else {
        return this.moveTo(new RoomPosition(remotePos.x, remotePos.y, remotePos.roomName))
      }
    }
  
    if (!this.room.controller || !this.room.controller.my) {
      if (this.memory.building) {
        return this.goBuild(false)
      }
      this.memory.goingTo = false
      const constructSites = this.pos.findInRange(FIND_CONSTRUCTION_SITES, 2)
      if (constructSites.length > 0) {
        this.memory.destConstSite = constructSites[0].id
        this.memory.building = true
        return this.goBuild(false)
      }
      const damagedStruc = this.pos.findInRange(
        FIND_STRUCTURES, 2,
        { filter: (strc) => [STRUCTURE_ROAD, STRUCTURE_CONTAINER].includes(strc.structureType) && strc.hits < strc.hitsMax }
      )
      if (damagedStruc.length > 0) {
        return this.repair(damagedStruc[0])
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