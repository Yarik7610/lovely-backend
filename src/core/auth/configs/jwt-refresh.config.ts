export const JWT_REFRESH_CONFIG = {
  secret: process.env.JWT_REFRESH_SECRET,
  expiresIn: "7d",
  expiresInMs: 7 * 24 * 60 * 60 * 1000
}
