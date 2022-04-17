Creep.prototype.roleBuff = function () {
    if (Game.time % 30 === 0 && this.name.split('_')[0] === 'linker') {
      this.memory.role = 'linker'
      return this.roleLinker()
    }
  
    if (this.store.getUsedCapacity() > 0 || this.memory.harvesting === false) {
      this.memory.goingTo = false
      const energyFull = this.room.energyAvailable === this.room.energyCapacityAvailable
      const storages = energyFull ? [STRUCTURE_TOWER] : [STRUCTURE_EXTENSION, STRUCTURE_SPAWN]
      return this.goDeposit(allowedStorages(storages))
    } else {
      return this.goWithdraw()
    }
  }