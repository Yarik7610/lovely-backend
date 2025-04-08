import { MailerService } from "@nestjs-modules/mailer"
import { Injectable } from "@nestjs/common"
import { EmailVerificateToken, PasswordResetToken, User } from "@prisma/client"

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordResetLink(email: User["email"], passwordResetToken: PasswordResetToken["token"]) {
    const RESET_PASSWORD_ROUTE = "reset-password"
    const resetLink = `${process.env.FRONTEND_APP_URL}/${RESET_PASSWORD_ROUTE}?token=${passwordResetToken}`

    const html = `<h2>Forgot your password? If you didn't forget your password, please ignore this message!</h2><p>Click the link to reset your password: <a href="${resetLink}">Reset password</a></p>`

    await this.mailerService.sendMail({
      from: "Lovely Dating App",
      to: email,
      subject: `Password reset message`,
      html
    })
  }

  async sendEmailVerificateLink(email: User["email"], emailVerificateToken: EmailVerificateToken["token"]) {
    const VERIFICATE_EMAIL_ROUTE = "verificate-email"
    const resetLink = `${process.env.FRONTEND_APP_URL}/${VERIFICATE_EMAIL_ROUTE}?token=${emailVerificateToken}`

    const html = `<h2>Want to verificate your email? If you don't, please ignore this message!</h2><p>Click the link to verificate your email: <a href="${resetLink}">Verificate email</a></p>`

    await this.mailerService.sendMail({
      from: "Lovely Dating App",
      to: email,
      subject: `Email verificate message`,
      html
    })
  }
}
