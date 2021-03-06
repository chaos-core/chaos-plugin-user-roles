const {SnowflakeUtil} = require('discord.js');
const {range} = require('range');
const {MockMessage} = require("chaos-core").test.discordMocks;

const createChaosBot = require('../../test/create-chaos-bot');

describe('Command: RolesCommand', function () {
  beforeEach(async function () {
    this.chaos = createChaosBot();
    this.message = new MockMessage();
    await this.chaos.listen();
    await this.chaos.getService('core', 'PluginService')
      .enablePlugin(this.message.guild.id, 'UserRoles');
  });

  describe('!roles', function () {
    beforeEach(function () {
      this.role = {
        id: SnowflakeUtil.generate(),
        name: "test",
        guild: this.message.guild,
      };
      this.message.guild.roles.set(this.role.id, this.role);
      this.message.content = '!roles';
    });

    context('when no roles are joinable', function () {
      it('sends an error message', async function () {
        sinon.spy(this.message.channel, 'send');
        await this.chaos.testMessage(this.message);
        expect(this.message.channel.send).to.have.been.calledWith(
          "No roles to join were found.",
        );
      });
    });

    context('when there are joinable roles', function () {
      beforeEach(async function () {
        const UserRolesService = this.chaos.getService('UserRoles', 'UserRolesService');

        this.roles = range(0, 6)
          .map(roleNum => ({
            id: SnowflakeUtil.generate(),
            name: `role-${roleNum}`,
            guild: this.message.guild,
          }));

        for (const role of this.roles) {
          this.message.guild.roles.set(role.id, role);
          await UserRolesService.allowRole(role);
        }
      });

      it('lists all the roles that the user can join', async function () {
        sinon.spy(this.message.channel, 'send');
        await this.chaos.testMessage(this.message);
        expect(this.message.channel.send).to.have.been.calledOnce;

        const [body, options] = this.message.channel.send.getCall(0).args;
        expect(body).to.eq("Here are the roles you can join:");
        expect(options).to.containSubset({
          embed: {
            fields: [
              {
                name: "Available:",
                value: "role-0, role-1, role-2, role-3, role-4, role-5",
              },
            ],
          },
        });
      });

      context('when the user has joined some roles', function () {
        beforeEach(function () {
          this.roles
            .slice(Math.max(this.roles.length - 3, 0))
            .map(role => this.message.member.roles.set(role.id, role));
        });

        it('lists the joined roles separately', async function () {
          sinon.spy(this.message.channel, 'send');
          await this.chaos.testMessage(this.message);
          expect(this.message.channel.send).to.have.been.calledOnce;

          const [body, options] = this.message.channel.send.getCall(0).args;
          expect(body).to.eq("Here are the roles you can join:");
          expect(options).to.containSubset({
            embed: {
              fields: [
                {
                  name: "Available:",
                  value: "role-0, role-1, role-2",
                },
                {
                  name: "Joined:",
                  value: "role-3, role-4, role-5",
                },
              ],
            },
          });
        });
      });

      context('when the user has joined all the roles', function () {
        beforeEach(function () {
          this.roles.forEach((role) => {
            this.message.member.roles.set(role.id, role);
          });
        });

        it('lists the joined roles separately', async function () {
          sinon.spy(this.message.channel, 'send');
          await this.chaos.testMessage(this.message);
          expect(this.message.channel.send).to.have.been.calledOnce;

          const [body, options] = this.message.channel.send.getCall(0).args;
          expect(body).to.eq("Here are the roles you can join:");
          expect(options).to.containSubset({
            embed: {
              fields: [
                {
                  name: "Available:",
                  value: "You've joined all the roles!",
                },
                {
                  name: "Joined:",
                  value: "role-0, role-1, role-2, role-3, role-4, role-5",
                },
              ],
            },
          });
        });
      });
    });
  });
});
