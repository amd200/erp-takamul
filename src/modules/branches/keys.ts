export const branchKeys = {
  all: ["branches"] as const,
  list: ["branches", "list"] as const,
  detail: (id: number) => ["branches", "detail", id] as const,
  refs: ["branches", "refs"] as const,
}
