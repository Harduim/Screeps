require('Room');
require('Spawn');
require('Creep');
require('StructureTower');


const MYDEBUG = true;


function every6000Ticks() {
    if (Game.time % 6000 != 0) { return }
    if (MYDEBUG) { console.log("Runnig 6000 Tks Maintenance") }

    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name]
            if (MYDEBUG) { console.log('Clearing non-existing creep memory:', name) }
        }
    }
}


function every400Ticks() {
    if (Game.time % 400 != 0) { return }
    if (MYDEBUG) { console.log("Runnig 400 Tks Maintenance") }
    balanceCreeps()
}


function balanceCreeps() {
    _.forEach(Game.creeps, function (crp) { crp.memory.role = crp.name.split("_")[0] })
}


module.exports.loop = function () {
    _.forEach(Game.rooms, function (room) { room.run(MYDEBUG) })
    _.forEach(Game.creeps, function (creep) { creep.run(MYDEBUG) })

    every400Ticks()
    every6000Ticks()
}
