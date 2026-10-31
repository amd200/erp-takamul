import { ApiError } from "@/shared/http/ApiError"
import { http } from "@/shared/http/request"
import type { CertificateSummary, DeviceCertificate, DeviceInput, PosDevice, Registration, Reply } from "./types"

const data = async <T,>(call: Promise<Reply<T>>) => (await call).data

/** The ZATCA steps answer 400 with the same envelope when they fail; its message is what the user should read. */
const step = async (url: string, body: unknown) => {
  const reply = await http<Reply<Registration>>(url, { method: "POST", data: body })
  if (!reply.success) throw new ApiError(reply.message ?? "", 400)
  return reply.data
}

export const devicesApi = {
  list: () => data(http<Reply<PosDevice[]>>("/pos-devices")),
  get: (id: number) => data(http<Reply<PosDevice>>(`/pos-devices/${id}`)),
  // The form's branch travels as X-Branch-Id (it wins over the signed-in branch), not in the body.
  create: ({ branchId, deviceName, serialNumber, invoiceSequence }: DeviceInput) =>
    data(http<Reply<PosDevice>>("/pos-devices", { method: "POST", headers: { "X-Branch-Id": String(branchId) }, data: { deviceName, serialNumber, invoiceSequence } })),
  update: (id: number, { deviceName, branchId, invoiceSequence, deviceTypeId, isActive }: DeviceInput) =>
    data(http<Reply<PosDevice>>(`/pos-devices/${id}`, { method: "PUT", data: { deviceName, branchId, invoiceSequence, deviceTypeId, isActive: isActive ?? true, allowOnlineInvoicing: true } })),
  remove: (id: number) => http<Reply<boolean>>(`/pos-devices/${id}`, { method: "DELETE" }),
  generateSerial: () => data(http<Reply<string>>("/pos-devices/generate-serial")),

  generateCsr: (deviceId: number) => step("/zatca-integration/generate-csr", { deviceId }),
  /** The OTP comes from the Fatoora portal and is valid for one hour. */
  registerCcsid: (certificateId: number, otp: string) => step("/zatca-integration/register-ccsid", { certificateId, otp }),
  registerPcsid: (certificateId: number) => step("/zatca-integration/upgrade-to-pcsid", { certificateId }),

  /** The newest certificate of a device, for resuming an onboarding that was left half way. */
  latestCertificate: async (deviceId: number) => {
    const all = await data(http<Reply<DeviceCertificate[]>>(`/certificates/device/${deviceId}/history`))
    return [...(all ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
  },
  certificates: async () => {
    try { return await data(http<Reply<CertificateSummary[]>>("/certificates/all-certificates/summary")) }
    // The server answers 404 when no device has a certificate yet.
    catch (e) { if (e instanceof ApiError && e.status === 404) return [] ; throw e }
  },
  deleteCertificate: (id: number) => http<Reply<boolean>>(`/certificates/${id}`, { method: "DELETE" }),
}
