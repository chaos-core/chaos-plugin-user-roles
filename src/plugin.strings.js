module.exports = {
  userRoles: {
    commands: {
      join: require('./commands/join.strings'),
      leave: require('./commands/leave.strings'),
      roles: require('./commands/roles.strings'),
    },
    configActions: {
      addRole: require('./config-actions/add-role.strings'),
      removeRole: require('./config-actions/remove-role.strings'),
    },
  },
};
