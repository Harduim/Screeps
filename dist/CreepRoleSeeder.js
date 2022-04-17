Creep.prototype.roleSeeder = function roleSeeder() {
    if (!this.room.controller || this.room.controller.id !== this.memory.default_controller) {
        return this.moveTo(Game.getObjectById(this.memory.default_controller))
    }

    this.memory.role = 'harv'
    return this.roleHarvester()
}