const ChaosCore = require("chaos-core");

class AddRoleAction extends ChaosCore.ConfigAction {
  constructor(chaos) {
    super(chaos, {
      name: "addRole",
      description: "Adds a role to the list of joinable roles.",

      args: [
        {
          name: "role",
          description: "The name of the role to add. Can be by mention, name, or id.",
          greedy: true,
          required: true,
        },
      ],
    });

    this.RoleService = this.chaos.getService('core', 'RoleService');
    this.UserRolesService = this.chaos.getService('UserRoles', 'UserRolesService');
  }

  get strings() {
    return super.strings.userRoles.configActions.addRole;
  }

  async run(context) {
    try {
      const role = await this.RoleService.findRole(context.guild, context.args.role).toPromise();
      await this.UserRolesService.allowRole(role);
      return {
        status: 200,
        content: this.strings.roleAdded({roleName: role.name}),
      };
    } catch (error) {
      switch (true) {
        case error instanceof ChaosCore.errors.ChaosError:
          return {status: 400, content: error.message};
        default:
          throw error;
      }
    }
  }
}

module.exports = AddRoleAction;
