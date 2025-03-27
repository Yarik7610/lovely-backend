export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: "1h" }
}
