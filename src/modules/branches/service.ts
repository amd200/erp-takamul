import { fetchAllPages } from "@/shared/http/paged"
import { http } from "@/shared/http/request"
import type { BranchRow, Branch, BranchInput, BranchPage, BranchQuery } from "./types"

// The server takes a multipart form. Empty text is sent as empty so a cleared field is cleared on the server.
function form(b: BranchInput, extra: Record<string, unknown>) {
  const text = (v: string) => v.trim()
  const fields: Record<string, unknown> = {
    Code: text(b.code), Name: text(b.name), NameEn: text(b.nameEn), ShortName: text(b.shortName), ShortNameEn: text(b.shortNameEn), Phone: text(b.phone),
    CommercialRegister: text(b.commercialRegister), TaxNumber: text(b.taxNumber), FooterNote: text(b.footerNote), Iban: text(b.iban),
    BankName: text(b.bankName), BankNameEn: text(b.bankNameEn), BankAccountName: text(b.bankAccountName), BankAccountNameEn: text(b.bankAccountNameEn), BankAccountNumber: text(b.bankAccountNumber),
    Street: text(b.street), District: text(b.district), BuildingNumber: text(b.buildingNumber), SubNumber: text(b.subNumber), PostalCode: text(b.postalCode),
    CityName: text(b.cityName), StateName: text(b.stateName), CountryName: "SA", LocationAddress: text(b.locationAddress),
    OrganizationName: text(b.name), OrganizationUnitName: text(b.organizationUnitName), IndustryBusinessCategory: text(b.industryBusinessCategory),
    ...extra,
    Email: "", AdditionalNumber: "",
  }
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined || v === null) continue
    fd.append(k, v instanceof Blob ? v : String(v))
  }
  return fd
}

export const branchesApi = {
  page: (q: BranchQuery) => http<BranchPage>("/Branch", { params: { PageNumber: q.page, PageSize: q.pageSize, SearchTerm: q.searchTerm || undefined } }),
  list: () => fetchAllPages<BranchRow>("/Branch", { pageParam: "PageNumber" }),
  get: (id: number) => http<Branch>(`/Branch/${id}`),
  create: (b: BranchInput) => http<unknown>("/Branch", { method: "POST", data: form(b, { Image: b.image, StampImage: b.stampImage }) }),
  update: (id: number, b: BranchInput, current: Branch) => http<unknown>(`/Branch/${id}`, {
    method: "PUT",
    data: form(b, { Id: id, IsActive: current.isActive == null ? undefined : String(current.isActive), Image: b.image, ImageUrl: b.image ? undefined : current.imageUrl ?? "", StampImage: b.stampImage }),
  }),
}
