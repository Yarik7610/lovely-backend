import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { User } from "@prisma/client"
import * as bcrypt from "bcrypt"
import { CreateUserDto } from "../users/dto/create-user.dto"
import { UsersService } from "../users/users.service"
import { SignInDto } from "./dto/sign-in.dto"
import { SignUpDto } from "./dto/sign-up.dto"

export interface SignInResult {
  accessToken: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<User> {
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

    const createdUser = await this.usersService.create(createUserDto)
    return createdUser
  }

  async signIn(signInDto: SignInDto): Promise<SignInResult> {
    const { email, password } = signInDto

    const existingUser = await this.usersService.getByEmail(email)
    if (!existingUser) throw new UnauthorizedException("Wrong email or password")

    const { hashedPassword, id } = existingUser
    if (!hashedPassword) throw new BadRequestException("This email wasn't registered via email")

    const passwordsAreSame = await bcrypt.compare(password, hashedPassword)
    if (!passwordsAreSame) throw new UnauthorizedException("Wrong email or password")

    const jwtPayload = { id }
    const accessToken = await this.jwtService.signAsync(jwtPayload)

    return { accessToken }
  }
}
