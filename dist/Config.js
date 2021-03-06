global.MAXRHARV = 1
global.ENERGYDIVIDER = 1800
global.SMALLUTILPTS = [MOVE, MOVE, MOVE, CARRY, CARRY, WORK]
global.BIGLUTILPTS = [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, WORK, WORK]
global.SMALLCARRYPTS = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]
global.BIGCARRYPTS = [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, CARRY, MOVE, CARRY, MOVE]
global.FREE_SPAWNS = { filter: spn => spn.spawning == null }
global.TERMINAL_ENERGY_BUFFER = 100000

global.STORAGE_THRESHOLD_MASON = 3000
global.ARMYROLES = ['shaman', 'grunt', 'hunter', 'demolisher', 'tank']
global.DEFAULT_ROLE_PRIORITY = {
  harv: 9,
  upgr: 9,
  buff: 8,
  linker: 9,
  claim: 11,
  rharv: 10,
  rminer: 10,
  grunt: 2,
  hunter: 2,
  demolisher: 2,
  tank: 2,
  shaman: 3
}
