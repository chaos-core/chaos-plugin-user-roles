const {Service} = require("chaos-core");

const DataKeys = require("../lib/data-keys");
const UserRoleError = require('../lib/user-role-error');

class UserRolesService extends Service {
  async allowRole(role) {
    const allowedIds = await this._getAllowedRoleIds(role.guild);

    if (allowedIds[role.id]) {
        throw new UserRoleError(`Users can already join ${role.name}.`);
    }

    allowedIds[role.id] = true;
    return this._setAllowedRoleIds(role.guild, allowedIds);
  }

  async removeRole(role) {
    const allowedIds = await this._getAllowedRoleIds(role.guild);

    if (!allowedIds[role.id]) {
        throw new UserRoleError(`Users could not join ${role.name}.`);
    }

    allowedIds[role.id] = false;
    return this._setAllowedRoleIds(role.guild, allowedIds);
  }

  async addUserToRole(member, role) {
    const allowed = await this.isRoleAllowed(role);
    if (!allowed) {
      throw new UserRoleError(`${role.name} can not be joined.`);
    }
    if (member.roles.has(role.id)) {
      throw new UserRoleError(`You have already joined ${role.name}.`);
    }
    await member.addRole(role);
  }

  async removeUserFromRole(member, role) {
    const allowed = await this.isRoleAllowed(role);
    if (!allowed) {
      throw new UserRoleError(`${role.name} can not be joined.`);
    }
    if (!member.roles.has(role.id)) {
      throw new UserRoleError(`You have not joined ${role.name}.`);
    }
    await member.removeRole(role);
  }

  async isRoleAllowed(role) {
    const allowedIds = await this._getAllowedRoleIds(role.guild);
    const allowed = allowedIds[role.id];
    return typeof allowed === "undefined" ? false : allowed;
  }

  async getAllowedRoles(guild) {
    const allowedIds = await this._getAllowedRoleIds(guild);
    const roles = [];

    for (const [roleId, allowed] of Object.entries(allowedIds)) {
      const role = guild.roles.get(roleId);
      if (role && allowed) {
        roles.push(role);
      }
    }

    if (roles.length === 0) {
      throw new UserRoleError("No roles to join were found.");
    } else {
      return roles;
    }
  }

  async getJoinedMemberRoles(member) {
    const roles = await this.getAllowedRoles(member.guild);
    return roles.filter(role => member.roles.has(role.id));
  }

  async getAvailableMemberRoles(member) {
    const roles = await this.getAllowedRoles(member.guild);
    return roles.filter(role => !member.roles.has(role.id));
  }

  async _getAllowedRoleIds(guild) {
    const allowedIds = await this.getGuildData(guild.id, DataKeys.ALLOWED_ROLE_IDS);
    return (typeof allowedIds === "undefined" ? {} : allowedIds);
  }

  async _setAllowedRoleIds(guild, UserRoles) {
    return this.setGuildData(guild.id, DataKeys.ALLOWED_ROLE_IDS, UserRoles);
  }
}

module.exports = UserRolesService;
