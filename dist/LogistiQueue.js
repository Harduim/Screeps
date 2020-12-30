class LogistQueue {
    constructor () {
      if (!Memory.LogistQueue) this.cleanQueue()
    }

    cleanQueue () {
        log('Initializing delivery queue', LOG_INFO)
        Memory.LogistQueue = {}
    }
}