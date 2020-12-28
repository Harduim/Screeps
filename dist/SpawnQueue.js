// To do: https://make.wordpress.org/core/handbook/best-practices/inline-documentation-standards/javascript/

class SpawnQueue {
  constructor () {
    if (!Memory.SpawnQueue) cleanQueue()
  }

  addCreep (
    roomName = 'any',
    role = 'harv',
    energy = 0,
    priority = 9,
    body = false,
    memory = false
  ) {
    const roomQ = this.getRoomQueue(roomName)

    roomQ.push({ priority, roomName, role, energy, body, memory })
    roomQ.sort((a, b) => b.priority - a.priority)
  }

  getCreep (roomName = 'any') {
    return this.getRoomQueue(roomName).pop()
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

  cleanQueue () {
    Memory.SpawnQueue = {}
  }

  toString () {
    return JSON.stringify(this.getQueue())
  }
}

module.exports = SpawnQueue
