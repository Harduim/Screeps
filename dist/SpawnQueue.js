// To do: https://make.wordpress.org/core/handbook/best-practices/inline-documentation-standards/javascript/

class SpawnQueue {
  constructor () {
    if (!Memory.SpawnQueue) this.cleanQueue()
  }

  addCreep ({
    roomName = 'any',
    role = 'role',
    energy = 0,
    priority = 9,
    body = false,
    memory = false
  }) {
    const roomQ = this.getRoomQueue(roomName)

    roomQ.push({ priority, roomName, role, energy, body, memory })
    roomQ.sort((a, b) => b.priority - a.priority)
  }

  getCreep (roomName = 'any') {
    const protoCreep = this.getRoomQueue(roomName).pop()
    log(`Popping creep from queue: ${JSON.stringify(protoCreep)}`, LOG_DEBUG)
    return protoCreep
  }

  getQueue () {
    return Memory.SpawnQueue
  }

  getRoomQueue (roomName = 'any') {
    const SpawnQ = this.getQueue()
    if (!SpawnQ[roomName]) {
      SpawnQ[roomName] = []
    }
    return SpawnQ[roomName]
  }

  getCountByRole (role, roomName = 'any') {
    const roomQ = this.getRoomQueue(roomName)
    const roleQ = roomQ.filter(qed => qed.role === role)
    return roleQ.length
  }

  cleanQueue () {
    log('Initializing spawn queue', LOG_INFO)
    Memory.SpawnQueue = {}
  }

  toString () {
    return JSON.stringify(this.getQueue())
  }
}

module.exports = SpawnQueue
