const ChaosCore = require('chaos-core');
const Path = require('path');

const localConfig = require('../config');

new ChaosCore({
  dataSource: {
    type: "disk",
    dataDir: Path.join(__dirname, '../data'),
  },

  plugins: [
    require('../index'),
  ],

  ...localConfig,
}).listen();
