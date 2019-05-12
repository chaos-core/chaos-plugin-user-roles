const {concat, of} = require('rxjs');
const {flatMap, map, toArray} = require('rxjs/operators');
const {Command} = require("chaos-core");
const {RichEmbed} = require("discord.js");

const {catchChaosError} = require("../error-handlers");
const {catchJoinableRoleError} = require("../error-handlers");
const {catchDiscordApiError} = require("../error-handlers");

class RolesCommand extends Command {
  constructor(chaos) {
    super(chaos, {
      name: "roles",
      description: "list roles that can be joined",
    });
  }

  onListen() {
    this.joinRolesService = this.chaos.getService('joinableRoles', 'JoinRolesService');
  }

  run(context, response) {
    return of('').pipe(
      flatMap(() => concat(
        this.joinRolesService.getAvailableMemberRoles(context.member),
        this.joinRolesService.getJoinedMemberRoles(context.member),
      )),
      map(roles => roles.map(r => `\`${r.name}\``).join(', ')),
      toArray(),
      map(([availableRoles, joinedRoles]) => {
        const embed = new RichEmbed();

        if (availableRoles.length > 0) {
          embed.addField("Available:", availableRoles);
        } else {
          embed.addField("Available:", "You've joined all the roles!");
        }

        if (joinedRoles.length > 0) {
          embed.addField("Joined:", joinedRoles);
        }

        return embed;
      }),
      flatMap(embed => response.send({
        content: "Here are the roles you can join:",
        embed,
      })),
      catchDiscordApiError(context, response),
      catchJoinableRoleError(context, response),
      catchChaosError(context, response),
    );
  }
}

module.exports = RolesCommand;