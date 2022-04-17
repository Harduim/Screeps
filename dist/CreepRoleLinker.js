Creep.prototype.roleLinker = function () {
    if (this.store.getUsedCapacity(RESOURCE_ENERGY) > 0 || this.memory.harvesting === false) {
      const storages = [STRUCTURE_STORAGE, STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER]
      return this.goDeposit(allowedStorages(storages))
    }
  
    if (!this.room.memory.mainLink) return
    const mLink = Game.getObjectById(this.room.memory.mainLink.id)
    if (!mLink) return
  
    if (!this.pos.isNearTo(mLink)) {
      return this.moveTo(mLink, REUSEPATHARGS)
    } else {
      return this.withdraw(mLink, RESOURCE_ENERGY)
    }
  }