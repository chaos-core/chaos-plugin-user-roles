const {of} = require('rxjs');
const {flatMap} = require('rxjs/operators');
const {Command} = require("chaos-core");

const {catchChaosError} = require("../error-handlers");
const {catchJoinableRoleError} = require("../error-handlers");
const {catchDiscordApiError} = require("../error-handlers");

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

  onListen() {
    this.joinRolesService = this.chaos.getService('joinableRoles', 'JoinRolesService');
    this.roleService = this.chaos.getService('core', 'RoleService');
  }

  run(context, response) {
    const roleString = context.args.role;

    return of('').pipe(
      flatMap(() => this.roleService.findRole(context.guild, roleString)),
      flatMap(role => this.joinRolesService.addUserToRole(context.member, role).pipe(
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