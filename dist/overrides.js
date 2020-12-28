Creep.prototype.toString = function () {
  return `[${this.name}] Role:${this.memory.role} Room:${this.room.name}`
}

Room.prototype.toString = function () {
  return JSON.stringify(this)
}

Spawn.prototype.toString = function () {
  return `[${this.name}] Room:${this.room.name} Energy:${this.room.energyAvailable}/${this.room.energyCapacityAvailable}`
}

Source.prototype.toString = function () {
  const sID = `[Source #${this.id}]`
  const energy = `Energy:${this.energy}/${this.energyCapacity} Regen: ${this.ticksToRegeneration} tks`
  const position = `Pos: x${this.pos.x}/y${this.pos.y} @${this.room.name}`
  return `${sID} ${energy} ${position}`
}
