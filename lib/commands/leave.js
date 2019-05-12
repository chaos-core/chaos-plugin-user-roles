const {of} = require('rxjs/index');
const {flatMap} = require('rxjs/operators/index');
const {Command} = require("chaos-core");

const {catchChaosError} = require("../error-handlers");
const {catchJoinableRoleError} = require("../error-handlers");
const {catchDiscordApiError} = require("../error-handlers");

class LeaveCommand extends Command {
  constructor(chaos) {
    super(chaos, {
      name: "leave",
      description: "leave a role",

      args: [{
        name: "role",
        description: "the name of the role to leave",
        required: true,
      }],
    });
  }

  onListen() {
    this.joinRolesService = this.chaos.getService('joinableRoles', 'JoinRolesService');
    this.roleService = this.chaos.getService('core', 'RoleService');
  }

  run(context, response) {
    const roleString = context.args.role;

    return of('').pipe(
      flatMap(() => this.roleService.findRole(context.guild, roleString)),
      flatMap(role => this.joinRolesService.removeUserFromRole(context.member, role).pipe(
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