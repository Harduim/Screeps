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
  }, limit = 1) {
    if (this.getCountByRole(role, roomName) >= limit) {
      log(`Refusing to add creep ${role}`, LOG_WARN, roomName)
      return
    }
    const roomQ = this.getRoomQueue(roomName)
    log(`addCreep ${role} ${energy} ${priority}`, LOG_DEBUG, roomName)
    roomQ.push({ priority, roomName, role, energy, body, memory })
    roomQ.sort((a, b) => b.priority - a.priority)
  }

  getCreep (roomName = 'any') {
    const protoCreep = this.getRoomQueue(roomName).pop()
    if (protoCreep) log(`Popping creep from queue: ${JSON.stringify(protoCreep)}`, LOG_DEBUG, roomName)
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

  bodyBuilder (energyCap, carryFactor = 600, workFactor = 1.8) {
    const carrCount = Math.ceil(energyCap / carryFactor)
    const workCount = Math.floor(Math.floor(energyCap / workFactor) / 100)
    const moveCount = Math.floor((energyCap - ((carrCount * 50) + (workCount * 100))) / 50)

    const bodyPts = []
    let i
    for (i = 1; i <= moveCount; i++) bodyPts.push(MOVE)
    for (i = 1; i <= carrCount; i++) bodyPts.push(CARRY)
    for (i = 1; i <= workCount; i++) bodyPts.push(WORK)

    return bodyPts // Está saindo da jaula o monstro!
  }

  queueToString (roomName = 'any') {
    const roomQ = this.getRoomQueue(roomName)
    let msg = ''
    let pc
    for (pc of roomQ) msg = msg + `[${pc.role}:${pc.energy}],`
    return msg === '' ? '[]' : msg
  }

  toString () {
    return JSON.stringify(this.getQueue())
  }
}

module.exports = SpawnQueue
