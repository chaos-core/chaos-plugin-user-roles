const Discord = require('discord.js');

const createChaosBot = require('../../test/create-chaos-bot');

describe('Config: RemoveRoleAction', function () {
  beforeEach(function () {
    this.chaos = createChaosBot();
    this.test$ = this.chaos.testConfigAction({
      pluginName: 'userRoles',
      actionName: 'removeRole',
    });
  });

  context('when a role is not given', function () {
    it('gives a help message', async function () {
      const response = await this.test$.toPromise();
      expect(response).to.containSubset({
        content: "I'm sorry, but I'm missing some information for that command:",
      });
    });
  });

  const roleId = Discord.SnowflakeUtil.generate();
  const roleName = 'testRole';

  Object.entries({
    "as a mention": `<@${roleId}>`,
    "as an alt mention": `<@&${roleId}>`,
    "by name": roleName,
    "by id": roleId,
  }).forEach(([type, roleString]) => {
    context(`when a role is given ${type}`, function () {
      beforeEach(function () {
        this.test$.args.role = roleString;
      });

      context('when the role can not be found', function () {
        it('gives a user friendly error', async function () {
          const response = await this.test$.toPromise();
          expect(response).to.containSubset({
            status: 400,
            content: `The role '${roleString}' could not be found`,
          });
        });
      });

      context('when the role exists', function () {
        context(type, function () {
          beforeEach(function () {
            this.role = {
              id: roleId,
              name: roleName,
              guild: this.test$.message.guild,
            };
            this.test$.message.guild.roles.set(this.role.id, this.role);
          });

          context('when the role has been added', function () {
            beforeEach(async function () {
              await this.chaos.getService('UserRoles', 'UserRolesService')
                .allowRole(this.role)
                .toPromise();
            });

            it('gives a success message', async function () {
              const response = await this.test$.toPromise();
              expect(response).to.containSubset({
                status: 200,
                content: `Users can no longer join ${roleName}`,
              });
            });

            it('marks the role as not joinable', async function () {
              this.UserRolesService = this.chaos.getService('UserRoles', 'UserRolesService');
              sinon.spy(this.UserRolesService, 'removeRole');

              await this.test$.toPromise();
              expect(this.UserRolesService.removeRole).to.have.been.calledWith(this.role);
            });
          });

          context('when the role has not been added', function () {
            it('gives a user friendly message', async function () {
              const response = await this.test$.toPromise();
              expect(response).to.containSubset({
                status: 400,
                content: `Users could not join ${roleName}.`,
              });
            });
          });
        });
      });
    });
  });
});
