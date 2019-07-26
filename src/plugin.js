module.exports = {
  name: "joinableRoles",
  description: "Allows users to add themselves to roles",

  services: [
    require('./services/join-roles-service'),
  ],

  commands: [
    require('./commands/join'),
    require('./commands/leave'),
    require('./commands/roles'),
  ],
};
