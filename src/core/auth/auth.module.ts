import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { JWT_CONFIG } from "src/common/configs/jwt.config"
import { UsersModule } from "../users/users.module"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"

const { secret, expiresIn } = JWT_CONFIG

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret,
      signOptions: { expiresIn }
    })
  ]
})
export class AuthModule {}
