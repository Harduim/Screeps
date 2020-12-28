// To do: https://make.wordpress.org/core/handbook/best-practices/inline-documentation-standards/javascript/

class SpawnQueue {
  constructor () {
    if (!Memory.SpawnQueue) {
      clean_queue()
    }
  }

  add_creep (
    roomName = 'any',
    role = 'harv',
    energy = 0,
    priority = 9,
    body = false,
    memory = false
  ) {
    const roomQ = this.get_room_queue(roomName)

    roomQ.push({ priority, roomName, role, energy, body, memory })
    roomQ.sort((a, b) => b.priority - a.priority)
  }

  get_creep (roomName = 'any') {
    return this.get_room_queue(roomName).pop()
  }

  get_queue () {
    return Memory.SpawnQueue
  }

  get_room_queue (roomName = 'any') {
    const SpawnQ = this.get_queue()
    if (!SpawnQ[roomName]) {
      SpawnQ[roomName] = []
    }
    return SpawnQ[roomName]
  }

  clean_queue () {
    Memory.SpawnQueue = {}
  }

  bodyBuilder (energyCap, carryFactor = 600, workFactor = 1.8) {
    const carryCount = Math.ceil(energyCap / carryFactor)
    const workCount = Math.floor(Math.floor(energyCap / workFactor) / 100)
    const moveCount = Math.floor((energyCap - ((carryCount * 50) + (workCount * 100))) / 50)

    const bodyPts = []
    let i = 1
    for (i; i <= moveCount; i++) { bodyPts.push(MOVE) }
    i = 1
    for (i; i <= carryCount; i++) { bodyPts.push(CARRY) }
    i = 1
    for (i; i <= workCount; i++) { bodyPts.push(WORK) }

    return bodyPts // Está saindo da jaula o monstro!
  }

  fighterBodyBuilder (role, energyCap, toughCount = 0) {
    /*
        MOVE            50:     Move
        WORK            100:    Dismantles a structure for 50 hits per tick
        ATTACK          80:     30 hits per tick short-ranged
        RANGED_ATTACK   150:    10 hits per tick long-range 3 squares.
                                Attacks all hostile creeps/structures within 3 squares range with 1-4-10 hits
                                (depending on the range).
        HEAL            250:    Heals 12 hits per tick in short range or 4 hits per tick at a distance.
        TOUGH           10:     No effect, just additional hit points to the creep's body. Can be boosted to resist damage.
        */

    const moveCost = 50
    const workCost = 100
    const attackCost = 80
    const rangedAttackCost = 150
    const healCost = 250
    const toughCost = 10

    const armyRoles = {
      shaman: [healCost, HEAL],
      grunt: [attackCost, ATTACK],
      hunter: [rangedAttackCost, RANGED_ATTACK],
      demolisher: [workCost, WORK],
      tank: [attackCost, TOUGH]
    }

    const [roleCost, rolePart] = armyRoles[role]
    const toughEnergy = toughCount * toughCost
    energyCap = energyCap - toughEnergy

    const roleMainProp = Math.ceil(roleCost / moveCost)
    const moveEnergy = energyCap / roleMainProp
    const roleMainEnergy = energyCap - moveEnergy

    const roleCount = Math.floor(roleMainEnergy / roleCost)
    const moveCount = Math.floor(moveEnergy / moveCost)
    let bodyPts = []

    for (let i = 1; i <= toughCount; i++) { bodyPts = bodyPts.concat(TOUGH) }
    for (let i = 1; i <= roleCount; i++) { bodyPts = bodyPts.concat(rolePart) }
    for (let i = 1; i <= moveCount; i++) { bodyPts = bodyPts.concat(MOVE) }

    return bodyPts
  }

  toString () {
    return JSON.stringify(this.get_queue())
  }
}

module.exports = SpawnQueue
