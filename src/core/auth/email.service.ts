import { MailerService } from "@nestjs-modules/mailer"
import { Injectable } from "@nestjs/common"
import { PasswordResetToken, User } from "@prisma/client"

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordResetLink(email: User["email"], passwordResetToken: PasswordResetToken["token"]) {
    const resetPasswordRoute = "reset-password"
    const resetLink = `${process.env.FRONTEND_APP_URL}/${resetPasswordRoute}?token=${passwordResetToken}`

    const html = `<h2>Forgot your password? If you didn't forget your password, please ignore this email!</h2><p>Click the link to reset your password: <a href="${resetLink}">Reset password</a></p>`

    await this.mailerService.sendMail({
      from: "Lovely Dating App",
      to: email,
      subject: `Password reset message`,
      html
    })
  }
}
