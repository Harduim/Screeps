const cli = {
    log: (text) => log(text, LOG_DEFAULT),
    drawLayout: (roomName) => { Game.rooms[roomName].drawBaseLayout() },
    setLogLevel: (logLevel, group=LOG_DEFAULT_GROUP) => {
        if (!Memory.logLevel[group]) return log(`LogGroup: ${group} not found`, LOG_WARN)
        Memory.logLevel[group] = logLevel
    }
}


module.exports = cli