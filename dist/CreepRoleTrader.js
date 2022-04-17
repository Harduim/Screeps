Creep.prototype.roleTrader = function () {
    if (!this.room.terminal || !this.room.storage) return
  
    const terminnalEnergy = this.room.terminal.store.getUsedCapacity(RESOURCE_ENERGY)
    const storageEnergy = this.room.storage.store.energy
    if (terminnalEnergy > TERMINAL_ENERGY_BUFFER || storageEnergy < TERMINAL_ENERGY_BUFFER) {
      this.memory.role = 'mason'
      return this.roleMason()
    }
  
    let energyFrom, energyTo, dest, action
    if (terminnalEnergy > storageEnergy) {
      energyFrom = this.room.storage
      energyTo = this.room.terminal
    } else {
      energyFrom = this.room.terminal
      energyTo = this.room.storage
    }
  
    if (this.store.getUsedCapacity() > 0) {
      dest = energyFrom
      action = 'transfer'
    } else {
      dest = energyTo
      action = 'withdraw'
    }
  
    if (!this.pos.isNearTo(dest)) {
      return this.moveTo(dest, REUSEPATHARGS)
    }
  
    return log(this[action](dest, RESOURCE_ENERGY))
  }