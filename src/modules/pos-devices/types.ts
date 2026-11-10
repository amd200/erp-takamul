/** Mirrors /pos-devices, /zatca-integration and /certificates. The ZATCA endpoints answer inside an envelope. */
export type Reply<T> = { success: boolean; message?: string | null; data: T; errors?: string[] | null }

/** ZATCA onboarding: device saved → CSR generated (waiting for the OTP) → compliance cert (CCSID) → production cert (PCSID). */
export type DeviceStatus = "NotRegistered" | "PendingOTP" | "CCSIDRegistered" | "PCSIDRegistered" | "Active" | "Expired" | "Revoked"

/** A device, as /pos-devices sends it. */
export type PosDevice = {
  id: number
  deviceName: string
  commonName: string
  serialNumber: string
  invoiceSequence?: string | null
  status: DeviceStatus
  certificateType: string
  currentICV: number
  lastPIH?: string | null
  registrationNumber?: string | null
  certificateIssuedAt?: string | null
  certificateExpiresAt?: string | null
  isCertificateExpired: boolean
  daysUntilExpiry?: number | null
  deviceTypeId: number
  deviceTypeName?: string | null
  branchId: number
  branchName?: string | null
  isActive: boolean
  location?: string | null
  createdAt: string
  updatedAt?: string | null
}

/** What the wizard's first step sends. The branch goes as X-Branch-Id on create, in the body on update. */
export type DeviceInput = { deviceName: string; serialNumber: string; invoiceSequence: string; branchId: number; deviceTypeId?: number; isActive?: boolean }

/** What each onboarding step answers (the token and keys are kept by the server and not shown). */
export type Registration = { certificateId: number; success: boolean; message: string; expiresAt?: string | null; newStatus?: string | number }

/** A certificate row of /certificates/all-certificates/summary. */
export type CertificateSummary = {
  deviceId: number
  deviceName: string
  deviceCertificateId: number
  hasActiveCertificate: boolean
  currentCertificateType?: string | null
  registrationNumber?: string | null
  expiresAt?: string | null
  isExpired: boolean
  daysUntilExpiry?: number | null
  totalCertificates: number
  activeCertificates: number
  expiredCertificates: number
}

/** A certificate of one device (/certificates/device/{id}/history). */
export type DeviceCertificate = { id: number; posDeviceId: number; certificateType: string; isActive: boolean; createdAt: string }

/** A certificate that expires soon, from /certificates/expiring. */
export type ExpiringCertificate = DeviceCertificate & { deviceName: string; expiresAt: string; isExpired: boolean; daysUntilExpiry: number }
