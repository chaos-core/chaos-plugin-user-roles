class JoinableRoleError extends Error {
  constructor(message) {
    super(message);
    this.name = "JoinableRoleError";
  }
}

class NonJoinableRoleError extends JoinableRoleError {
  constructor(message) {
    super(message);
    this.name = "NonJoinableRoleError";
  }
}

class NoUserRolesError extends JoinableRoleError {
  constructor(message) {
    super(message);
    this.name = "NoUserRolesError";
  }
}

class JoinRoleError extends JoinableRoleError {
  constructor(message) {
    super(message);
    this.name = "JoinRoleError";
  }
}

class LeaveRoleError extends JoinableRoleError {
  constructor(message) {
    super(message);
    this.name = "LeaveRoleError";
  }
}

module.exports = {
  JoinableRoleError,
  NonJoinableRoleError,
  NoUserRolesError,
  JoinRoleError,
  LeaveRoleError,
};