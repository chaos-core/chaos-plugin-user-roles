module.exports = {
  userRoles: {
    commands: {
      join: {
        addedToRole: ({roleName}) =>
          `You have been added to the role ${roleName}.`,
      },
      leave: {
        removedFromRole: ({roleName}) =>
          `You have been removed from the role ${roleName}.`,
      },
      roles: {
        availableToJoin: () =>
          `Here are the roles you can join:`,
        allRolesJoined: () =>
          `You've joined all the roles!`,
        embedHeaders: {
          available: () =>
            `Available:`,
          joined: () =>
            `Joined:`,
        },
      },
    },
    configActions: {
      addRole: {
        roleAdded: ({roleName}) =>
          `Users can now join ${roleName}`,
      },
      removeRole: {
        roleRemoved: ({roleName}) =>
          `Users can no longer join ${roleName}`,
      },
    },
  },
};
