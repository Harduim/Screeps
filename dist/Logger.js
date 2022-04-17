global.LOG_FATAL = 5
global.LOG_ERROR = 4
global.LOG_WARN = 3
global.LOG_INFO = 2
global.LOG_DEBUG = 1
global.LOG_TRACE = 0

global.LOG_DEFAULT = LOG_WARN
global.LOG_DEFAULT_GROUP = 'default'


const ERROR_COLORS = {
  5: '#ff0066',
  4: '#e65c00',
  3: '#809fff',
  2: '#999999',
  1: '#737373',
  0: '#666666',
  highlight: '#ffff00'
}

function log (message, severity = LOG_DEFAULT, group = LOG_DEFAULT_GROUP, tags = []) {
  message = group !== LOG_DEFAULT_GROUP ? `[${group}]: ${message}` : `[${message}]`

  if (!Memory.logLevel) Memory.logLevel = {}
  const logLevel = Memory.logLevel
  if (!logLevel[group]) logLevel[group] = LOG_INFO
  if (logLevel[group] > severity) return

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
