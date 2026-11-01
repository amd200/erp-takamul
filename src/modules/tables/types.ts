/** A dining table, as /dining-tables sends it (the status is the enum's name). */
export type DiningTable = { id: number; tableName: string; status: "Free" | "Occupied"; currentOrderId?: number | null }
