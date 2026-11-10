import { z } from "zod"

export const deviceSchema = z.object({
  deviceName: z.string().trim().min(1, "validation.nameRequired"),
  serialNumber: z.string().trim().min(1, "validation.serialRequired"),
  invoiceSequence: z.string().trim().min(1, "validation.sequenceRequired"),
  branchId: z.number({ error: "validation.branchRequired" }).min(1, "validation.branchRequired"),
  isActive: z.boolean(),
})

export const chainSchema = z.object({
  newICV: z.number({ error: "validation.counterRequired" }).int().min(0, "validation.counterRequired"),
  newPIH: z.string().trim().min(1, "validation.hashRequired"),
})
export type ChainForm = z.infer<typeof chainSchema>
export type DeviceForm = z.infer<typeof deviceSchema>
export const emptyDevice: DeviceForm = { deviceName: "", serialNumber: "", invoiceSequence: "", branchId: 0, isActive: true }
