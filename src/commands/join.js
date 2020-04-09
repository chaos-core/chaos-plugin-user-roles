const {Command} = require("chaos-core");
const {ChaosError} = require("chaos-core").errors;
const {DiscordAPIError} = require('discord.js');

const {handleDiscordApiError, handleChaosError} = require("../lib/error-handlers");

class JoinCommand extends Command {
  constructor(chaos) {
    super(chaos, {
      name: "join",
      description: "join a role",

      args: [{
        name: "role",
        description: "the name of the role to join",
        greedy: true,
        required: true,
      }],
    });
  }

  get strings() {
    return super.strings.userRoles.commands.join;
  }

  async run(context, response) {
    const UserRolesService = this.chaos.getService('UserRoles', 'UserRolesService');
    const roleService = this.chaos.getService('core', 'RoleService');
    const roleString = context.args.role;

    try {
      const role = await roleService.findRole(context.guild, roleString);
      await UserRolesService.addUserToRole(context.member, role);
      await response.send({
        content: this.strings.addedToRole({roleName: role.name}),
      });
    } catch (error) {
      switch (true) {
        case error instanceof DiscordAPIError:
          return handleDiscordApiError(error, response);
        case error instanceof ChaosError:
          return handleChaosError(error, response);
        default:
          throw error;
      }
    }
  }
}

module.exports = JoinCommand;
