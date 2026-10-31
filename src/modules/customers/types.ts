import type { PartyBase, PartyDto } from "@/modules/partners/types"

/** clRight / clLeft are the contact lens values: free text on the server, the rest are numbers. */
export const EYE_FIELDS = ["sphRight", "sphLeft", "cylRight", "cylLeft", "axisRight", "axisLeft", "add", "ipd", "clRight", "clLeft"] as const
export const TEXT_EYE_FIELDS: readonly string[] = ["clRight", "clLeft"]
export type EyeField = (typeof EYE_FIELDS)[number]

/** Eye measurements as typed in the form: the server stores numbers, an empty string means none. */
export type Measurement = Record<EyeField, string>

/** Eye measurements as the server sends them. */
export type EyeDto = Partial<Record<EyeField, number | string | null>>

/** Someone who comes with the customer and has measurements of their own. `id` is set once saved. */
export type Companion = Measurement & { id?: number; name: string; phone: string }
export type CompanionDto = EyeDto & { id?: number; name?: string | null; phone?: string | null }

/** Mirrors /Customer, as the server sends it. balance > 0 means the customer owes us. */
export type Customer = PartyDto & EyeDto & { id: number; customerCode?: number | null; customerName: string; fileNumber?: string | null; companions?: CompanionDto[] | null }

/** What the add / edit form holds. */
export type CustomerInput = Omit<PartyBase, "id" | "code"> & Measurement & { fileNumber: string; companions: Companion[] }

/** The measurement the cashier picked for the current sale: the customer's own or a companion's. */
export type SelectedMeasurement = Measurement & { customerId: number; source: "customer" | "companion"; companionId?: number; name: string }
