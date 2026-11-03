import { useEffect } from "react"
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr"
import { API_BASE_URL } from "@/shared/http/config"
import { useAuthStore } from "./authStore"

/** Same server address without the "/api" part: the hubs live at the root. */
const SERVER_URL = API_BASE_URL.replace(/\/api\/?$/, "")
const CHANNEL = "auth"

/**
 * While signed in: listens on /hubs/auth for "ForceLogout" (sent when the user picks "sign out of all
 * devices" on another device) and signs this device out. Other open tabs are told through a BroadcastChannel.
 */
export function useForceLogout() {
  const signedIn = useAuthStore((s) => !!s.session)

  useEffect(() => {
    if (!signedIn) return
    const signOut = () => useAuthStore.getState().clear()

    const channel = new BroadcastChannel(CHANNEL)
    channel.onmessage = (e) => { if (e.data === "logout") signOut() }

    const connection = new HubConnectionBuilder()
      .withUrl(`${SERVER_URL}/hubs/auth`, { accessTokenFactory: () => useAuthStore.getState().session?.accessToken ?? "" })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()
    connection.on("ForceLogout", () => {
      channel.postMessage("logout")
      signOut()
    })
    connection.start().catch(() => {})

    return () => { channel.close(); void connection.stop() }
  }, [signedIn])
}
