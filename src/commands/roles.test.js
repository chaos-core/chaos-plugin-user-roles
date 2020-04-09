const {SnowflakeUtil} = require('discord.js');
const {range} = require('range');

const createChaosBot = require('../../test/create-chaos-bot');

describe('Command: RolesCommand', function () {
  beforeEach(function () {
    this.chaos = createChaosBot();

    this.test$ = this.chaos.testCommand({
      pluginName: 'UserRoles',
      commandName: 'roles',
    });

    this.guild = this.test$.message.guild;
    this.member = this.test$.message.member;
    this.channel = this.test$.message.channel;
  });

  describe('!roles', function () {
    beforeEach(function () {
      this.role = {
        id: SnowflakeUtil.generate(),
        name: "test",
        guild: this.guild,
      };
      this.guild.roles.set(this.role.id, this.role);

      this.test$.args.role = this.role.name;
    });

    context('when no roles are joinable', function () {
      it('sends an error message', async function () {
        sinon.spy(this.channel, 'send');

        await this.test$.toPromise();
        expect(this.channel.send).to.have.been.calledWith(
          "No roles to join were found.",
        );
      });
    });

    context('when there are joinable roles', function () {
      beforeEach(async function () {
        this.roles = [];

        const UserRolesService = this.chaos.getService('UserRoles', 'UserRolesService');

        range(0, 6)
          .map(roleNum => {
            let role = {
              id: SnowflakeUtil.generate(),
              name: `role-${roleNum}`,
              guild: this.guild,
            };
            this.roles.push(role);
            this.guild.roles.set(role.id, role);
          });

        await Promise.all(
          this.roles.map(async (role) => UserRolesService.allowRole(role).toPromise()),
        );
      });

      it('lists all the roles that the user can join', async function () {
        sinon.spy(this.channel, 'send');

        await this.test$.toPromise();
        expect(this.channel.send).to.have.been.calledOnce;

        const [body, options] = this.channel.send.getCall(0).args;
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
            .map(role => this.member.roles.set(role.id, role));
        });

        it('lists the joined roles separately', async function () {
          sinon.spy(this.channel, 'send');

          await this.test$.toPromise();
          expect(this.channel.send).to.have.been.calledOnce;

          const [body, options] = this.channel.send.getCall(0).args;
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
            this.member.roles.set(role.id, role);
          });
        });

        it('lists the joined roles separately', async function () {
          sinon.spy(this.channel, 'send');

          await this.test$.toPromise();
          expect(this.channel.send).to.have.been.calledOnce;

          const [body, options] = this.channel.send.getCall(0).args;
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
