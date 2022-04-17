const roleHarvester = (creep) => {
  if (creep.memory.harvesting) return creep.goHarvest()
  if (creep.memory.goingTo) return creep.goDeposit()

  const nearbyLink = creep.pos.isLinkNearby()

  if (nearbyLink.length > 0 && (creep.room.memory.censusByPrefix.linker || 0) > 0) {
    creep.memory.goingTo = closeLink[0].id
  }

  return creep.goDeposit()
}


Creep.prototype.roleHarvester = function () {
  if (this.memory.harvesting) return this.goHarvest()

  if (!this.memory.goingTo) {
    const closeLink = this.pos.findInRange(FIND_MY_STRUCTURES, 2, {
      filter: strc => (strc.structureType === STRUCTURE_LINK && strc.store.energy < 795)
    })

    if (closeLink.length > 0 && (this.room.memory.censusByPrefix.linker || 0) > 0) {
      this.memory.goingTo = closeLink[0].id
    }
  }

  return this.goDeposit()
}