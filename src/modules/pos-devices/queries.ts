import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast, type ListSort } from "@/shared/api/errors"
import { devicesApi } from "./service"

export const deviceKeys = { all: ["pos-devices"] as const }

export const useDevices = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["pos-devices", "list", sort] : ["pos-devices", "list"], queryFn: () => devicesApi.list(sort), placeholderData: keepPreviousData })

export const useSaveDevice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: Parameters<typeof devicesApi.create>[0] }) => (id ? devicesApi.update(id, data) : devicesApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pos-devices"] })
      toast.success(i18n.t("common.saved"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}

export const useDeleteDevice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => devicesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pos-devices"] })
      toast.success(i18n.t("common.deleted"))
    },
    onError: (e) => errorToast(e, "common.deleteFailed"),
  })
}

export const useCertificates = (sort?: ListSort) => useQuery({ queryKey: sort?.SortBy ? ["pos-devices", "certificates", sort] : ["pos-devices", "certificates"], queryFn: () => devicesApi.certificates(sort), placeholderData: keepPreviousData })

/** Onboarding steps; each refreshes the device list. Errors are shown by the wizard itself. */
function useStep<A, R>(fn: (a: A) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: deviceKeys.all }) })
}

export const useGenerateCsr = () => useStep((deviceId: number) => devicesApi.generateCsr(deviceId))
export const useRegisterCcsid = () => useStep(({ certificateId, otp }: { certificateId: number; otp: string }) => devicesApi.registerCcsid(certificateId, otp))
export const useRegisterPcsid = () => useStep((certificateId: number) => devicesApi.registerPcsid(certificateId))

/** Deleting a certificate sends the device back to "not registered", so both lists refresh. */
export function useRevokeCertificate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (certificateId: number) => devicesApi.deleteCertificate(certificateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: deviceKeys.all })
      toast.success(i18n.t("devices.certRevoked"))
    },
    onError: (e) => errorToast(e, "common.saveFailed"),
  })
}
