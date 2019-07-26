const {tap} = require('rxjs/operators');
const {SnowflakeUtil} = require('discord.js');

const createChaosBot = require('../../test/create-chaos-bot');

describe('JoinCommand', function () {
  beforeEach(function () {
    this.chaos = createChaosBot();
    this.test$ = this.chaos.testCommand({
      pluginName: 'joinableRoles',
      commandName: 'join',
    });

    this.guild = this.test$.message.guild;
  });

  describe('!join {role}', function () {
    beforeEach(function () {
      this.role = {
        id: SnowflakeUtil.generate(),
        name: "test",
        guild: this.guild,
      };
      this.guild.roles.set(this.role.id, this.role);

      this.test$.args.role = this.role.name;
    });

    context('when the role is joinable', function () {
      beforeEach(function (done) {
        const joinableRolesService = this.chaos.getService('joinableRoles', 'JoinRolesService');

        joinableRolesService.allowRole(this.role)
          .subscribe(() => done(), (error) => done(error));
      });

      it('adds the role to the user', function (done) {
        sinon.spy(this.test$.message.member, 'addRole');

        this.test$.pipe(
          tap(() => {
            expect(this.test$.message.member.addRole).to.have.been.calledWith(this.role);
          }),
        ).subscribe(() => done(), error => done(error));
      });

      it('sends a success message', function (done) {
        sinon.spy(this.test$.message.channel, 'send');

        this.test$.pipe(
          tap(() => {
            expect(this.test$.message.channel.send).to.have.been.calledWith("You have been added to the role test.");
          }),
        ).subscribe(() => done(), error => done(error));
      });

      context('when the role can not be found', function () {
        beforeEach(function () {
          this.guild.roles.delete(this.role.id);
        });

        it('sends a error message', function (done) {
          sinon.spy(this.test$.message.channel, 'send');

          this.test$.pipe(
            tap(() => {
              expect(this.test$.message.channel.send).to.have.been.calledWith("The role 'test' could not be found");
            }),
          ).subscribe(() => done(), error => done(error));
        });
      });

      context('when the user has already joined the role', function () {
        beforeEach(function () {
          this.test$.message.member.roles.set(this.role.id, this.role);
        });

        it('sends a error message', function (done) {
          sinon.spy(this.test$.message.channel, 'send');

          this.test$.pipe(
            tap(() => {
              expect(this.test$.message.channel.send).to.have.been.calledWith("You have already joined test.");
            }),
          ).subscribe(() => done(), error => done(error));
        });
      });
    });

    context('when the role is not joinable', function () {
      it('does not add the role to the user', function (done) {
        sinon.spy(this.test$.message.member, 'addRole');

        this.test$.pipe(
          tap(() => {
            expect(this.test$.message.member.addRole).not.to.have.been.called;
          }),
        ).subscribe(() => done(), error => done(error));
      });

      it('sends a error message', function (done) {
        sinon.spy(this.test$.message.channel, 'send');

        this.test$.pipe(
          tap(() => {
            expect(this.test$.message.channel.send).to.have.been.calledWith("test can not be joined.");
          }),
        ).subscribe(() => done(), error => done(error));
      });
    });
  });
});
