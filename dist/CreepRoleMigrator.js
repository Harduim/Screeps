Creep.prototype.roleMigrate = function () {
    let flag = Game.flags.from
    if (this.store.getFreeCapacity() === 0) flag = Game.flags.to
  
    let target = flag
    if (this.room.name === flag.room.name) target = this.room.storage
  
    if (!this.pos.inRangeTo(target, 1)) return this.moveTo(target, REUSEPATHARGS)
  
    if (this.store.getFreeCapacity() === 0) {
      this.memory.role = this.name.split('_')[0]
      return this.transfer(this.room.storage, RESOURCE_ENERGY)
    }
    return this.withdraw(this.room.storage, RESOURCE_ENERGY)
  }