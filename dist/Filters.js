function storageFilter(structure) {
  let aStorages = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN]
  if (structure.room.energyAvailable === structure.room.energyCapacityAvailable) {
    aStorages = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_STORAGE]
  }
  return aStorages.includes(structure.structureType) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
}