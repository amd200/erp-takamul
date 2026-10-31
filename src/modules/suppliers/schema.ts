import { z } from "zod";
import { emptyAddress } from "@/modules/partners/types";
import { partyShape, refineParty } from "@/modules/partners/schema";

export const supplierSchema = z
  .object({
    ...partyShape,
    paymentTerms: z.number({ error: "validation.number" }).int("validation.wholeNumber").min(0, "validation.min0"),
  })
  .superRefine(refineParty);
export type SupplierForm = z.infer<typeof supplierSchema>;

export const emptySupplier: SupplierForm = {
  ...emptyAddress,
  name: "",
  phone: "",
  email: "",
  isNational: true,
  taxNumber: "",
  commercialRegister: "",
  paymentTerms: 30,
  openingBalance: 0,
  openingBalanceType: "credit",
  openingBalanceDate: new Date().toISOString().slice(0, 10),
  isActive: true,
};
