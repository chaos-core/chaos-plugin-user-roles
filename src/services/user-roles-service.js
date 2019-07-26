const {of, throwError, from} = require('rxjs');
const {flatMap, tap, map, mapTo, filter, toArray} = require('rxjs/operators');
const {Service} = require("chaos-core");

const DataKeys = require("../lib/data-keys");
const {LeaveRoleError, JoinRoleError, UserRoleError, NonJoinableRoleError, NoUserRolesError} = require("../lib/errors");

class UserRolesService extends Service {
  allowRole(role) {
    return of('').pipe(
      flatMap(() => this._getAllowedRoleIds(role.guild)),
      flatMap((allowedIds) => (
        allowedIds[role.id]
          ? throwError(new UserRoleError(`Users can already join ${role.name}.`))
          : of(allowedIds)
      )),
      tap((allowedIds) => allowedIds[role.id] = true),
      flatMap((allowedIds) => this._setAllowedRoleIds(role.guild, allowedIds)),
    );
  }

  removeRole(role) {
    return of('').pipe(
      flatMap(() => this._getAllowedRoleIds(role.guild)),
      flatMap((allowedIds) => (
        !allowedIds[role.id]
          ? throwError(new UserRoleError(`Users could not join ${role.name}.`))
          : of(allowedIds)
      )),
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

  getAllowedRoles(guild) {
    return of('').pipe(
      flatMap(() => this._getAllowedRoleIds(guild)),
      flatMap(allowedIds => from(Object.entries(allowedIds))),
      filter(([, allowed]) => allowed),
      map(([roleId]) => roleId),
      map(roleId => guild.roles.get(roleId)),
      filter(Boolean),
      toArray(),
      flatMap(roles => roles.length === 0
        ? throwError(new NoUserRolesError("No joinable roles were found."))
        : of(roles),
      ),
    );
  }

  getJoinedMemberRoles(member) {
    return of('').pipe(
      flatMap(() => this.getAllowedRoles(member.guild)),
      flatMap(roles => from(roles).pipe(
        filter(role => member.roles.has(role.id)),
        toArray(),
      )),
    );
  }

  getAvailableMemberRoles(member) {
    return of('').pipe(
      flatMap(() => this.getAllowedRoles(member.guild)),
      flatMap(roles => from(roles).pipe(
        filter(role => !member.roles.has(role.id)),
        toArray(),
      )),
    );
  }

  _getAllowedRoleIds(guild) {
    return of('').pipe(
      flatMap(() => this.chaos.getGuildData(guild.id, DataKeys.ALLOWED_ROLE_IDS)),
      map((allowedIds) => typeof allowedIds == "undefined" ? {} : allowedIds),
    );
  }

  _setAllowedRoleIds(guild, UserRoles) {
    return of('').pipe(
      flatMap(() => this.chaos.setGuildData(guild.id, DataKeys.ALLOWED_ROLE_IDS, UserRoles)),
    );
  }
}

module.exports = UserRolesService;