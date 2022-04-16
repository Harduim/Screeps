Creep.prototype.roleUpgrader = function () {
    const originalRole = this.name.split('_')[0]
    if (originalRole !== 'upgr' && this.store[RESOURCE_ENERGY] === 0) {
      this.memory.role = originalRole
      return
    }
    if (this.memory.upgrading && this.store[RESOURCE_ENERGY] === 0) this.memory.upgrading = false
    if (!this.memory.upgrading && this.store.getFreeCapacity() === 0) this.memory.upgrading = true
  
    const ctrl = Game.getObjectById(this.memory.default_controller)
    if (this.memory.upgrading) {
      if (this.upgradeController(ctrl) === ERR_NOT_IN_RANGE) this.moveTo(ctrl, { visualizePathStyle: { stroke: '#ffffff' } })
      return
    }
    if (this.room.storage && this.room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 50000) {
      return this.goWithdraw()
    }
    return this.goHarvest()
}