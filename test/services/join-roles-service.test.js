const {of, EMPTY} = require('rxjs');
const {flatMap, tap, toArray, catchError} = require('rxjs/operators');
const {Collection, SnowflakeUtil} = require('discord.js');

const createChaosBot = require('../support/create-chaos-bot');
const DataKeys = require("../../lib/data-keys");
const JoinRolesService = require('../../lib/services/join-roles-service');
const {LeaveRoleError, JoinRoleError, NonJoinableRoleError} = require("../../lib/errors");

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

  context('#addUserToRole', function () {
    beforeEach(function () {
      this.member = {
        guild: this.guild,
        roles: new Collection(),
        addRole: function (role) {
          this.roles.set(role.id, role);
          return Promise.resolve(this);
        },
      };
    });

    context('when the role is not joinable', function () {
      it('throws a JoinableRoleError', function (done) {
        this.joinRolesService.addUserToRole(this.member, this.role).pipe(
          toArray(),
          catchError((error) => {
            expect(error).to.an.instanceOf(NonJoinableRoleError);
            expect(error.message).to.equal("Role can't be joined");
            return EMPTY;
          }),
        ).subscribe(
          () => done(new Error("Expected an error to be thrown")),
          error => done(error),
          () => done(),
        );
      });

      it('does not add the role to the user', function (done) {
        sinon.spy(this.member, 'addRole');

        this.joinRolesService.addUserToRole(this.member, this.role).pipe(
          toArray(),
          catchError(() => of('')), //silence expected error
          tap(() => expect(this.member.addRole).not.to.have.been.called),
        ).subscribe(() => done(), error => done(error));
      });
    });

    context('when the role is joinable', function () {
      beforeEach(function (done) {
        this.joinRolesService.allowRole(this.role)
          .subscribe(() => done(), error => done(error));
      });

      it('adds the role to the user', function (done) {
        sinon.spy(this.member, 'addRole');

        this.joinRolesService.addUserToRole(this.member, this.role).pipe(
          toArray(),
          tap(() => expect(this.member.addRole).to.have.been.calledWith(this.role)),
        ).subscribe(() => done(), error => done(error));
      });

      context('when the user already has the role', function () {
        beforeEach(function (done) {
          this.member.addRole(this.role)
            .then(() => done())
            .catch(error => done(error));
        });

        it('throws a JoinableRoleError', function (done) {
          this.joinRolesService.addUserToRole(this.member, this.role).pipe(
            toArray(),
            catchError((error) => {
              expect(error).to.be.an.instanceOf(JoinRoleError);
              expect(error.message).to.equal('User already has role');
              return EMPTY;
            }),
          ).subscribe(
            () => done(new Error("Expected an error to be thrown")),
            error => done(error),
            () => done(),
          );
        });

        it('does not add the role to the user', function (done) {
          sinon.spy(this.member, 'addRole');

          this.joinRolesService.addUserToRole(this.member, this.role).pipe(
            toArray(),
            catchError(() => of('')), //silence expected error
            tap(() => expect(this.member.addRole).not.to.have.been.called),
          ).subscribe(() => done(), error => done(error));
        });
      });
    });
  });

  context('#removeUserFromRole', function () {
    beforeEach(function () {
      this.member = {
        id: SnowflakeUtil.generate(),
        roles: new Collection(),
        guild: this.guild,
        removeRole: function (role) {
          this.roles.delete(role.id);
          return Promise.resolve(this);
        },
      };

      this.member.roles.set(this.role.id, this.role);
    });

    context('when the role is not joinable', function () {
      it('throws a JoinableRoleError', function (done) {
        this.joinRolesService.removeUserFromRole(this.member, this.role).pipe(
          toArray(),
          catchError((error) => {
            expect(error).to.be.an.instanceOf(NonJoinableRoleError);
            expect(error.message).to.equal("Role can't be joined");
            return EMPTY;
          }),
        ).subscribe(
          () => done(new Error("Expected an error to be thrown")),
          error => done(error),
          () => done(),
        );
      });
    });

    context('when the role is joinable', function () {
      beforeEach(function (done) {
        this.joinRolesService.allowRole(this.role)
          .subscribe(() => done(), error => done(error));
      });

      it('removes the role from the user', function (done) {
        sinon.spy(this.member, 'removeRole');

        this.joinRolesService.removeUserFromRole(this.member, this.role).pipe(
          toArray(),
          tap(() => expect(this.member.removeRole).to.have.been.calledWith(this.role)),
        ).subscribe(() => done(), error => done(error));
      });

      context('when the user does not have the role', function () {
        beforeEach(function () {
          this.member.roles.delete(this.role.id);
        });

        it('throws a JoinableRoleError', function (done) {
          this.joinRolesService.removeUserFromRole(this.member, this.role).pipe(
            toArray(),
            catchError((error) => {
              expect(error).to.be.an.instanceOf(LeaveRoleError);
              expect(error.message).to.equal('User is not in the role');
              return EMPTY;
            }),
          ).subscribe(
            () => done(new Error("Expected an error to be thrown")),
            error => done(error),
            () => done(),
          );
        });
      });
    });
  });

  context('#isRoleAllowed', function () {
    context('when the role is joinable in the server', function () {
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

    context('when the role is not joinable in the server', function () {
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
