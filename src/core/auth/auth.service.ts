import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common"
import { User } from "@prisma/client"
import * as bcrypt from "bcrypt"
import type { Response } from "express"
import { CreateUserDto } from "../users/dtos/create-user.dto"
import { UsersService } from "../users/users.service"
import { SignInDto } from "./dtos/sign-in.dto"
import { SignUpDto } from "./dtos/sign-up.dto"
import { TokensService } from "./tokens.service"

export interface SignInResponse {
  accessToken: string
}

export type SignUpResponse = Omit<User, "hashedPassword" | "refreshToken">

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService
  ) {}

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
    const accessToken = await this.tokensService.generateAccessToken(jwtPayload)

    const refreshToken = await this.tokensService.generateRefreshToken(jwtPayload)

    await this.tokensService.storeRefreshToken(id, refreshToken, response)

    return { accessToken }
  }
}
