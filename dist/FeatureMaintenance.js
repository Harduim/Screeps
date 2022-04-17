const maintenanceTasks = [
    {
        id: 'Balance creeps',
        schedule: 300,
        args: false,
        callback: () => {
            _.forEach(Game.creeps, creep => { creep.memory.role = creep.name.split('_')[0] })
        },
    },
    {
        id: 'Remove dead creeps from memory',
        schedule: 300,
        callback: () => {
            _.forEach(
                Memory.creeps,
                creep => { if (!Game.creeps[creep.name]) delete Memory.creeps[creep.name] })
        },
        args: false
    }
]


module.exports = maintenanceTasks