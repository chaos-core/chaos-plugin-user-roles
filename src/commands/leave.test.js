const {SnowflakeUtil} = require('discord.js');

const createChaosBot = require('../../test/create-chaos-bot');

describe('Command: LeaveCommand', function () {
  beforeEach(function () {
    this.chaos = createChaosBot();
    this.test$ = this.chaos.testCommand({
      pluginName: 'UserRoles',
      commandName: 'leave',
    });

    this.guild = this.test$.message.guild;
    this.member = this.test$.message.member;
    this.channel = this.test$.message.channel;
  });

  describe('!leave {role}', function () {
    beforeEach(function () {
      this.role = {
        id: SnowflakeUtil.generate(),
        name: "test",
        guild: this.guild,
      };
      this.guild.roles.set(this.role.id, this.role);
      this.member.roles.set(this.role.id, this.role);

      this.test$.args.role = this.role.name;
    });

    context('when the role is joinable', function () {
      beforeEach(async function () {
        await this.chaos.getService('UserRoles', 'UserRolesService')
          .allowRole(this.role)
          .toPromise();
      });

      it('removes the role from the user', async function () {
        sinon.spy(this.member, 'removeRole');

        await this.test$.toPromise();
        expect(this.member.removeRole).to.have.been.calledWith(this.role);
      });

      it('sends a success message', async function () {
        sinon.spy(this.channel, 'send');

        await this.test$.toPromise();
        expect(this.channel.send).to.have.been.calledWith(
          "You have been removed from the role test.",
        );
      });

      context('when the role can not be found', function () {
        beforeEach(function () {
          this.guild.roles.delete(this.role.id);
        });

        it('sends a error message', async function () {
          sinon.spy(this.channel, 'send');

          await this.test$.toPromise();
          expect(this.channel.send).to.have.been.calledWith(
            "The role 'test' could not be found",
          );
        });
      });

      context('when the user had not joined the role', function () {
        beforeEach(function () {
          this.member.roles.delete(this.role.id);
        });

        it('sends a error message', async function () {
          sinon.spy(this.channel, 'send');

          await this.test$.toPromise();
          expect(this.channel.send).to.have.been.calledWith(
            "You have not joined test.",
          );
        });
      });
    });

    context('when the role is not joinable', function () {
      it('does not add the role to the user', async function () {
        sinon.spy(this.member, 'addRole');

        await this.test$.toPromise();
        expect(this.member.addRole).not.to.have.been.called;
      });

      it('sends a error message', async function () {
        sinon.spy(this.channel, 'send');

        await this.test$.toPromise();
        expect(this.channel.send).to.have.been.calledWith(
          "test can not be joined.",
        );
      });
    });
  });
});
