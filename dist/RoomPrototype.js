Room.prototype.creepCount = function (role, by = 'Prefix') {
    return _.get(this.memory, `censusBy${by}.${role}`, 0)
}

Room.prototype.creepFilterByRole = function (role, creepList) {
    return _.filter(creepList, crp => crp.memory.role === role)
}

Room.prototype.creepFilterByPrefix = function (prefix, creepList) {
    return _.filter(creepList, crp => crp.name.split('_')[0] === prefix)
}

Room.prototype.toString = function () {
    return JSON.stringify(this)
  }
  