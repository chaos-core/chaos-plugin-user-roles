class UserRoleError extends Error {
  constructor(message) {
    super();
    this.message = message;
    this.name = "JoinableRoleError";
  }
}

class NonJoinableRoleError extends UserRoleError {
  constructor(message) {
    super(message);
    this.name = "NonJoinableRoleError";
  }
}

class NoUserRolesError extends UserRoleError {
  constructor(message) {
    super(message);
    this.name = "NoUserRolesError";
  }
}

class JoinRoleError extends UserRoleError {
  constructor(message) {
    super(message);
    this.name = "JoinRoleError";
  }
}

class LeaveRoleError extends UserRoleError {
  constructor(message) {
    super(message);
    this.name = "LeaveRoleError";
  }
}

module.exports = {
  UserRoleError,
  NonJoinableRoleError,
  NoUserRolesError,
  JoinRoleError,
  LeaveRoleError,
};