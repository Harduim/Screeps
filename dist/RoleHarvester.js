const roleFactory = require("FactoryRole")

module.exports = roleFactory({ name: HARVESTER, run: () => console.log("Run harv") })