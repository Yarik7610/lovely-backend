import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import type { Request } from "express"
import { JWT_CONFIG } from "../configs/jwt.config"
import { JwtPayload } from "../tokens.service"

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)
    if (!token) return false

    let jwtPayload: JwtPayload
    try {
      jwtPayload = await this.jwtService.verifyAsync(token, {
        secret: JWT_CONFIG.secret
      })

      request["user"] = jwtPayload
    } catch {
      return false
    }

    return true
  }

  private extractTokenFromHeader(request: Request) {
    const [type, token] = request.headers.authorization?.split(" ") ?? []

    return type === "Bearer" ? token : undefined
  }
}
