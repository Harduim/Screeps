Creep.prototype.roleBuilder = function () {
    if (this.memory.building) return this.goBuild()

    if (!this.memory.building && this.store.getFreeCapacity() === 0) {
        this.memory.building = true
        this.say('🚧 build')
        return this.goBuild()
    }
    if (this.room.storage && this.room.storage.store.energy > 1000) return this.goWithdraw()

    return this.goHarvest()
}