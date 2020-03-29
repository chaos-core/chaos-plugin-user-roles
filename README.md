# User Roles Chaos Plugin

Adds support for joinable roles to ChaosCore discord bots

- [Strings](#strings)
- Commands
    - [join](#join)
    - [leave](#leave)
    - [roles](#roles)
- Config Actions
    - [addRole](#addrole)
    - [removeRole](#removerole)

## Strings

For overridable strings, see [plugin.strings.js](./src/plugin.strings.js) 

## Commands

### join
Joins a role. 
```
!join {role}
```
- `role`: The name of the role to join

*Note: Role must be added to the list of joinable roles before users can join* 


### leave
Leaves a role. 
```
!leave {role}
```

- `role`: The name of the role to leave

*Note: Role must be in the list of joinable roles*

### roles
List all available and joined roles. 
```
!roles
```

## Config Actions

### addRole
Adds a role to the list of joinable roles
```
!config userRoles addRole {role}
```

- `role`: The name of the role to add. Can be by mention, name, or id.

### removeRole
Removes a role from the list of joinable roles
```
!config userRoles removeRole {role}
```

- `role`: The name of the role to remove. Can be by mention, name, or id.
