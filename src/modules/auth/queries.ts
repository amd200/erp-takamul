import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
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
    onSettled: () => { qc.clear(); nav("/login", { replace: true }) },
  })
}
