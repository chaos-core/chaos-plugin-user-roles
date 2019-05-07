const {createChaosStub} = require("chaos-core").test;

const createChaosBot = (config) => {
  return createChaosStub({
    plugins: [
      require('../../index.js'),
    ],

    ...config,
  });
};

module.exports = createChaosBot;