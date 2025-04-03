import { Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { PasswordResetToken, RefreshToken, User } from "@prisma/client"
import type { Response } from "express"
import { DatabaseService } from "src/common/database/database.service"
import { JWT_REFRESH_CONFIG } from "./configs/jwt-refresh.config"
import { JWT_CONFIG } from "./configs/jwt.config"
import { JwtResetPasswordPayload, JwtUserPayload } from "./types/jwt-payloads"

@Injectable()
export class TokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService
  ) {}

  private setRefreshTokenInCookies(refreshToken: RefreshToken["token"], response: Response) {
    response.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: JWT_REFRESH_CONFIG.expiresInMs,
      path: "/api/auth/refresh-token" //for now like that
    })
  }

  private deleteRefreshTokenFromCookies(response: Response) {
    response.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth/refresh-token" //for now like that
    })
  }

  private async updateRefreshToken(userId: User["id"], refreshToken: RefreshToken["token"]) {
    await this.databaseService.refreshToken.upsert({
      where: { userId },
      update: {
        token: refreshToken
      },
      create: {
        userId,
        token: refreshToken
      }
    })
  }

  private async updateResetPasswordToken(email: User["email"], resetPasswordToken: PasswordResetToken["token"]) {
    await this.databaseService.passwordResetToken.upsert({
      where: { email },
      update: {
        token: resetPasswordToken
      },
      create: {
        email,
        token: resetPasswordToken
      }
    })
  }

  async generateAccessToken(jwtUserPayload: JwtUserPayload) {
    return await this.jwtService.signAsync(jwtUserPayload, JWT_CONFIG)
  }

  async generateRefreshToken(jwtUserPayload: JwtUserPayload) {
    const { secret, expiresIn } = JWT_REFRESH_CONFIG

    return await this.jwtService.signAsync(jwtUserPayload, {
      secret,
      expiresIn
    })
  }

  async generatePasswordResetToken(jwtResetPasswordPayload: JwtResetPasswordPayload) {
    return await this.jwtService.signAsync(jwtResetPasswordPayload, JWT_CONFIG)
  }

  async storeResetPasswordToken(email: User["email"], passwordResetToken: PasswordResetToken["token"]) {
    await this.updateResetPasswordToken(email, passwordResetToken)
  }

  async storeRefreshToken(id: User["id"], refreshToken: string, response: Response) {
    this.setRefreshTokenInCookies(refreshToken, response)
    await this.updateRefreshToken(id, refreshToken)
  }

  async refreshOldRefreshToken(oldRefreshToken: RefreshToken["token"] | undefined, response: Response) {
    if (!oldRefreshToken) throw new UnauthorizedException("Refresh token wasn't provided")

    let jwtUserPayload: JwtUserPayload
    try {
      jwtUserPayload = await this.jwtService.verifyAsync(oldRefreshToken, {
        secret: JWT_REFRESH_CONFIG.secret
      })
    } catch {
      this.deleteRefreshTokenFromCookies(response)
      throw new UnauthorizedException("Refresh token is invalid or has expired")
    }

    const { id } = jwtUserPayload

    const dbRefreshToken = await this.databaseService.refreshToken.findUnique({
      where: { userId: id }
    })

    if (!dbRefreshToken || dbRefreshToken.token !== oldRefreshToken) {
      this.deleteRefreshTokenFromCookies(response)
      throw new UnauthorizedException("Refresh token is invalid or has expired")
    }

    const accessToken = await this.generateAccessToken({ id })
    const refreshToken = await this.generateRefreshToken({ id })
    await this.storeRefreshToken(id, refreshToken, response)

    return { accessToken }
  }
}
