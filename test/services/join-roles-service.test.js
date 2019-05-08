const {EMPTY} = require('rxjs');
const {flatMap, tap, toArray, catchError} = require('rxjs/operators');
const {Collection, SnowflakeUtil} = require('discord.js');

const createChaosBot = require('../support/create-chaos-bot');
const DataKeys = require("../../lib/data-keys");
const JoinRolesService = require('../../lib/services/join-roles-service');

describe('JoinableRolesService', function () {
  beforeEach(function () {
    this.chaos = createChaosBot();
    this.joinRolesService = new JoinRolesService(this.chaos);

    this.guild = {
      id: SnowflakeUtil.generate(),
    };

    this.role = {
      id: SnowflakeUtil.generate(),
      guild: this.guild,
    };
  });

  context('#allowRole', function () {
    it('marks the role as joinable', function (done) {
      this.joinRolesService.allowRole(this.role).pipe(
        toArray(),
        flatMap(() => this.chaos.getGuildData(this.guild.id, DataKeys.ALLOWED_ROLE_IDS)),
        tap((allowedIds) => {
          expect(allowedIds[this.role.id]).to.be.true;
        }),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  context('#removeRole', function () {
    it('marks the role as not joinable', function (done) {
      this.joinRolesService.removeRole(this.role).pipe(
        toArray(),
        flatMap(() => this.chaos.getGuildData(this.guild.id, DataKeys.ALLOWED_ROLE_IDS)),
        tap((allowedIds) => {
          expect(allowedIds[this.role.id]).to.be.false;
        }),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  context('#isRoleAllowed', function () {
    context('when the role is allowed in the server', function () {
      beforeEach(function (done) {
        this.joinRolesService.allowRole(this.role)
          .subscribe(() => done(), error => done(error));
      });

      it('emits true', function (done) {
        this.joinRolesService.isRoleAllowed(this.role).pipe(
          toArray(),
          tap((emitted) => {
            expect(emitted).to.deep.equal([true]);
          }),
        ).subscribe(() => done(), (error) => done(error));
      });
    });

    context('when the role is not allowed in the server', function () {
      it('emits false', function (done) {
        this.joinRolesService.isRoleAllowed(this.role).pipe(
          toArray(),
          tap((emitted) => {
            expect(emitted).to.deep.equal([false]);
          }),
        ).subscribe(() => done(), (error) => done(error));
      });
    });
  });
});
