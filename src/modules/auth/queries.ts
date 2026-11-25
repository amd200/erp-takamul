import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { usePosStore } from "@/modules/pos/store"
import { authApi } from "./service"

/** Signing in or out changes who the cached data belongs to, so the cache is cleared. */
export function useLogin() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: authApi.login, onSuccess: () => qc.clear() })
}

export function useLogout() {
  const qc = useQueryClient()
  const nav = useNavigate()
  return useMutation({
    mutationFn: authApi.logout,
    // The next user on this device must not get this user's unconfirmed sale.
    onSettled: () => { qc.clear(); usePosStore.getState().clear(); nav("/login", { replace: true }) },
  })
}

export function useForgetPassword() {
  return useMutation({ mutationFn: authApi.forgetPassword })
}

export function useVerifyOtp() {
  return useMutation({ mutationFn: authApi.verifyOtp })
}

export function useResetPassword() {
  return useMutation({ mutationFn: authApi.resetPassword })
}
