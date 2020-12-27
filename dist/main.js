require('Config');
require('Room');
require('Spawn');
require('Creep');
require('StructureTower');

const Logger = require('logger');
const SpawnQueue = require('SpawnQueue')

function every6000Ticks() {
    if (Game.time % 6000 != 0) { return }

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
    const logr = new Logger();
    global.log = logr.log;

    const sq = new SpawnQueue();
    sq.add_creep('sala1');
    sq.add_creep('sala10');
    sq.add_creep('10_ws');
    sq.add_creep('10_ws');
    sq.add_creep('10_ws');
    const creep_q = sq.get_creep('sala1');
    log(JSON.stringify(creep_q))

    if (Game.time % 10 == 0) { 
        sq.clean_queue();
    }

    if (Game.cpu.bucket < 500) {
        logr.log('Extremely low bucket - skipping loop', LOG_FATAL, "GENERAL")
        return
    }

    every300Ticks();
    every6000Ticks();

    _.invoke(Game.rooms, 'run');
    _.invoke(Game.creeps, 'run');

}
