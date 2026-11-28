import { getDb, TABLES, type TableName } from "../db"
import type { Profile } from "../profiles/types"
import * as common from "./common"

const SEEDED = "seeded"

function rowsOf(p: Profile): Partial<Record<TableName, { id: number }[]>> {
  return {
    branches: [p.branch],
    categories: p.categories.map((c) => ({ branchId: common.MAIN_BRANCH_ID, categoryNameEn: null, categoryNameUr: null, description: null, parentCategoryId: null, isActive: 1, imageUrl: null, ...c })),
    products: p.products,
    treasuries: p.treasuries,
    suppliers: p.suppliers,
    expenseItems: p.expenseItems,
    customers: [common.defaultCustomer],
    employees: [common.demoEmployee],
    roles: common.roles,
    units: common.units,
    taxes: common.taxes,
    exemptionReasons: common.exemptionReasons,
    warehouses: common.warehouses,
    posDevices: common.posDevices,
    shifts: [common.demoShift(String(p.branch.name ?? ""))],
  }
}

/** Fills an empty database with the activity's starting data. */
export async function seedIfEmpty(p: Profile) {
  const db = getDb()
  if (await db.meta.get(SEEDED)) return
  await writeSeed(p)
}

/** Wipes everything the visitor added or changed and puts the starting data back. */
export async function resetToSeed(p: Profile) {
  await writeSeed(p)
}

async function writeSeed(p: Profile) {
  const db = getDb()
  const rows = rowsOf(p)
  await db.transaction("rw", [...TABLES.map((t) => db.table(t)), db.settings, db.meta], async () => {
    for (const t of TABLES) {
      await db.table(t).clear()
      const seed = rows[t]
      if (seed?.length) await db.table(t).bulkAdd(structuredClone(seed))
    }
    await db.settings.clear()
    await db.settings.bulkAdd(Object.entries(p.settings).map(([group, value]) => ({ group, value: structuredClone(value as Record<string, unknown>) })))
    await db.meta.put({ key: SEEDED, value: new Date().toISOString() })
  })
}
