const exampleTasks = [
    {
        id: 'TestTask',
        schedule: 10,
        callback: () => { console.log("was called") },
        args: false
    }
]

const scheduler = (tasks) => {
    tasks.forEach(
        t => {
            if (Game.time % t.schedule !== 0) return

            log(`Running ${t.id} on schedule ${t.schedule}`, LOG_DEBUG)
            return t.args !== false ? t.callback(...t.args) : t.callback()
        }
    );
}

module.exports = scheduler