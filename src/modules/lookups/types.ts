/**
 * Short pick-lists other modules use in selects. Lists owned by a module read live from that module (under a "refs"
 * key so they don't collide with the module's own list cache), as the server sends them; the rest stay mocked here
 * until their section is designed.
 */
/** A branch, as /Branch sends it (the name can be missing). */
export type BranchRef = { id: number; name?: string | null }

/** An employee, as /employees sends it. */
export type EmployeeDto = { id: number; firstName?: string | null; lastName?: string | null }
export const fullName = (e: Pick<EmployeeDto, "firstName" | "lastName">) => [e.firstName, e.lastName].filter(Boolean).join(" ")

/** Mock-only seeds for report data. */
