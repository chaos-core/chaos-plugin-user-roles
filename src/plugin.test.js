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

    afterEach(function (done) {
      if (this.chaos.listening) {
        this.chaos.shutdown().subscribe(() => done(), (error) => done(error));
      } else {
        done();
      }
    });

    it('Allows the bot to load', function (done) {
      this.chaos.listen().subscribe(() => done(), (error) => done(error));
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
