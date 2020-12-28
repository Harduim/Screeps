// Adapted from https://github.com/ScreepsQuorum/screeps-quorum/blob/master/src/qos/logger.js
'use strict'

global.LOG_FATAL = 5
global.LOG_ERROR = 4
global.LOG_WARN = 3
global.LOG_INFO = 2
global.LOG_DEBUG = 1
global.LOG_TRACE = 0

const ERROR_COLORS = {
  5: '#ff0066',
  4: '#e65c00',
  3: '#809fff',
  2: '#999999',
  1: '#737373',
  0: '#666666',
  highlight: '#ffff00'
}

function log (message, severity = 3, group = 'default', tags = []) {
  message = group !== 'default' ? `[${group}]: ${message}` : `[${message}]`

  let loglevel
  if (!Memory.loglevel) {
    Memory.loglevel = {}
  }
  loglevel = Memory.loglevel

  if (!loglevel[group]) {
    loglevel[group] = LOG_INFO
  }

  if (loglevel[group] > severity) { return }

  let attributes = ''
  let tag
  if (tags) {
    for (tag in tags) {
      attributes += ` ${tag}="${tags[tag]}"`
    }
  }
  attributes += ` group="${group}"`
  attributes += ` severity="${severity}"`
  attributes += ` tick="${Game.time}"`
  message = `<font color="${ERROR_COLORS[severity]}"${attributes}>${message}</font>`
  console.log(message)
}

module.exports = log
