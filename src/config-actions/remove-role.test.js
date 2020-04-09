const Discord = require('discord.js');
const {MockMessage} = require("chaos-core").test.discordMocks;

const createChaosBot = require('../../test/create-chaos-bot');

describe('Config: removeRole', function () {
  beforeEach(async function () {
    this.chaos = createChaosBot();
    this.message = new MockMessage();
    await this.chaos.listen().toPromise();
    await this.chaos.getService('core', 'PermissionsService')
      .addUser(this.message.guild, 'admin', this.message.author)
      .toPromise();
    await this.chaos.getService('core', 'PluginService')
      .enablePlugin(this.message.guild.id, 'UserRoles')
      .toPromise();
  });

  describe('!config userRoles removeRole', function () {
    beforeEach(function () {
      this.message.content = '!config userRoles removeRole';
    });

    it('gives a help message', async function () {
      const responses = await this.chaos.testMessage(this.message);
      expect(responses[0]).to.containSubset({
        content: "I'm sorry, but I'm missing some information for that command:",
      });
    });
  });

  describe('!config userRoles removeRole {role}', function () {
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
          this.message.content = `!config userRoles removeRole ${roleString}`;
        });

        context('when the role can not be found', function () {
          it('gives a user friendly error', async function () {
            const responses = await this.chaos.testMessage(this.message);
            expect(responses[0]).to.containSubset({
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
                guild: this.message.guild,
              };
              this.message.guild.roles.set(this.role.id, this.role);
            });

            context('when the role has been added', function () {
              beforeEach(async function () {
                await this.chaos.getService('UserRoles', 'UserRolesService')
                  .allowRole(this.role)
                  .toPromise();
              });

              it('gives a success message', async function () {
                const responses = await this.chaos.testMessage(this.message);
                expect(responses[0]).to.containSubset({
                  content: `Users can no longer join ${roleName}`,
                });
              });

              it('marks the role as not joinable', async function () {
                this.UserRolesService = this.chaos.getService('UserRoles', 'UserRolesService');
                sinon.spy(this.UserRolesService, 'removeRole');

                await this.chaos.testMessage(this.message);
                expect(this.UserRolesService.removeRole).to.have.been.calledWith(this.role);
              });
            });

            context('when the role has not been added', function () {
              it('gives a user friendly message', async function () {
                const responses = await this.chaos.testMessage(this.message);
                expect(responses[0]).to.containSubset({
                  content: `Users could not join ${roleName}.`,
                });
              });
            });
          });
        });
      });
    });
  });
});
