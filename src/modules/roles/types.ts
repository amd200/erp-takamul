/** A role (what the current system calls a permission), as /permissions/AllRoles and /role-permissions/{id} send it. */
export type Role = { roleId: string; roleName: string; permissions: string[] }
/** The server keeps a role's name once it exists, so only a new role carries one. */
export type RoleInput = { roleName?: string; permissions: string[] }
