const ChaosCore = require('chaos-core');
const Path = require('path');

const {from} = require('rxjs');
const {flatMap} = require('rxjs/operators');

const localConfig = require('../config');

const chaos = new ChaosCore({
  dataSource: {
    type: "disk",
    dataDir: Path.join(__dirname, '../data'),
  },

  plugins: [
    require('../src/plugin'),
  ],

  ...localConfig,
});

chaos.on('chaos.listen', () => {
  const PluginService = chaos.getService('core', 'PluginService');

  return from(chaos.discord.guilds.array()).pipe(
    flatMap((guild) => PluginService.enablePlugin(guild.id, 'UserRoles')),
  );
});

chaos.listen();
