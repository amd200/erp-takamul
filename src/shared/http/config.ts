/**
 * The full server address (see .env.*), or "/api" when the app and the API share one domain behind a reverse proxy.
 * The desktop app calls the backend address from its own config.json directly.
 */
export const API_BASE_URL: string = window.desktop ? `${window.desktop.serverUrl.replace(/\/+$/, "")}/api` : import.meta.env.VITE_API_BASE_URL || "/api"
