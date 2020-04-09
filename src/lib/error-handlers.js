const {throwError} = require('rxjs');
const {ChaosError} = require("chaos-core").errors;
const {DiscordAPIError} = require('discord.js');

function isInstanceOf(error, type) {
  return error instanceof type;
}

function handleDiscordApiError(error, response) {
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
      });
    case "Privilege is too low...":
      return response.send({
        type: 'message',
        content: `I'm unable to change your roles; Your permissions outrank mine.`,
      });
    default:
      return throwError(error);
  }
}

function handleChaosError(error, response) {
  if (error instanceof ChaosError) {
    return response.send({
      content: error.message,
    });
  } else {
    return throwError(error);
  }
}

module.exports = {
  handleDiscordApiError,
  handleChaosError,
};
