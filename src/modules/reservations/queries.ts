import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/shared/i18n"
import { errorToast } from "@/shared/api/errors"
import { reservationsApi } from "./service"
import type { BookingStatus, ReservationInput, ReservationQuery } from "./types"
import { reservationKeys } from "./keys"

export const useReservations = (q: ReservationQuery) => useQuery({ queryKey: reservationKeys.list(q), queryFn: () => reservationsApi.list(q), placeholderData: keepPreviousData })

function useReservationMutation<A>(fn: (a: A) => Promise<unknown>, ok: string, fail = "common.saveFailed") {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => { qc.invalidateQueries({ queryKey: reservationKeys.all }); toast.success(i18n.t(ok)) },
    onError: (e) => errorToast(e, fail),
  })
}

export const useSaveReservation = () => useReservationMutation(({ id, data }: { id?: number; data: ReservationInput }) => (id ? reservationsApi.update(id, data) : reservationsApi.create(data)), "common.saved")
export const useSetReservationStatus = () => useReservationMutation(({ id, status }: { id: number; status: BookingStatus }) => reservationsApi.setStatus(id, status), "common.saved")
export const useDeleteReservation = () => useReservationMutation((id: number) => reservationsApi.remove(id), "common.deleted", "common.deleteFailed")
