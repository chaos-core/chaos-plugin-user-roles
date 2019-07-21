const ChaosCore = require("chaos-core");

const createChaosBot = (config) => {
  return ChaosCore.test.createChaosStub({
    plugins: [
      require('../src/plugin'),
    ],

    ...config,
  });
};

module.exports = createChaosBot;