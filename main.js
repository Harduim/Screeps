require('Room');
require('Spawn');
require('Creep');
require('StructureTower');


const MYDEBUG = true;


function every6000Ticks() {
    if (Game.time % 6000 != 0) { return }
    if (MYDEBUG) { console.log("Runnig 6000 Tks Maintenance") }

    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name]
            if (MYDEBUG) { console.log('Clearing non-existing creep memory:', name) }
        }
    }
}


function every300Ticks() {
    if (Game.time % 300 != 0) { return }
    if (MYDEBUG) { console.log("Runnig 300 Tks Maintenance") }
    balanceCreeps()
}


function balanceCreeps() {
    _.forEach(Game.creeps, function (crp) { crp.memory.role = crp.name.split("_")[0] })
}


module.exports.loop = function () {
    _.invoke(Game.rooms, 'run', MYDEBUG)
    _.invoke(Game.creeps, 'run', MYDEBUG)

    every300Ticks()
    every6000Ticks()
}
