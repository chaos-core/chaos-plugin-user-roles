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
        greedy: true,
        required: true,
      }],
    });
  }

  get strings() {
    return super.strings.userRoles.commands.join;
  }

  run(context, response) {
    const UserRolesService = this.chaos.getService('UserRoles', 'UserRolesService');
    const roleService = this.chaos.getService('core', 'RoleService');
    const roleString = context.args.role;

    return of('').pipe(
      flatMap(() => roleService.findRole(context.guild, roleString)),
      flatMap(role => UserRolesService.addUserToRole(context.member, role).pipe(
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
