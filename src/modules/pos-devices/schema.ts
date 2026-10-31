import { z } from "zod"

export const deviceSchema = z.object({
  deviceName: z.string().trim().min(1, "validation.nameRequired"),
  serialNumber: z.string().trim().min(1, "validation.serialRequired"),
  invoiceSequence: z.string().trim().min(1, "validation.sequenceRequired"),
  branchId: z.number({ error: "validation.branchRequired" }).min(1, "validation.branchRequired"),
  isActive: z.boolean(),
})
export type DeviceForm = z.infer<typeof deviceSchema>
export const emptyDevice: DeviceForm = { deviceName: "", serialNumber: "", invoiceSequence: "", branchId: 0, isActive: true }
