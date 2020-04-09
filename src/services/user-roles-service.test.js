const {Collection, SnowflakeUtil} = require('discord.js');
const {range} = require('range');

const createChaosBot = require('../../test/create-chaos-bot');
const DataKeys = require("../lib/data-keys");
const UserRoleError = require('../lib/user-role-error');

describe('Service: UserRolesService', function () {
  beforeEach(function () {
    this.chaos = createChaosBot();
    this.userRolesService = this.chaos.getService('UserRoles', 'UserRolesService');

    this.guild = {
      id: SnowflakeUtil.generate(),
      roles: new Collection(),
    };

    this.role = {
      id: SnowflakeUtil.generate(),
      name: 'test',
      guild: this.guild,
    };
  });

  describe('#allowRole', function () {
    context('when the role is not marked as joinable', function () {
      it('marks the role as joinable', async function () {
        await this.userRolesService.allowRole(this.role).toPromise();
        const allowedIds = await this.chaos.getGuildData(this.guild.id, DataKeys.ALLOWED_ROLE_IDS).toPromise();
        expect(allowedIds[this.role.id]).to.be.true;
      });
    });

    context('when the role is marked as joinable', function () {
      beforeEach(async function () {
        let allowedIds = {};
        allowedIds[this.role.id] = true;

        await this.chaos.setGuildData(this.guild.id, DataKeys.ALLOWED_ROLE_IDS, allowedIds)
          .toPromise();
      });

      it('throws a UserRoleError', async function () {
        try {
          await this.userRolesService.allowRole(this.role).toPromise();
        } catch (error) {
          expect(error).to.an.instanceOf(UserRoleError);
          expect(error.message).to.equal(`Users can already join ${this.role.name}.`);
          return;
        }

        throw new Error("Expected an error to be thrown");
      });
    });
  });

  describe('#removeRole', function () {
    context('when the role is marked as joinable', function () {
      beforeEach(async function () {
        let allowedIds = {};
        allowedIds[this.role.id] = true;

        await this.chaos.setGuildData(this.guild.id, DataKeys.ALLOWED_ROLE_IDS, allowedIds)
          .toPromise();
      });

      it('marks the role as not joinable', async function () {
        await this.userRolesService.removeRole(this.role).toPromise();
        const allowedIds = await this.chaos.getGuildData(this.guild.id, DataKeys.ALLOWED_ROLE_IDS).toPromise();
        expect(allowedIds[this.role.id]).to.be.false;
      });
    });

    context('when the role is not marked as joinable', function () {
      it('throws a UserRoleError', async function () {
        try {
          await this.userRolesService.removeRole(this.role).toPromise();
        } catch (error) {
          expect(error).to.an.instanceOf(UserRoleError);
          expect(error.message).to.equal(`Users could not join ${this.role.name}.`);
          return;
        }

        throw new Error("Expected an error to be thrown");
      });
    });
  });

  describe('#addUserToRole', function () {
    beforeEach(function () {
      this.member = {
        guild: this.guild,
        roles: new Collection(),
        addRole: function (role) {
          this.roles.set(role.id, role);
          return Promise.resolve(this);
        },
      };
    });

    context('when the role is not joinable', function () {
      it('throws a NonJoinableRoleError', async function () {
        try {
          await this.userRolesService.addUserToRole(this.member, this.role).toPromise();
        } catch (error) {
          expect(error).to.an.instanceOf(UserRoleError);
          expect(error.message).to.equal("test can not be joined.");
          return;
        }

        throw new Error("Expected an error to be thrown");
      });

      it('does not add the role to the user', async function () {
        sinon.spy(this.member, 'addRole');
        await this.userRolesService.addUserToRole(this.member, this.role).toPromise()
          .catch(() => ''); //Ignore expected error

        expect(this.member.addRole).not.to.have.been.called;
      });
    });

    context('when the role is joinable', function () {
      beforeEach(async function () {
        await this.userRolesService.allowRole(this.role)
          .toPromise();
      });

      it('adds the role to the user', async function () {
        sinon.spy(this.member, 'addRole');

        await this.userRolesService.addUserToRole(this.member, this.role).toPromise();
        expect(this.member.addRole).to.have.been.calledWith(this.role);
      });

      context('when the user already has the role', function () {
        beforeEach(async function () {
          await this.member.addRole(this.role);
        });

        it('throws a JoinableRoleError', async function () {
          try {
            await this.userRolesService.addUserToRole(this.member, this.role).toPromise();
          } catch (error) {
            expect(error).to.be.an.instanceOf(UserRoleError);
            expect(error.message).to.equal('You have already joined test.');
            return;
          }

          throw new Error("Expected an error to be thrown");
        });

        it('does not add the role to the user', async function () {
          sinon.spy(this.member, 'addRole');

          await this.userRolesService.addUserToRole(this.member, this.role).toPromise()
            .catch(() => ''); //silence expected error
          expect(this.member.addRole).not.to.have.been.called;
        });
      });
    });
  });

  describe('#removeUserFromRole', function () {
    beforeEach(function () {
      this.member = {
        id: SnowflakeUtil.generate(),
        roles: new Collection(),
        guild: this.guild,
        removeRole: function (role) {
          this.roles.delete(role.id);
          return Promise.resolve(this);
        },
      };

      this.member.roles.set(this.role.id, this.role);
    });

    context('when the role is not joinable', function () {
      it('throws a JoinableRoleError', async function () {
        try {
          await this.userRolesService.removeUserFromRole(this.member, this.role).toPromise();
        } catch (error) {
          expect(error).to.be.an.instanceOf(UserRoleError);
          expect(error.message).to.equal("test can not be joined.");
          return;
        }

        throw new Error("Expected an error to be thrown");
      });
    });

    context('when the role is joinable', function () {
      beforeEach(async function () {
        await this.userRolesService.allowRole(this.role)
          .toPromise();
      });

      it('removes the role from the user', async function () {
        sinon.spy(this.member, 'removeRole');

        await this.userRolesService.removeUserFromRole(this.member, this.role).toPromise();
        expect(this.member.removeRole).to.have.been.calledWith(this.role);
      });

      context('when the user does not have the role', function () {
        beforeEach(function () {
          this.member.roles.delete(this.role.id);
        });

        it('throws a JoinableRoleError', async function () {
          try {
            await this.userRolesService.removeUserFromRole(this.member, this.role).toPromise();
          } catch (error) {
            expect(error).to.be.an.instanceOf(UserRoleError);
            expect(error.message).to.equal('You have not joined test.');
            return;
          }

          throw new Error("Expected an error to be thrown");
        });
      });
    });
  });

  describe('#isRoleAllowed', function () {
    context('when the role is joinable in the server', function () {
      beforeEach(async function () {
        await this.userRolesService.allowRole(this.role)
          .toPromise();
      });

      it('returns true', async function () {
        const result = await this.userRolesService.isRoleAllowed(this.role).toPromise();
        expect(result).to.be.true;
      });
    });

    context('when the role is not joinable in the server', function () {
      it('emits false', async function () {
        const result = await this.userRolesService.isRoleAllowed(this.role).toPromise();
        expect(result).to.be.false;
      });
    });
  });

  describe('#getAllowedRoles', function () {
    context('when there are no joinable roles', function () {
      it('throws a NoUserRolesError', async function () {
        try {
          await this.userRolesService.getAllowedRoles(this.guild).toPromise();
        } catch (error) {
          expect(error).to.be.an.instanceOf(UserRoleError);
          expect(error.message).to.be.equal("No roles to join were found.");
          return;
        }

        throw new Error("Expected an error to be thrown");
      });
    });

    context('when there are joinable roles', function () {
      beforeEach(async function () {
        this.userRoles = [
          'joinable-1',
          'joinable-2',
          'joinable-3',
        ].map(name => ({
          id: SnowflakeUtil.generate(),
          name,
          guild: this.guild,
        }));

        this.nonUserRoles = [
          'non-joinable-1',
          'non-joinable-2',
          'non-joinable-3',
        ].map(name => ({
          id: SnowflakeUtil.generate(),
          name,
          guild: this.guild,
        }));

        for (let role of this.userRoles) {
          this.guild.roles.set(role.id, role);
          await this.userRolesService.allowRole(role).toPromise();
        }

        for (let role of this.nonUserRoles) {
          this.guild.roles.set(role.id, role);
        }
      });

      it('emits all joinable roles', async function () {
        const roles = await this.userRolesService.getAllowedRoles(this.guild).toPromise();
        expect(roles.map(r => r.name)).to.deep.equal(
          this.userRoles.map(r => r.name),
        );
      });
    });
  });

  describe('#getJoinedMemberRoles', function () {
    beforeEach(function () {
      this.member = {
        guild: this.guild,
        roles: new Collection(),
      };
    });

    context('when there are no joinable roles', function () {
      it('throws a NoUserRolesError', async function () {
        try {
          await this.userRolesService.getJoinedMemberRoles(this.member).toPromise();
        } catch (error) {
          expect(error).to.be.an.instanceOf(UserRoleError);
          expect(error.message).to.be.equal("No roles to join were found.");
          return;
        }

        throw new Error("Expected an error to be thrown");
      });
    });

    context('when there are joinable roles', function () {
      beforeEach(async function () {
        this.roles = range(0, 6)
          .map(roleNum => ({
            id: SnowflakeUtil.generate(),
            name: `role-${roleNum}`,
            guild: this.guild,
          }));

        for (const role of this.roles) {
          this.guild.roles.set(role.id, role);
          await this.userRolesService.allowRole(role).toPromise();
        }
      });

      context('when the user has not joined any roles', function () {
        it('returns an empty array', async function () {
          const roles = await this.userRolesService.getJoinedMemberRoles(this.member).toPromise();
          expect(roles).to.deep.equal([]);
        });
      });

      context('when the user has joined some roles', function () {
        beforeEach(function () {
          this.joinedRoles = [
            this.roles[3],
            this.roles[4],
            this.roles[5],
          ];

          this.joinedRoles.forEach(role => this.member.roles.set(role.id, role));
        });

        it('emits the roles the user has joined', async function () {
          const roles = await this.userRolesService.getJoinedMemberRoles(this.member).toPromise();
          expect(roles.map(r => r.name)).to.deep.equal(
            this.joinedRoles.map(r => r.name),
          );
        });
      });
    });
  });

  describe('#getAvailableMemberRoles', function () {
    beforeEach(function () {
      this.member = {
        guild: this.guild,
        roles: new Collection(),
      };
    });

    context('when there are no joinable roles', function () {
      it('throws a NoUserRolesError', async function () {
        try {
          await this.userRolesService.getAvailableMemberRoles(this.member).toPromise();
        } catch (error) {
          expect(error).to.be.an.instanceOf(UserRoleError);
          expect(error.message).to.be.equal("No roles to join were found.");
          return;
        }

        throw new Error("Expected an error to be thrown");
      });
    });

    context('when there are joinable roles', function () {
      beforeEach(async function () {
        this.roles = range(0, 6)
          .map(roleNum => ({
            id: SnowflakeUtil.generate(),
            name: `role-${roleNum}`,
            guild: this.guild,
          }));

        for (const role of this.roles) {
          this.guild.roles.set(role.id, role);
          await this.userRolesService.allowRole(role).toPromise();
        }
      });

      it('emits all joinable roles', async function () {
        const roles = await this.userRolesService.getAvailableMemberRoles(this.member).toPromise();
        expect(roles.map(r => r.name)).to.deep.equal([
          "role-0", "role-1", "role-2", "role-3", "role-4", "role-5",
        ]);
      });

      context('when the user has joined some roles', function () {
        beforeEach(function () {
          this.joinedRoles = [
            this.roles[3],
            this.roles[4],
            this.roles[5],
          ];

          this.joinedRoles.forEach(role => this.member.roles.set(role.id, role));
        });

        it('emits the roles the user has not joined', async function () {
          const roles = await this.userRolesService.getAvailableMemberRoles(this.member).toPromise();
          expect(roles.map(r => r.name)).to.deep.equal([
            "role-0", "role-1", "role-2",
          ]);
        });
      });
    });
  });
});
