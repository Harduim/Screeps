Source.prototype.toString = function () {
    const sID = `[Source #${this.id}]`
    const energy = `Energy:${this.energy}/${this.energyCapacity} Regen: ${this.ticksToRegeneration} tks`
    const position = `Pos: x${this.pos.x}/y${this.pos.y} @${this.room.name}`
    return `${sID} ${energy} ${position}`
  }
  