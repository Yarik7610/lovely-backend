export const EMAIL_SENDER_CONFIG = {
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  user: process.env.EMAIL_SENDER_USER,
  password: process.env.EMAIL_SENDER_PASSWORD
}
