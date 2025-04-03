import { MailerModule } from "@nestjs-modules/mailer"
import { Module } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { JwtModule } from "@nestjs/jwt"
import { UsersModule } from "../users/users.module"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { EMAIL_SENDER_CONFIG } from "./configs/email-sender.config"
import { EmailService } from "./email.service"
import { AuthGuard } from "./guards/auth.guard"
import { TokensService } from "./tokens.service"

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    TokensService,
    EmailService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    }
  ],
  imports: [
    UsersModule,
    JwtModule.register({ global: true }),
    MailerModule.forRoot({
      transport: {
        host: EMAIL_SENDER_CONFIG.host,
        port: EMAIL_SENDER_CONFIG.port,
        secure: EMAIL_SENDER_CONFIG.secure,
        auth: {
          user: EMAIL_SENDER_CONFIG.user,
          pass: EMAIL_SENDER_CONFIG.password
        }
      }
    })
  ]
})
export class AuthModule {}
