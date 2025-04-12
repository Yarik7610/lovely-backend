export const GOOGLE_AUTH_CONFIG = {
  client_id: process.env.GOOGLE_CLIENT_ID ?? "noClientId",
  client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "noClientSecret",
  redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "noRedirectUri"
}
