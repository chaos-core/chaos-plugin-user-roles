const services = require('./lib/services');
const commands = require('./lib/commands');

module.exports = {
  name: "joinableRoles",
  description: "Allows users to add themselves to roles",

  services: Object.values(services),
  commands: Object.values(commands),
};
