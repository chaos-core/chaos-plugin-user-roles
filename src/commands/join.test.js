const {SnowflakeUtil} = require('discord.js');
const {MockMessage} = require("chaos-core").test.discordMocks;

const createChaosBot = require('../../test/create-chaos-bot');

describe('Command: JoinCommand', function () {
  beforeEach(async function () {
    this.chaos = createChaosBot();
    this.message = new MockMessage();
    await this.chaos.listen().toPromise();
    await this.chaos.getService('core', 'PluginService')
      .enablePlugin(this.message.guild.id, 'UserRoles')
      .toPromise();
  });

  describe('!join {role}', function () {
    beforeEach(function () {
      this.role = {
        id: SnowflakeUtil.generate(),
        name: "test",
        guild: this.message.guild,
      };
      this.message.guild.roles.set(this.role.id, this.role);
      this.message.content = '!join test';
    });

    context('when the role is joinable', function () {
      beforeEach(async function () {
        await this.chaos.getService('UserRoles', 'UserRolesService')
          .allowRole(this.role)
          .toPromise();
      });

      it('adds the role to the user', async function () {
        sinon.spy(this.message.member, 'addRole');

        await this.chaos.testMessage(this.message);
        expect(this.message.member.addRole).to.have.been.calledWith(this.role);
      });

      it('sends a success message', async function () {
        sinon.spy(this.message.channel, 'send');

        await this.chaos.testMessage(this.message);
        expect(this.message.channel.send).to.have.been.calledWith("You have been added to the role test.");
      });

      context('when the role can not be found', function () {
        beforeEach(function () {
          this.message.guild.roles.delete(this.role.id);
        });

        it('sends a error message', async function () {
          sinon.spy(this.message.channel, 'send');

          await this.chaos.testMessage(this.message);
          expect(this.message.channel.send).to.have.been.calledWith("The role 'test' could not be found");
        });
      });

      context('when the user has already joined the role', function () {
        beforeEach(function () {
          this.message.member.roles.set(this.role.id, this.role);
        });

        it('sends a error message', async function () {
          sinon.spy(this.message.channel, 'send');

          await this.chaos.testMessage(this.message);
          expect(this.message.channel.send).to.have.been.calledWith("You have already joined test.");
        });
      });
    });

    context('when the role is not joinable', function () {
      it('does not add the role to the user', async function () {
        sinon.spy(this.message.member, 'addRole');

        await this.chaos.testMessage(this.message);
        expect(this.message.member.addRole).not.to.have.been.called;
      });

      it('sends a error message', async function () {
        sinon.spy(this.message.channel, 'send');

        await this.chaos.testMessage(this.message);
        expect(this.message.channel.send).to.have.been.calledWith("test can not be joined.");
      });
    });
  });
});
