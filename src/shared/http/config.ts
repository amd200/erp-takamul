/** The full server address (see .env.*), or "/api" when the app and the API share one domain behind a reverse proxy. */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "/api"
