import { useAuthStore } from "@/shared/auth/authStore"
import { emptyAddress, type PartyBase, type PartyDto } from "./types"

const text = (v: string | null | undefined) => v ?? ""
const blank = (v: string) => v.trim() || null

export const sideFromDto = (v: PartyDto["openingBalanceType"], fallback: "debit" | "credit"): "debit" | "credit" =>
  v == null ? fallback : v === 2 || v === "Credit" ? "credit" : "debit"

/** What a party's add / edit form starts with when a saved party is opened. */
export function partyFormOf(d: PartyDto, fallbackSide: "debit" | "credit") {
  return {
    ...emptyAddress,
    phone: text(d.phone) || text(d.mobile),
    email: text(d.email),
    country: text(d.countryName) || emptyAddress.country,
    state: text(d.stateName),
    city: text(d.cityName),
    district: text(d.district),
    street: text(d.street),
    buildingNumber: text(d.buildingNumber),
    additionalNumber: text(d.additionalNumber),
    postalCode: text(d.postalCode),
    isNational: d.isNational ?? true,
    taxNumber: text(d.taxNumber),
    commercialRegister: text(d.commercialRegister),
    openingBalance: d.openingBalance ?? 0,
    openingBalanceType: sideFromDto(d.openingBalanceType, fallbackSide),
    openingBalanceDate: (d.openingBalanceDate ?? "").slice(0, 10),
    isActive: d.isActive ?? true,
  } satisfies Omit<PartyBase, "id" | "code" | "name">
}

type PartyForm = Omit<PartyBase, "id" | "code" | "name">

/** The part of the request body customers and suppliers share. */
export function partyToBody(p: PartyForm) {
  return {
    phone: blank(p.phone),
    // The server keeps a one-line address next to the structured one; build it from the parts.
    address: blank([p.street, p.district, p.city].filter(Boolean).join("، ")),
    buildingNumber: blank(p.buildingNumber),
    additionalNumber: blank(p.additionalNumber),
    cityName: blank(p.city),
    stateName: blank(p.state),
    countryName: blank(p.country),
    district: blank(p.district),
    street: blank(p.street),
    postalCode: blank(p.postalCode),
    commercialRegister: blank(p.commercialRegister),
    taxNumber: p.isNational ? blank(p.taxNumber) : null,
    isNational: p.isNational,
    openingBalance: p.openingBalance,
    openingBalanceDate: p.openingBalanceDate || null,
    openingBalanceType: p.openingBalanceType === "credit" ? "Credit" : "Debit",
  }
}

/** New records go to the branch picked in the header (multi-branch users); others get their own. */
export const currentBranchId = () => useAuthStore.getState().session?.branchId ?? null
