const {range, from} = require('rxjs');
const {flatMap, tap, toArray, map, takeLast} = require('rxjs/operators');
const {SnowflakeUtil} = require('discord.js');

const createChaosBot = require('../../test/create-chaos-bot');

describe('RolesCommand', function () {
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
      it('sends an error message', function (done) {
        sinon.spy(this.channel, 'send');

        this.test$.pipe(
          tap(() => expect(this.channel.send).to.have.been.calledWith(
            "No roles to join were found",
          )),
        ).subscribe(() => done(), error => done(error));
      });
    });

    context('when there are joinable roles', function () {
      beforeEach(function (done) {
        this.roles = [];

        const UserRolesService = this.chaos.getService('UserRoles', 'UserRolesService');

        range(0, 6).pipe(
          map(roleNum => ({
            id: SnowflakeUtil.generate(),
            name: `role-${roleNum}`,
            guild: this.guild,
          })),
          tap(role => this.roles.push(role)),
          tap(role => this.guild.roles.set(role.id, role)),
          flatMap(role => UserRolesService.allowRole(role)),
          toArray(),
        ).subscribe(() => done(), error => done(error));
      });

      it('lists all the roles that the user can join', function (done) {
        sinon.spy(this.channel, 'send');

        this.test$.pipe(
          tap(() => expect(this.channel.send).to.have.been.calledOnce),
          map(() => this.channel.send.getCall(0).args),
          tap(([body, options]) => {
            expect(body).to.eq("Here are the roles you can join:");
            expect(options).to.containSubset({
              embed: {
                fields: [
                  {
                    name: "Available:",
                    value: "`role-0`, `role-1`, `role-2`, `role-3`, `role-4`, `role-5`",
                  },
                ],
              },
            });
          }),
        ).subscribe(() => done(), error => done(error));
      });

      context('when the user has joined some roles', function () {
        beforeEach(function (done) {
          from(this.roles).pipe(
            takeLast(3),
            tap(role => this.member.roles.set(role.id, role)),
            toArray(),
          ).subscribe(() => done(), error => done(error));
        });

        it('lists the joined roles separately', function (done) {
          sinon.spy(this.channel, 'send');

          this.test$.pipe(
            tap(() => expect(this.channel.send).to.have.been.calledOnce),
            map(() => this.channel.send.getCall(0).args),
            tap(([body, options]) => {
              expect(body).to.eq("Here are the roles you can join:");
              expect(options).to.containSubset({
                embed: {
                  fields: [
                    {
                      name: "Available:",
                      value: "`role-0`, `role-1`, `role-2`",
                    },
                    {
                      name: "Joined:",
                      value: "`role-3`, `role-4`, `role-5`",
                    },
                  ],
                },
              });
            }),
          ).subscribe(() => done(), error => done(error));
        });
      });

      context('when the user has joined all the roles', function () {
        beforeEach(function (done) {
          from(this.roles).pipe(
            tap(role => this.member.roles.set(role.id, role)),
            toArray(),
          ).subscribe(() => done(), error => done(error));
        });

        it('lists the joined roles separately', function (done) {
          sinon.spy(this.channel, 'send');

          this.test$.pipe(
            tap(() => expect(this.channel.send).to.have.been.calledOnce),
            map(() => this.channel.send.getCall(0).args),
            tap(([body, options]) => {
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
                      value: "`role-0`, `role-1`, `role-2`, `role-3`, `role-4`, `role-5`",
                    },
                  ],
                },
              });
            }),
          ).subscribe(() => done(), error => done(error));
        });
      });
    });
  });
});
