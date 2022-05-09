Room.prototype.toString = function () {
    return JSON.stringify(this)
}

Room.prototype.storageEnergy = function () {
    if (!this.storage) return 0
    return this.storage.store.getUsedCapacity(RESOURCE_ENERGY)
}

Room.prototype.nameToInt = function () {
    const nums = []
    let c
    for (c of this.name) nums.push(c.charCodeAt(0))
    return nums.join('')
}