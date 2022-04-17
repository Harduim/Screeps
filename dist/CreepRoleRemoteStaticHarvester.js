
Creep.prototype.roleStaticRharv = function () {
    const rPos = this.memory.remotePos
    if (!rPos) {
        // DEV GAMBI
        this.memory.remotePos = { x: 5, y: 2, roomName: 'sim' }
        return
    }

    const remotePos = new RoomPosition(rPos.x, rPos.y, rPos.roomName)

    if (rPos.roomName !== this.room.name || !this.pos.inRangeTo(remotePos, 0)) {
        return this.moveTo(remotePos)
    }

    if (this.memory.building) {
        this.memory.role = 'buil'
        return this.roleBuilder()
    }

    const nosrcerrmsg = `[${this.room.name}][${this.name}] Source not found`
    const nocontainererrmsg = `[${this.room.name}][${this.name}] Container not found`
    if (!this.memory.source) {
        const sourceId = this.lookArround(LOOK_SOURCES)
        this.memory.source = sourceId
        if (!sourceId) return log(nosrcerrmsg, LOG_WARN, 'STATIC_RHARV')
    }

    if (!this.memory.container) {
        const containerId = this.lookArround(LOOK_STRUCTURES)
        this.memory.container = containerId
        if (!containerId) {
            log(nocontainererrmsg, LOG_INFO, 'STATIC_RHARV')
            this.memory.building = true
            this.memory.role = 'buil'
            if (!this.memory.destConstSite) {
                const conSiteId = this.lookArround(LOOK_CONSTRUCTION_SITES)
                if (!conSiteId) {
                    this.room.createConstructionSite(this.pos.x, this.pos.y, STRUCTURE_CONTAINER)
                    this.memory.destConstSite = this.lookArround(LOOK_CONSTRUCTION_SITES)
                } // !conSiteId
            } // !this.memory.destConstSite
            return this.roleBuilder()
        } // !containerId
    } // !this.memory.container

    const source = Game.getObjectById(this.memory.source)
    if (!source) return log(nosrcerrmsg, LOG_WARN, 'STATIC_RHARV')

    const container = Game.getObjectById(this.memory.container)
    if (!container) {
        log(nocontainererrmsg, LOG_WARN, 'STATIC_RHARV')
        this.memory.container = false
        return
    }

    if (container.hits < container.hitsMax) {
        if (this.store.getUsedCapacity() === 0 && container.store.getUsedCapacity() > this.store.getCapacity()) {
            return this.withdraw(container, RESOURCE_ENERGY)
        }
        return this.repair(container)
    }

    this.harvest(source)
}