import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { User } from "@prisma/client"
import * as bcrypt from "bcrypt"
import type { Response } from "express"
import { CreateUserDto } from "../users/dtos/create-user.dto"
import { UsersService } from "../users/users.service"
import { JWT_REFRESH_CONFIG } from "./configs/jwt-refresh.config"
import { JWT_CONFIG } from "./configs/jwt.config"
import { SignInDto } from "./dtos/sign-in.dto"
import { SignUpDto } from "./dtos/sign-up.dto"

export interface SignInResponse {
  accessToken: string
}

export type SignUpResponse = Omit<User, "hashedPassword" | "refreshToken">

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  private async saveRefreshToken(id: User["id"], refreshToken: User["refreshToken"], response: Response) {
    this.setRefreshTokenInCookies(refreshToken, response)
    await this.usersService.updateRefreshToken(id, refreshToken)
  }

  private setRefreshTokenInCookies(refreshToken: User["refreshToken"], response: Response) {
    response.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: JWT_REFRESH_CONFIG.expiresInMs
    })
  }

  async signUp(signUpDto: SignUpDto): Promise<SignUpResponse> {
    const { email, password, passwordRepeat } = signUpDto
    if (password !== passwordRepeat) throw new BadRequestException("Repeated password and password don't match")

    const possibleUser = await this.usersService.getByEmail(email)
    if (possibleUser) throw new BadRequestException("This email is already taken. Try another one")

    const salt = 6
    const hashedPassword = await bcrypt.hash(password, salt)

    const createUserDto: CreateUserDto = {
      email,
      hashedPassword
    }

    return await this.usersService.create(createUserDto)
  }

  async signIn(signInDto: SignInDto, response: Response): Promise<SignInResponse> {
    const { email, password } = signInDto

    const existingUser = await this.usersService.getByEmail(email)
    if (!existingUser) throw new UnauthorizedException("Wrong email or password")

    const { hashedPassword, id } = existingUser
    if (!hashedPassword) throw new BadRequestException("This email wasn't registered via email")

    const passwordsAreSame = await bcrypt.compare(password, hashedPassword)
    if (!passwordsAreSame) throw new UnauthorizedException("Wrong email or password")

    const jwtPayload = { id }
    const accessToken = await this.jwtService.signAsync(jwtPayload, JWT_CONFIG)

    const refreshToken = await this.jwtService.signAsync(jwtPayload, {
      secret: JWT_REFRESH_CONFIG.secret,
      expiresIn: JWT_REFRESH_CONFIG.expiresIn
    })

    await this.saveRefreshToken(id, refreshToken, response)

    return { accessToken }
  }

  // async refreshToken(refreshTokenDto: RefreshTokenDto) {}
}
