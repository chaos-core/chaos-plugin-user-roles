const {of} = require('rxjs/index');
const {flatMap, tap, map} = require('rxjs/operators/index');
const {Service} = require("chaos-core");

const DataKeys = require("../data-keys");

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