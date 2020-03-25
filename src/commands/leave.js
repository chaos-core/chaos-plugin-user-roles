const {of} = require('rxjs/index');
const {flatMap} = require('rxjs/operators/index');
const {Command} = require("chaos-core");

const {catchChaosError} = require("../lib/error-handlers");
const {catchJoinableRoleError} = require("../lib/error-handlers");
const {catchDiscordApiError} = require("../lib/error-handlers");

class LeaveCommand extends Command {
  constructor(chaos) {
    super(chaos, {
      name: "leave",
      description: "leave a role",

      args: [{
        name: "role",
        description: "the name of the role to leave",
        greedy: true,
        required: true,
      }],
    });
  }

  run(context, response) {
    const UserRolesService = this.chaos.getService('UserRoles', 'UserRolesService');
    const roleService = this.chaos.getService('core', 'RoleService');
    const roleString = context.args.role;

    return of('').pipe(
      flatMap(() => roleService.findRole(context.guild, roleString)),
      flatMap(role => UserRolesService.removeUserFromRole(context.member, role).pipe(
        flatMap(() => response.send({
          content: `You have been removed from the role ${role.name}.`,
        })),
      )),
      catchDiscordApiError(context, response),
      catchJoinableRoleError(context, response),
      catchChaosError(context, response),
    );
  }
}

module.exports = LeaveCommand;