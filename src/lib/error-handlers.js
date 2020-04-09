const {throwError} = require('rxjs');
const {ChaosError} = require("chaos-core").errors;
const {DiscordAPIError} = require('discord.js');

function isInstanceOf(error, type) {
  return error instanceof type;
}

async function handleDiscordApiError(error, response) {
  if (!isInstanceOf(error, DiscordAPIError)) {
    return throwError(error);
  }

  switch (error.message) {
    case "Missing Permissions":
      return response.send({
        type: 'message',
        content:
          `Whoops, I do not have permission to update user roles. Can you ask an admin to grant me the ` +
          `"Manage Roles" permission?`,
      }).toPromise();
    case "Privilege is too low...":
      return response.send({
        type: 'message',
        content: `I'm unable to change your roles; Your permissions outrank mine.`,
      }).toPromise();
    default:
      throw error;
  }
}

async function handleChaosError(error, response) {
  if (error instanceof ChaosError) {
    return response.send({
      content: error.message,
    }).toPromise();
  } else {
    throw error;
  }
}

module.exports = {
  handleDiscordApiError,
  handleChaosError,
};
