class UserRoleError extends Error {
  constructor(message) {
    super();
    this.message = message;
    this.name = "UserRoleError";
  }
}

module.exports = UserRoleError;