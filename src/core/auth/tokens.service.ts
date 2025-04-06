import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { PasswordResetToken, RefreshToken, User } from "@prisma/client"
import type { Response } from "express"
import { DatabaseService } from "src/common/database/database.service"
import { JWT_REFRESH_CONFIG } from "./configs/jwt-refresh.config"
import { JWT_CONFIG } from "./configs/jwt.config"
import { JwtPasswordResetPayload, JwtUserPayload } from "./types/jwt-payloads"

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

  private async deleteRefreshToken(userId: User["id"]) {
    await this.databaseService.refreshToken.delete({
      where: { userId }
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

  private async updatePasswordResetToken(email: User["email"], passwordResetToken: PasswordResetToken["token"]) {
    await this.databaseService.passwordResetToken.upsert({
      where: { email },
      update: {
        token: passwordResetToken
      },
      create: {
        email,
        token: passwordResetToken
      }
    })
  }

  private async getPasswordResetToken(passwordResetToken: PasswordResetToken["token"]) {
    return await this.databaseService.passwordResetToken.findUnique({
      where: {
        token: passwordResetToken
      }
    })
  }

  private async deletePasswordResetToken(passwordResetToken: PasswordResetToken["token"]) {
    return await this.databaseService.passwordResetToken.delete({
      where: {
        token: passwordResetToken
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

  async generatePasswordResetToken(jwtResetPasswordPayload: JwtPasswordResetPayload) {
    return await this.jwtService.signAsync(jwtResetPasswordPayload, JWT_CONFIG)
  }

  async storeRefreshToken(id: User["id"], refreshToken: string, response: Response) {
    this.setRefreshTokenInCookies(refreshToken, response)
    await this.updateRefreshToken(id, refreshToken)
  }

  async removeRefreshToken(id: User["id"], response: Response) {
    this.deleteRefreshTokenFromCookies(response)
    await this.deleteRefreshToken(id)
  }

  async storePasswordResetToken(email: User["email"], passwordResetToken: PasswordResetToken["token"]) {
    await this.updatePasswordResetToken(email, passwordResetToken)
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

  async verifyPasswordResetToken(passwordResetToken: PasswordResetToken["token"]) {
    const existingPasswordResetToken = await this.getPasswordResetToken(passwordResetToken)
    if (!existingPasswordResetToken) throw new BadRequestException("Didn't find such password reset token")

    let passwordResetPayload: JwtPasswordResetPayload
    try {
      passwordResetPayload = await this.jwtService.verifyAsync(passwordResetToken, {
        secret: JWT_CONFIG.secret
      })
      return passwordResetPayload
    } catch {
      throw new BadRequestException(
        "Password reset token is invalid or has expired. Request new password one more time"
      )
    } finally {
      this.deletePasswordResetToken(passwordResetToken)
    }
  }
}
