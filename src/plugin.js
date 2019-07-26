module.exports = {
  name: "UserRoles",
  description: "Allows users to add themselves to roles",

  services: [
    require('./services/user-roles-service'),
  ],

  configActions: [
    require('./config/add-role'),
    require('./config/remove-role'),
  ],

  commands: [
    require('./commands/join'),
    require('./commands/leave'),
    require('./commands/roles'),
  ],
};
