/** Mirrors /employees/GetAllUsers, as the server sends it. Each user is an employee with a sign-in. */
export type User = {
  id: number
  firstName?: string | null
  userName?: string | null
  email?: string | null
  mobile?: string | null
  branchId?: number | null
  branchName?: string | null
  /** The server links users to roles by name. */
  roleName?: string | null
  roles?: { roleId: number; roleName: string }[] | null
  /** May switch between branches after signing in. */
  isMultiBranch?: boolean | null
}

/** What the add / edit form holds. */
export type UserInput = { name: string; userName: string; email: string; mobile: string; branchId: number; roleName: string; isMultiBranch: boolean; password?: string }
