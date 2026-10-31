/** The server's employee, as /employees sends it. An employee with a `userName` also has a sign-in. */
export type Employee = {
  id: number
  firstName?: string | null
  lastName?: string | null
  mobile?: string | null
  position?: string | null
  userName?: string | null
  email?: string | null
  branchId?: number | null
  branchName?: string | null
}
/** What the form sends; the branch only goes when the user may choose one. */
export type EmployeeInput = { firstName: string; mobile: string; branchId?: number }
