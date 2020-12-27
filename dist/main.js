require('Config');
require('Room');
require('Spawn');
require('Creep');
require('StructureTower');
require('overides');

const Logger = require('logger');
const SpawnQueue = require('SpawnQueue')

function every300Ticks() {
    if (Game.time % 300 != 0) { return }
    console.log("Runnig 300 Tks Maintenance")
    balanceCreeps()

    console.log('Clearing non-existing creep memory:', name)
    let name
    for (name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name]
        }
    }
}


function balanceCreeps() {
    _.forEach(Game.creeps, function (crp) { crp.memory.role = crp.name.split("_")[0] })
}


module.exports.loop = function () {
    const logr = new Logger();
    global.log = logr.log;
    global.SpawnQueue = new SpawnQueue();
    every300Ticks();

    if (Game.cpu.bucket < 500) {
        logr.log('Extremely low bucket - skipping loop', LOG_FATAL, "GENERAL")
        return
    }

    _.invoke(Game.rooms, 'run');
    _.invoke(Game.creeps, 'run');

}
