import type { PermissionAction, PermissionLeaf, PermissionPage, PermissionSection } from "./catalog"

/** Anything in the tree that holds permissions under it. */
export type TreeNode = PermissionSection | PermissionPage | PermissionAction | PermissionLeaf
export type CheckState = "none" | "some" | "all"

/** The server sometimes leaves a stray space at the end of a permission string, so strings are compared without it. */
export const same = (s: string) => s.trim().replace(/\s+/g, " ")

/** Every permission string under a node (a leaf's own, an action's, a page's or a section's). */
export function valuesOf(n: TreeNode): string[] {
  if ("value" in n) return [n.value]
  if ("subs" in n) return n.subs.map((s) => s.value)
  if ("pages" in n) return [...n.pages.flatMap(valuesOf), ...(n.actions ?? []).flatMap(valuesOf)]
  return n.actions.flatMap(valuesOf)
}

export const heldSet = (selected: string[]) => new Set(selected.map(same))

/** A node's checkbox: all of its permissions held, some, or none. A permission listed twice counts once. */
export function checkState(values: string[], held: ReadonlySet<string>): CheckState {
  const own = [...new Set(values.map(same))]
  const n = own.filter((v) => held.has(v)).length
  return n === 0 ? "none" : n === own.length ? "all" : "some"
}

/**
 * The role's permissions after switching `values` on or off. Strings the tree does not list (such as "<group>.الكل")
 * are never touched, so saving a role from here cannot drop something it could not show.
 */
export function withValues(selected: string[], values: string[], on: boolean): string[] {
  const targets = new Set(values.map(same))
  if (!on) return selected.filter((s) => !targets.has(same(s)))
  const held = heldSet(selected)
  const added = new Map<string, string>()
  for (const v of values) if (!held.has(same(v))) added.set(same(v), v)
  return [...selected, ...added.values()]
}

// The sales settings' tabs are listed in the order they have in the settings page, shortest name first.
const SALES_TABS = ["general", "salons", "shifts", "sale", "invoice", "payment", "preparation", "appearance", "a4_printing", "roll_printing", "voucher_printing", "operations", "barcode", "customers", "suppliers", "purchases_screen", "tables", "items", "pricing_systems", "category_discounts"]

/** The actions of a page in the order they are shown: as listed, except the sales settings' tabs. */
export function shownActions(page: PermissionPage, text: (label: string) => string): PermissionAction[] {
  if (page.id !== "sales_settings") return page.actions
  const rank = (a: PermissionAction) => { const i = SALES_TABS.indexOf(a.id.replace(/^sales_/, "")); return i < 0 ? SALES_TABS.length : i }
  return [...page.actions].sort((a, b) => text(a.label).trim().length - text(b.label).trim().length || rank(a) - rank(b))
}
