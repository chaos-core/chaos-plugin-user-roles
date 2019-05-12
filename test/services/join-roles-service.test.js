const {of, from, EMPTY, zip, range, throwError} = require('rxjs');
const {flatMap, tap, toArray, catchError, map, first, takeLast, mapTo} = require('rxjs/operators');
const {Collection, SnowflakeUtil} = require('discord.js');

const createChaosBot = require('../support/create-chaos-bot');
const DataKeys = require("../../lib/data-keys");
const {LeaveRoleError, JoinRoleError, NonJoinableRoleError, NoJoinableRolesError} = require("../../lib/errors");

describe('JoinableRolesService', function () {
  beforeEach(function () {
    this.chaos = createChaosBot();
    this.joinRolesService = this.chaos.getService('joinableRoles', 'JoinRolesService');

    this.guild = {
      id: SnowflakeUtil.generate(),
      roles: new Collection(),
    };

    this.role = {
      id: SnowflakeUtil.generate(),
      name: 'test',
      guild: this.guild,
    };
  });

  describe('#allowRole', function () {
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

  describe('#removeRole', function () {
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

  describe('#addUserToRole', function () {
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
            expect(error.message).to.equal("test can not be joined.");
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
              expect(error.message).to.equal('You have already joined test.');
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

  describe('#removeUserFromRole', function () {
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
            expect(error.message).to.equal("test can not be joined.");
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
              expect(error.message).to.equal('You have not joined test.');
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

  describe('#isRoleAllowed', function () {
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

  describe('#getAllowedRoles', function () {
    context('when there are no joinable roles', function () {
      it('throws a NoJoinableRolesError', function (done) {
        this.joinRolesService.getAllowedRoles(this.guild).pipe(
          catchError((error) => {
            expect(error).to.be.an.instanceOf(NoJoinableRolesError);
            expect(error.message).to.be.equal("No joinable roles were found.");
            return EMPTY;
          }),
          flatMap(() => throwError(new Error("Expected an error to be thrown"))),
          toArray(),
        ).subscribe(() => done(), error => done(error));
      });
    });

    context('when there are joinable roles', function () {
      beforeEach(function (done) {
        this.joinableRoles = [
          'joinable-1',
          'joinable-2',
          'joinable-3',
        ].map(name => ({
          id: SnowflakeUtil.generate(),
          name,
          guild: this.guild,
        }));

        this.nonJoinableRoles = [
          'non-joinable-1',
          'non-joinable-2',
          'non-joinable-3',
        ].map(name => ({
          id: SnowflakeUtil.generate(),
          name,
          guild: this.guild,
        }));

        zip(
          from(this.joinableRoles).pipe(
            tap(role => this.guild.roles.set(role.id, role)),
            flatMap(role => this.joinRolesService.allowRole(role)),
            toArray(),
          ),
          from(this.nonJoinableRoles).pipe(
            tap(role => this.guild.roles.set(role.id, role)),
            toArray(),
          ),
        ).subscribe(() => done(), error => done(error));
      });

      it('emits all joinable roles', function (done) {
        this.joinRolesService.getAllowedRoles(this.guild).pipe(
          first(),
          tap(roles => {
            expect(roles.map(r => r.name)).to.deep.equal(
              this.joinableRoles.map(r => r.name),
            );
          }),
        ).subscribe(() => done(), error => done(error));
      });
    });
  });

  describe('#getJoinedMemberRoles', function () {
    beforeEach(function () {
      this.member = {
        guild: this.guild,
        roles: new Collection(),
      };
    });

    context('when there are no joinable roles', function () {
      it('throws a NoJoinableRolesError', function (done) {
        this.joinRolesService.getJoinedMemberRoles(this.member).pipe(
          catchError((error) => {
            expect(error).to.be.an.instanceOf(NoJoinableRolesError);
            expect(error.message).to.be.equal("No joinable roles were found.");
            return EMPTY;
          }),
          flatMap(() => throwError(new Error("Expected an error to be thrown"))),
          toArray(),
        ).subscribe(() => done(), error => done(error));
      });
    });

    context('when there are joinable roles', function () {
      beforeEach(function (done) {
        range(0, 6).pipe(
          map(roleNum => ({
            id: SnowflakeUtil.generate(),
            name: `role-${roleNum}`,
            guild: this.guild,
          })),
          tap(role => this.guild.roles.set(role.id, role)),
          flatMap(role => this.joinRolesService.allowRole(role).pipe(
            mapTo(role),
          )),
          toArray(),
          tap(roles => this.roles = roles),
        ).subscribe(() => done(), error => done(error));
      });

      context('when the user has not joined any roles', function () {
        it('emits an empty array', function (done) {
          this.joinRolesService.getJoinedMemberRoles(this.member).pipe(
            first(),
            tap((emitted) => {
              expect(emitted).to.deep.equal([]);
            }),
          ).subscribe(() => done(), error => done(error));
        });
      });

      context('when the user has joined some roles', function () {
        beforeEach(function (done) {
          from(this.roles).pipe(
            takeLast(3),
            tap(role => this.member.roles.set(role.id, role)),
            toArray(),
            tap(roles => this.joinedRoles = roles),
          ).subscribe(() => done(), error => done(error));
        });

        it('emits the roles the user has joined', function (done) {
          this.joinRolesService.getJoinedMemberRoles(this.member).pipe(
            first(),
            tap((roles) => {
              expect(roles.map(r => r.name)).to.deep.equal(
                this.joinedRoles.map(r => r.name),
              );
            }),
          ).subscribe(() => done(), error => done(error));
        });
      });
    });
  });

  describe('#getAvailableMemberRoles', function () {
    beforeEach(function () {
      this.member = {
        guild: this.guild,
        roles: new Collection(),
      };
    });

    context('when there are no joinable roles', function () {
      it('throws a NoJoinableRolesError', function (done) {
        this.joinRolesService.getAvailableMemberRoles(this.member).pipe(
          catchError((error) => {
            expect(error).to.be.an.instanceOf(NoJoinableRolesError);
            expect(error.message).to.be.equal("No joinable roles were found.");
            return EMPTY;
          }),
          flatMap(() => throwError(new Error("Expected an error to be thrown"))),
          toArray(),
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

      it('emits all joinable roles', function (done) {
        this.joinRolesService.getAvailableMemberRoles(this.member).pipe(
          first(),
          tap((emitted) => {
            expect(emitted.map(r => r.name)).to.deep.equal([
              "role-0", "role-1", "role-2", "role-3", "role-4", "role-5",
            ]);
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

        it('emits the roles the user has not joined', function (done) {
          this.joinRolesService.getAvailableMemberRoles(this.member).pipe(
            first(),
            tap((emitted) => {
              expect(emitted.map(r => r.name)).to.deep.equal([
                "role-0", "role-1", "role-2",
              ]);
            }),
          ).subscribe(() => done(), error => done(error));
        });
      });
    });
  });
});
