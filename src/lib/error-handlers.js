const {RoleNotFoundError} = require("chaos-core").errors;
const {throwError} = require('rxjs');
const {catchError} = require('rxjs/operators');
const {DiscordAPIError} = require('discord.js');

const {JoinableRoleError, NoUserRolesError} = require("./errors");

function isInstanceOf(error, type) {
  return error instanceof type;
}

function catchDiscordApiError(context, response) {
  return (source) => source.pipe(
    catchError((error) => {
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
    }),
  );
}

function catchJoinableRoleError(context, response) {
  return (source) => source.pipe(
    catchError((error) => {
      if (error instanceof NoUserRolesError) {
        return response.send({
          content: "No roles to join were found",
        });
      } else if (error instanceof JoinableRoleError) {
        return response.send({
          content: error.message,
        });
      } else {
        return throwError(error);
      }
    }),
  );
}

function catchChaosError(context, response) {
  return (source) => source.pipe(
    catchError((error) => {
      if (error instanceof RoleNotFoundError) {
        return response.send({
          content: error.message,
        });
      } else {
        return throwError(error);
      }
    }),
  );
}

module.exports = {
  catchDiscordApiError,
  catchJoinableRoleError,
  catchChaosError,
};