Creep.prototype.toString = function () {
    return JSON.stringify(`[${this.name}] Role:${this.memory.role} Room:${this.room.name}`)
}

Room.prototype.toString = function () {
    return JSON.stringify(this)
}

Spawn.prototype.toString = function () {
    return JSON.stringify(`[${this.name}] Room:${this.room.name} Energy:${this.room.energyAvailable}/${this.room.energyCapacityAvailable}`)
}