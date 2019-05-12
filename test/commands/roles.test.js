const {range, from} = require('rxjs');
const {flatMap, tap, toArray, map, mapTo, takeLast, filter} = require('rxjs/operators');
const {CommandContext, Response} = require('chaos-core');
const {Collection, SnowflakeUtil} = require('discord.js');

const createChaosBot = require('../support/create-chaos-bot');

describe('RolesCommand', function () {
  beforeEach(function () {
    this.chaos = createChaosBot();
    this.command = this.chaos.getCommand('roles');
    this.command.onListen();

    this.joinRolesService = this.chaos.getService('joinableRoles', 'JoinRolesService');

    this.guild = {
      id: SnowflakeUtil.generate(),
      roles: new Collection(),
    };

    this.member = {
      id: SnowflakeUtil.generate(),
      guild: this.guild,
      roles: new Collection(),
    };

    this.channel = {
      id: SnowflakeUtil.generate(),
      guild: this.guild,
      send: message => Promise.resolve({
        id: SnowflakeUtil.generate(),
        content: message,
      }),
    };

    this.message = {
      id: SnowflakeUtil.generate(),
      guild: this.guild,
      member: this.member,
      channel: this.channel,
    };

    this.context = new CommandContext(
      this.message,
      this.command,
    );

    this.response = new Response(
      this.message,
    );
  });

  describe('!roles', function () {
    beforeEach(function () {
      this.role = {
        id: SnowflakeUtil.generate(),
        name: "test",
        guild: this.guild,
      };
      this.guild.roles.set(this.role.id, this.role);

      this.context.args.role = this.role.name;
    });

    context('when no roles are joinable', function () {
      it('sends an error message', function (done) {
        sinon.spy(this.response, 'send');

        this.command.run(this.context, this.response).pipe(
          toArray(),
          tap(() => {
            expect(this.response.send).to.have.been.calledWith({
              content: "No roles to join were found",
            });
          }),
        ).subscribe(() => done(), error => done(error));
      });
    });

    context('when there are joinable roles', function () {
      beforeEach(function (done) {
        this.roles = [];

        range(0, 6).pipe(
          map(roleNum => ({
            id: SnowflakeUtil.generate(),
            name: `role-${roleNum}`,
            guild: this.guild,
          })),
          tap(role => this.roles.push(role)),
          tap(role => this.guild.roles.set(role.id, role)),
          flatMap(role => this.joinRolesService.allowRole(role)),
          toArray(),
        ).subscribe(() => done(), error => done(error));
      });

      it('lists all the roles that the user can join', function (done) {
        sinon.spy(this.response, 'send');

        this.command.run(this.context, this.response).pipe(
          toArray(),
          tap(() => expect(this.response.send).to.have.been.calledOnce),
          tap(() => {
            const [response] = this.response.send.getCall(0).args;
            expect(response).to.containSubset({
              content: "Here are the roles you can join:",
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
          sinon.spy(this.response, 'send');

          this.command.run(this.context, this.response).pipe(
            tap(() => expect(this.response.send).to.have.been.calledOnce),
            tap(() => {
              const [response] = this.response.send.getCall(0).args;
              expect(response).to.containSubset({
                content: "Here are the roles you can join:",
                embed: {
                  fields: [
                    {
                      "name": "Available:",
                      "value": "`role-0`, `role-1`, `role-2`",
                    },
                    {
                      "name": "Joined:",
                      "value": "`role-3`, `role-4`, `role-5`",
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
          sinon.spy(this.response, 'send');

          this.command.run(this.context, this.response).pipe(
            tap(() => expect(this.response.send).to.have.been.calledOnce),
            tap(() => {
              const [response] = this.response.send.getCall(0).args;
              expect(response).to.containSubset({
                content: "Here are the roles you can join:",
                embed: {
                  fields: [
                    {
                      "name": "Available:",
                      "value": "You've joined all the roles!",
                    },
                    {
                      "name": "Joined:",
                      "value": "`role-0`, `role-1`, `role-2`, `role-3`, `role-4`, `role-5`",
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
