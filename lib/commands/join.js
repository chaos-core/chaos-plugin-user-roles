const {of, throwError} = require('rxjs/index');
const {flatMap, catchError} = require('rxjs/operators/index');
const {Command} = require("chaos-core");

const errors = require("../errors");

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
      catchError(error => {
        if (error instanceof errors.JoinableRoleError) {
          return JoinCommand.handleJoinableRoleError(context, response, error);
        } else {
          return throwError(error);
        }
      }),
    );
  }

  static handleJoinableRoleError(context, response, error) {
    switch(true) {
      case error instanceof errors.NonJoinableRoleError:
      case error instanceof errors.JoinRoleError:
        return response.send({
          content: error.message,
        });
      default:
        return throwError(error);
    }
  }
}

module.exports = JoinCommand;