Room.prototype.callUber = function (roadId, amount) {
  if (this.memory.UberQueue.filter(ord => ord.roadId === roadId).length > 0) return

  this.memory.UberQueue.push({ roadId: roadId, amount: amount, truck: false })
  this.memory.UberQueue.sort((a, b) => b.amount - a.amount)
}

Room.prototype.receiveUberCall = function (truckName) {
  this.memory.UberQueue[0].truck = truckName
  return this.memory.UberQueue[0]
}

Room.prototype.closeUberCall = function (truckName) {
  // NOT IMPLEMENTED
  const x = 0
}

Room.prototype.cleamDeadUberCalls = function () {
  let call
  for (call of this.memory.UberQueue) {
    if (!Game.creeps[call.truck]) call.truck = false
  }
}
