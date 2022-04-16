Creep.prototype.roleEuroTruck = function () {
    const road = Game.rooms[this.memory.default_room].getHighway(51)
    if (!this.memory.direction) this.memory.direction = 'out'

    if (!road) {
        log(`[${this.room.name}]${this.name}:No road found`, LOG_WARN, 'HIGHWAYS')
        return
    }
    let action, dest
    if (this.memory.direction === 'out') {
        action = 'withdraw'
        dest = road[road.length - 1]
    } else {
        if (Game.time % 2 === 0) this.passingRepair()
        action = 'transfer'
        dest = road[0]
    }

    dest = new RoomPosition(dest.x, dest.y, dest.roomName)
    if (this.pos.inRangeTo(dest, 2)) {
        let target = this.room.lookForAtArea(
            LOOK_STRUCTURES, dest.y - 1, dest.x - 1, dest.y + 1, dest.x + 1, true
        )
        target = _.filter(target, trg => trg.structure.store)
        if (target.length > 0 && this[action](target[0].structure, RESOURCE_ENERGY) === OK) {
            if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
                this.memory.direction = 'in'
            } else {
                this.memory.direction = 'out'
                this.say('Here I go again on my own...')
            }
        }
    }
    this.moveTo(dest, { reusePath: 100, ignoreCreeps: true })
}