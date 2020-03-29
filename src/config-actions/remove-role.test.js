const Discord = require('discord.js');
const {tap} = require('rxjs/operators');

const createChaosBot = require('../../test/create-chaos-bot');

describe('Config: RemoveRoleAction', function () {
  beforeEach(function () {
    this.chaos = createChaosBot();
    this.test$ = this.chaos.testConfigAction({
      pluginName: 'userRoles',
      actionName: 'removeRole',
    });
  });

  context('when a role is not given', function () {
    it('gives a help message', function (done) {
      this.test$.pipe(
        tap((response) => expect(response).to.containSubset({
          content: "I'm sorry, but I'm missing some information for that command:",
        })),
      ).subscribe(() => done(), (error) => done(error));
    });
  });

  const roleId = Discord.SnowflakeUtil.generate();
  const roleName = 'testRole';

  Object.entries({
    "as a mention": `<@${roleId}>`,
    "as an alt mention": `<@&${roleId}>`,
    "by name": roleName,
    "by id": roleId,
  }).forEach(([type, roleString]) => {
    context(`when a role is given ${type}`, function () {
      beforeEach(function () {
        this.test$.args.role = roleString;
      });

      context('when the role can not be found', function () {
        it('gives a user friendly error', function (done) {
          this.test$.pipe(
            tap((response) => expect(response).to.containSubset({
              status: 400,
              content: `The role '${roleString}' could not be found`,
            })),
          ).subscribe(() => done(), (error) => done(error));
        });
      });

      context('when the role exists', function () {
        context(type, function () {
          beforeEach(function () {
            this.role = {
              id: roleId,
              name: roleName,
              guild: this.test$.message.guild,
            };
            this.test$.message.guild.roles.set(this.role.id, this.role);
          });

          context('when the role has been added', function () {
            beforeEach(function (done) {
              const UserRolesService = this.chaos.getService('UserRoles', 'UserRolesService');
              UserRolesService.allowRole(this.role)
                .subscribe(() => done(), (error) => done(error));
            });

            it('gives a success message', function (done) {
              this.test$.pipe(
                tap((response) => expect(response).to.containSubset({
                  status: 200,
                  content: `Users can no longer join ${roleName}`,
                })),
              ).subscribe(() => done(), (error) => done(error));
            });

            it('marks the role as not joinable', function (done) {
              this.UserRolesService = this.chaos.getService('UserRoles', 'UserRolesService');
              sinon.spy(this.UserRolesService, 'removeRole');

              this.test$.pipe(
                tap(() => expect(this.UserRolesService.removeRole).to.have.been.calledWith(this.role)),
              ).subscribe(() => done(), (error) => done(error));
            });
          });

          context('when the role has not been added', function () {
            it('gives a user friendly message', function (done) {
              this.test$.pipe(
                tap((response) => expect(response).to.containSubset({
                  status: 400,
                  content: `Users could not join ${roleName}.`,
                })),
              ).subscribe(() => done(), (error) => done(error));
            });
          });
        });
      });
    });
  });
});