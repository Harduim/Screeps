require('Settings')

require('PrototypeCreep')
require('PrototypeRoom')
require('PrototypeSource')


require("RoleHarvester")

const log = require('ToolLogger')

module.exports.loop = function () {
    global.log = log


    try { _.invoke(Game.creeps, 'run') } catch (e) { log(e, LOG_FATAL) }

}