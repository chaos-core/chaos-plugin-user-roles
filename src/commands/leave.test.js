const {tap} = require('rxjs/operators');
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
      beforeEach(function (done) {
        const UserRolesService = this.chaos.getService('UserRoles', 'UserRolesService');

        UserRolesService.allowRole(this.role)
          .subscribe(() => done(), (error) => done(error));
      });

      it('removes the role from the user', function (done) {
        sinon.spy(this.member, 'removeRole');

        this.test$.pipe(
          tap(() => expect(this.member.removeRole).to.have.been.calledWith(this.role)),
        ).subscribe(() => done(), error => done(error));
      });

      it('sends a success message', function (done) {
        sinon.spy(this.channel, 'send');

        this.test$.pipe(
          tap(() => expect(this.channel.send).to.have.been.calledWith(
            "You have been removed from the role test.",
          )),
        ).subscribe(() => done(), error => done(error));
      });

      context('when the role can not be found', function () {
        beforeEach(function () {
          this.guild.roles.delete(this.role.id);
        });

        it('sends a error message', function (done) {
          sinon.spy(this.channel, 'send');

          this.test$.pipe(
            tap(() => expect(this.channel.send).to.have.been.calledWith(
              "The role 'test' could not be found",
            )),
          ).subscribe(() => done(), error => done(error));
        });
      });

      context('when the user had not joined the role', function () {
        beforeEach(function () {
          this.member.roles.delete(this.role.id);
        });

        it('sends a error message', function (done) {
          sinon.spy(this.channel, 'send');

          this.test$.pipe(
            tap(() => expect(this.channel.send).to.have.been.calledWith(
              "You have not joined test.",
            )),
          ).subscribe(() => done(), error => done(error));
        });
      });
    });

    context('when the role is not joinable', function () {
      it('does not add the role to the user', function (done) {
        sinon.spy(this.member, 'addRole');

        this.test$.pipe(
          tap(() => expect(this.member.addRole).not.to.have.been.called),
        ).subscribe(() => done(), error => done(error));
      });

      it('sends a error message', function (done) {
        sinon.spy(this.channel, 'send');

        this.test$.pipe(
          tap(() => expect(this.channel.send).to.have.been.calledWith(
            "test can not be joined.",
          )),
        ).subscribe(() => done(), error => done(error));
      });
    });
  });
});
