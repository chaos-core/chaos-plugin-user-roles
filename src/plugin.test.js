const ChaosCore = require('chaos-core');

describe('Plugin: UserRoles', function () {
  context('when added to a ChaosBot', function () {
    beforeEach(function () {
      this.chaos = ChaosCore.test.createChaosStub({
        plugins: [
          require('../src/plugin'),
        ],
      });
    });

    afterEach(async function () {
      if (this.chaos.listening) {
        await this.chaos.shutdown().toPromise();
      }
    });

    it('Allows the bot to load', async function () {
      await this.chaos.listen().toPromise();
    });

    it('Adds the plugin to the bot', function () {
      expect(this.chaos.pluginManager.plugins.map(c => c.name)).to.containSubset([
        "UserRoles",
      ]);
    });

    [
      "UserRolesService",
    ].forEach((service) => {
      it(`Adds service ${service} to the bot`, function () {
        expect(this.chaos.getService('UserRoles', service)).not.to.be.undefined;
      });
    });

    [
      "addRole",
      "removeRole",
    ].forEach((configAction) => {
      it(`Adds config action ${configAction} to the bot`, function () {
        expect(this.chaos.getConfigAction('UserRoles', configAction)).not.to.be.undefined;
      });
    });

    [
      "join",
      "leave",
      "roles",
    ].forEach((command) => {
      it(`Adds command ${command} to the bot`, function () {
        expect(this.chaos.getCommand(command)).not.to.be.undefined;
      });
    });
  });
});
