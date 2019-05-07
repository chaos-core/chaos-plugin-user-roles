const {JoinRolesService} = require('./lib/services');


module.exports = {
  name: "joinableRoles",
  description: "Allows users to add themselves to roles",

  services: [
    JoinRolesService,
  ],
};
