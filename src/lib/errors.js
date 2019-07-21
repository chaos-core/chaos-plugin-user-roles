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

class NoJoinableRolesError extends JoinableRoleError {
  constructor(message) {
    super(message);
    this.name = "NoJoinableRolesError";
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
  NoJoinableRolesError,
  JoinRoleError,
  LeaveRoleError,
};