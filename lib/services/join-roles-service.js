const {of, throwError} = require('rxjs');
const {flatMap, tap, map, mapTo} = require('rxjs/operators');
const {Service} = require("chaos-core");

const DataKeys = require("../data-keys");
const {LeaveRoleError, JoinRoleError, NonJoinableRoleError} = require("../errors");

class JoinRolesService extends Service {
  allowRole(role) {
    return of('').pipe(
      flatMap(() => this._getAllowedRoleIds(role.guild)),
      tap((allowedIds) => allowedIds[role.id] = true),
      flatMap((allowedIds) => this._setAllowedRoleIds(role.guild, allowedIds)),
    );
  }

  removeRole(role) {
    return of('').pipe(
      flatMap(() => this._getAllowedRoleIds(role.guild)),
      tap((allowedIds) => allowedIds[role.id] = false),
      flatMap((allowedIds) => this._setAllowedRoleIds(role.guild, allowedIds)),
    );
  }

  addUserToRole(member, role) {
    return of('').pipe(
      flatMap(() => this.isRoleAllowed(role)),
      flatMap(allowed => !allowed
        ? throwError(new NonJoinableRoleError(`${role.name} can not be joined.`))
        : of(''),
      ),
      flatMap(() => member.roles.has(role.id)
        ? throwError(new JoinRoleError(`You have already joined ${role.name}.`))
        : of(''),
      ),
      flatMap(() => member.addRole(role)),
      mapTo(role),
    );
  }

  removeUserFromRole(member, role) {
    return of('').pipe(
      flatMap(() => this.isRoleAllowed(role)),
      flatMap(allowed => !allowed
        ? throwError(new NonJoinableRoleError(`${role.name} can not be joined.`))
        : of(''),
      ),
      flatMap(() => !member.roles.has(role.id)
        ? throwError(new LeaveRoleError(`You have not joined ${role.name}.`))
        : of(''),
      ),
      flatMap(() => member.removeRole(role)),
      mapTo(role),
    );
  }

  isRoleAllowed(role) {
    return of('').pipe(
      flatMap(() => this._getAllowedRoleIds(role.guild)),
      map((allowedIds) => allowedIds[role.id]),
      map((allowed) => typeof allowed === "undefined" ? false : allowed),
    );
  }

  _getAllowedRoleIds(guild) {
    return of('').pipe(
      flatMap(() => this.chaos.getGuildData(guild.id, DataKeys.ALLOWED_ROLE_IDS)),
      map((allowedIds) => typeof allowedIds == "undefined" ? {} : allowedIds),
    );
  }

  _setAllowedRoleIds(guild, joinableRoles) {
    return of('').pipe(
      flatMap(() => this.chaos.setGuildData(guild.id, DataKeys.ALLOWED_ROLE_IDS, joinableRoles)),
    );
  }
}

module.exports = JoinRolesService;