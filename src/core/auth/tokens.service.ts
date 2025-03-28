import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { User } from "@prisma/client"
import type { Response } from "express"
import { DatabaseService } from "src/common/database/database.service"
import { JWT_REFRESH_CONFIG } from "./configs/jwt-refresh.config"
import { JWT_CONFIG } from "./configs/jwt.config"

export type JwtPayload = {
  id: string
}

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
}
