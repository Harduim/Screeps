Creep.prototype.roleClaimer = function () {
    let remotePos = this.memory.remotePos
    remotePos = new RoomPosition(remotePos.x, remotePos.y, remotePos.roomName)
  
    if (!this.pos.inRangeTo(remotePos, 1)) return this.moveTo(remotePos)
  
    const controller = this.room.controller
    if (!controller.my && controller.reservation && controller.reservation.username !== USERNAME) {
      this.callReinforcements()
      return this.attackController(controller)
    }
    return this.reserveController(controller)
  }