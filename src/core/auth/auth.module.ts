import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { UsersModule } from "../users/users.module"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { TokensService } from "./tokens.service"

@Module({
  controllers: [AuthController],
  providers: [AuthService, TokensService],
  imports: [UsersModule, JwtModule.register({ global: true })]
})
export class AuthModule {}
