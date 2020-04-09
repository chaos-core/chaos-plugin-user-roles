const ChaosCore = require('chaos-core');

class UserRolesPlugin extends ChaosCore.Plugin {
  name = "UserRoles";
  description = "Allows users to add themselves to roles";

  services = [
    require('./services/user-roles-service'),
  ];

  configActions = [
    require('./config-actions/add-role'),
    require('./config-actions/remove-role'),
  ];

  commands = [
    require('./commands/join'),
    require('./commands/leave'),
    require('./commands/roles'),
  ];

  strings = require('./plugin.strings');
}

module.exports = UserRolesPlugin;
