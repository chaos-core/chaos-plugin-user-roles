const {of} = require('rxjs');
const {flatMap} = require('rxjs/operators');
const {Command} = require("chaos-core");

const {catchChaosError} = require("../lib/error-handlers");
const {catchJoinableRoleError} = require("../lib/error-handlers");
const {catchDiscordApiError} = require("../lib/error-handlers");

class JoinCommand extends Command {
  constructor(chaos) {
    super(chaos, {
      name: "join",
      description: "join a role",

      args: [{
        name: "role",
        description: "the name of the role to join",
        required: true,
      }],
    });
  }

  run(context, response) {
    const joinRolesService = this.chaos.getService('joinableRoles', 'JoinRolesService');
    const roleService = this.chaos.getService('core', 'RoleService');
    const roleString = context.args.role;

    return of('').pipe(
      flatMap(() => roleService.findRole(context.guild, roleString)),
      flatMap(role => joinRolesService.addUserToRole(context.member, role).pipe(
        flatMap(() => response.send({
          content: `You have been added to the role ${role.name}.`,
        })),
      )),
      catchDiscordApiError(context, response),
      catchJoinableRoleError(context, response),
      catchChaosError(context, response),
    );
  }
}

module.exports = JoinCommand;