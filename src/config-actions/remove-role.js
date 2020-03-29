const ChaosCore = require("chaos-core");
const UserRoleError = require('../lib/user-role-error');
const {of, throwError} = require("rxjs");
const {flatMap, map, mapTo, catchError} = require("rxjs/operators");

class AddRoleAction extends ChaosCore.ConfigAction {
  constructor(chaos) {
    super(chaos, {
      name: "removeRole",
      description: "Removes a role from the list of joinable roles.",

      args: [
        {
          name: "role",
          description: "The name of the role to remove. Can be by mention, name, or id.",
          required: true,
        },
      ],
    });

    this.RoleService = this.chaos.getService('core', 'RoleService');
    this.UserRolesService = this.chaos.getService('UserRoles', 'UserRolesService');
  }

  get strings() {
    return super.strings.userRoles.configActions.removeRole;
  }

  run(context) {
    return of('').pipe(
      flatMap(() => this.RoleService.findRole(context.guild, context.args.role)),
      flatMap((role) => this.UserRolesService.removeRole(role).pipe(mapTo(role))),
      map((role) => ({
        status: 200,
        content: `Users can no longer join ${role.name}`,
      })),
      catchError((error) => {
        switch (true) {
          case error instanceof ChaosCore.errors.RoleNotFoundError:
          case error instanceof UserRoleError:
            return of({status: 400, content: error.message});
          default:
            return throwError(error);
        }
      }),
    );
  }
}

module.exports = AddRoleAction;
