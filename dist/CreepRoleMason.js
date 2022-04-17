Creep.prototype.roleMason = function () {
    let strucTypes = [STRUCTURE_WALL, STRUCTURE_RAMPART]
    if (this.ticksToLive > 1200) strucTypes = [STRUCTURE_ROAD]
  
    if (this.shouldFlee()) return this.moveTo(Game.getObjectById(this.memory.default_spawn))
  
    if (this.store.getUsedCapacity() === 0) {
      this.memory.building = false
      this.memory.goingTo = false
      if (this.room.storage && this.room.storage.store.energy > STORAGE_THRESHOLD_MASON) {
        return this.goWithdraw()
      } else {
        return this.goHarvest()
      }
    }
  
    if (!this.memory.building && this.store.getFreeCapacity() === 0) {
      this.memory.building = true
    }
  
    let target = Game.getObjectById(this.memory.goingTo)
    if (!target || !strucTypes.includes(target.structureType) || target.hits === target.hitsMax) {
      const strucs = this.room.find(
        FIND_STRUCTURES,
        { filter: strc => strucTypes.includes(strc.structureType) && strc.hits < strc.hitsMax }
      )
      if (strucs.length === 0) {
        this.memory.role = 'grave'
        return
      }
      if (strucTypes.includes(STRUCTURE_WALL)) {
        target = strucs.sort((a, b) => a.hits - b.hits)[0]
      } else {
        target = this.pos.findClosestByRange(strucs)
      }
      this.memory.goingTo = target.id
    }
    if (!this.pos.inRangeTo(target, 3)) return this.moveTo(target)
    return this.repair(target)
  }
  