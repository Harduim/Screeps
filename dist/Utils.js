const run_safer = (callback) => {
    try { callback() } catch (e) { log(e, LOG_FATAL) }
}

module.exports = run_safer