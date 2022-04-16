function storageFilter (strc) {
    let aStorages = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN]
    if (strc.room.energyAvailable === strc.room.energyCapacityAvailable) {
      aStorages = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_STORAGE]
    }
    return aStorages.includes(strc.structureType) && strc.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  }