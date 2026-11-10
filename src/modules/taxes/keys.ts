import { refKeys } from "@/shared/api/keys"

export const taxKeys = {
  list: [...refKeys.all, "taxes"] as const,
  reasons: [...refKeys.all, "tax-exemption-reasons"] as const,
}
