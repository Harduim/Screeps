require('Room');
require('Spawn');
require('Creep');
require('StructureTower');


const Logger = require('logger');
const MYDEBUG = true;


function every6000Ticks() {
    if (Game.time % 6000 != 0) { return }
    Logger.log('Extremely low bucket - aborting script run at start of loop', LOG_INFO)

    if (MYDEBUG) {
        console.log('Clearing non-existing creep memory:', name)
    }
    let name
    for (name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name]
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
    const logr = new Logger()
    if (Game.cpu.bucket < 500) {
        logr.log('Extremely low bucket - skipping loop', LOG_FATAL, "GENERAL")
        return
    }

    _.invoke(Game.rooms, 'run', logr)
    _.invoke(Game.creeps, 'run', logr)

    every300Ticks()
    every6000Ticks()
}
