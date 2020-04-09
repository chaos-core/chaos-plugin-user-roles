const {Command} = require("chaos-core");
const {ChaosError} = require("chaos-core").errors;
const {DiscordAPIError, RichEmbed} = require('discord.js');

const {handleDiscordApiError, handleChaosError} = require("../lib/error-handlers");

class RolesCommand extends Command {
  constructor(chaos) {
    super(chaos, {
      name: "roles",
      description: "list roles that can be joined",
    });
  }

  get strings() {
    return super.strings.userRoles.commands.roles;
  }

  async run(context, response) {
    const CommandService = this.chaos.getService('core', 'CommandService');
    const UserRolesService = this.chaos.getService('UserRoles', 'UserRolesService');

    try {
      const [availableRoles, joinedRoles, commandPrefix] = await Promise.all([
        UserRolesService.getAvailableMemberRoles(context.member),
        UserRolesService.getJoinedMemberRoles(context.member),
        CommandService.getPrefix(context.guild.id),
      ]);

      const embed = new RichEmbed();
      embed.setFooter(`${commandPrefix}join {role}`);

      if (availableRoles.length > 0) {
        embed.addField(
          this.strings.embedHeaders.available(),
          availableRoles.map((r) => r.name).join(', '),
        );
      } else {
        embed.addField(
          this.strings.embedHeaders.available(),
          this.strings.allRolesJoined(),
        );
      }

      if (joinedRoles.length > 0) {
        embed.addField(
          this.strings.embedHeaders.joined(),
          joinedRoles.map((r) => r.name).join(', '),
        );
      }

      await response.send({
        content: this.strings.availableToJoin(),
        embed,
      }).toPromise();
    } catch (error) {
      switch (true) {
        case error instanceof DiscordAPIError:
          return handleDiscordApiError(error, response);
        case error instanceof ChaosError:
          return handleChaosError(error, response);
        default:
          throw error;
      }
    }
  }
}

module.exports = RolesCommand;
