export const homeKeys = {
  all: ["home"] as const,
  stat: (name: string) => ["home", "stat", name] as const,
  recent: (list: string, ...rest: unknown[]) => ["home", "recent", list, ...rest] as const,
}
