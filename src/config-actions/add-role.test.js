const Discord = require('discord.js');
const {MockMessage} = require("chaos-core").test.discordMocks;

const createChaosBot = require('../../test/create-chaos-bot');

describe('Config: addRole', function () {
  beforeEach(async function () {
    this.chaos = createChaosBot();
    this.message = new MockMessage();
    await this.chaos.listen();
    await this.chaos.getService('core', 'PermissionsService')
      .addUser(this.message.guild, 'admin', this.message.author);
    await this.chaos.getService('core', 'PluginService')
      .enablePlugin(this.message.guild.id, 'UserRoles');
  });

  describe('!config userRoles addRole', function () {
    beforeEach(function () {
      this.message.content = '!config userRoles addRole';
    });

    it('gives a help message', async function () {
      const responses = await this.chaos.testMessage(this.message);
      expect(responses[0]).to.containSubset({
        content: "I'm sorry, but I'm missing some information for that command:",
      });
    });
  });

  describe('!config userRoles addRole {role}', function () {
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
          this.message.content = `!config userRoles addRole ${roleString}`;
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

            context('when the role has not been added', function () {
              it('gives a success message', async function () {
                const responses = await this.chaos.testMessage(this.message);
                expect(responses[0]).to.containSubset({
                  content: `Users can now join ${roleName}`,
                });
              });

              it('marks the role as joinable', async function () {
                const UserRolesService = this.chaos.getService('UserRoles', 'UserRolesService');
                sinon.spy(UserRolesService, 'allowRole');

                await this.chaos.testMessage(this.message);
                expect(UserRolesService.allowRole).to.have.been.calledWith(this.role);
              });
            });

            context('when the role has already been added', function () {
              beforeEach(async function () {
                await this.chaos.getService('UserRoles', 'UserRolesService')
                  .allowRole(this.role);
              });

              it('gives a user friendly message', async function () {
                const responses = await this.chaos.testMessage(this.message);
                expect(responses[0]).to.containSubset({
                  content: `Users can already join ${roleName}.`,
                });
              });
            });
          });
        });
      });
    });
  });
});
