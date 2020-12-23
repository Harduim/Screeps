require('Room');
require('Spawn');
require('Creep');
require('StructureTower');


global.XABLAU = 99

const Logger = require('logger');


function every6000Ticks() {
    if (Game.time % 6000 != 0) { return }
    Logger.log('Extremely low bucket - aborting script run at start of loop', LOG_INFO)

    console.log('Clearing non-existing creep memory:', name)
    let name
    for (name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name]
        }
    }
}


function every300Ticks() {
    if (Game.time % 300 != 0) { return }
    console.log("Runnig 300 Tks Maintenance")
    balanceCreeps()
}


function balanceCreeps() {
    _.forEach(Game.creeps, function (crp) { crp.memory.role = crp.name.split("_")[0] })
}


module.exports.loop = function () {
    const logr = new Logger()
    global.log = logr.log

    if (Game.cpu.bucket < 500) {
        logr.log('Extremely low bucket - skipping loop', LOG_FATAL, "GENERAL")
        return
    }

    _.invoke(Game.rooms, 'run')
    _.invoke(Game.creeps, 'run')

    every300Ticks()
    every6000Ticks()
}
