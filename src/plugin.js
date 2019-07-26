module.exports = {
  name: "UserRoles",
  description: "Allows users to add themselves to roles",

  services: [
    require('./services/user-roles-service'),
  ],

  commands: [
    require('./commands/join'),
    require('./commands/leave'),
    require('./commands/roles'),
  ],
};
