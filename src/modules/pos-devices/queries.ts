import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { createCrudQueries, errorToast } from "@/shared/api/crudQueries"
import { devicesApi } from "./service"

export const {
  keys: deviceKeys,
  useList: useDevices,
  useSave: useSaveDevice,
  useDelete: useDeleteDevice,
} = createCrudQueries("pos-devices", devicesApi)

export const useCertificates = () => useQuery({ queryKey: ["pos-devices", "certificates"], queryFn: devicesApi.certificates })

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
