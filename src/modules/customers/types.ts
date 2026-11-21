import type { PartyDto } from "@/modules/partners/types"

export const EYE_FIELDS = ["sphRight", "sphLeft", "cylRight", "cylLeft", "axisRight", "axisLeft", "add", "ipd", "clRight", "clLeft"] as const
export type EyeField = (typeof EYE_FIELDS)[number]

export type Measurement = Record<EyeField, string>

export type EyeDto = Partial<Record<EyeField, string | null>>

export type Companion = Measurement & { id?: number; name: string; phone: string }
export type CompanionDto = EyeDto & { id?: number; name: string; phone?: string | null }

export type Customer = PartyDto & EyeDto & { id: number; customerCode?: number | null; customerName: string; fileNumber?: string | null; companions?: CompanionDto[] }

export type SelectedMeasurement = Measurement & { customerId: number; source: "customer" | "companion"; companionId?: number; name: string }
