import { Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { RefreshToken, User } from "@prisma/client"
import type { Response } from "express"
import { DatabaseService } from "src/common/database/database.service"
import { JWT_REFRESH_CONFIG } from "./configs/jwt-refresh.config"
import { JWT_CONFIG } from "./configs/jwt.config"
import { JwtPayload } from "./types/jwt-payload"

@Injectable()
export class TokensService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService
  ) {}

  private setRefreshTokenInCookies(refreshToken: string, response: Response) {
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

  private async updateRefreshToken(userId: User["id"], refreshToken: string) {
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

  async generateAccessToken(jwtPayload: JwtPayload) {
    return await this.jwtService.signAsync(jwtPayload, JWT_CONFIG)
  }

  async generateRefreshToken(jwtPayload: JwtPayload) {
    const { secret, expiresIn } = JWT_REFRESH_CONFIG

    return await this.jwtService.signAsync(jwtPayload, {
      secret,
      expiresIn
    })
  }

  async storeRefreshToken(id: User["id"], refreshToken: string, response: Response) {
    this.setRefreshTokenInCookies(refreshToken, response)
    await this.updateRefreshToken(id, refreshToken)
  }

  async refresh(oldRefreshToken: RefreshToken["token"] | undefined, response: Response) {
    if (!oldRefreshToken) throw new UnauthorizedException("Refresh token wasn't provided")

    let jwtPayload: JwtPayload
    try {
      jwtPayload = await this.jwtService.verifyAsync(oldRefreshToken, {
        secret: JWT_REFRESH_CONFIG.secret
      })
    } catch {
      this.deleteRefreshTokenFromCookies(response)
      throw new UnauthorizedException("Refresh token is invalid or has expired")
    }

    const { id } = jwtPayload

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
