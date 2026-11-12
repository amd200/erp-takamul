export const homeKeys = {
  all: ["home"] as const,
  subscription: ["home", "subscription"] as const,
  stat: (name: string) => ["home", "stat", name] as const,
  recent: (list: string, ...rest: unknown[]) => ["home", "recent", list, ...rest] as const,
}
