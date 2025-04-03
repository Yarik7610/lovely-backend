import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common"
import { User } from "@prisma/client"
import * as bcrypt from "bcrypt"
import type { Response } from "express"
import { CreateUserDto } from "../users/dtos/create-user.dto"
import { UsersService } from "../users/users.service"
import { ChangePasswordDto } from "./dtos/chage-password.dto"
import { ForgotPasswordDto } from "./dtos/forgot-password.dto"
import { SignInDto } from "./dtos/sign-in.dto"
import { SignUpDto } from "./dtos/sign-up.dto"
import { EmailService } from "./email.service"
import { TokensService } from "./tokens.service"

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
    private readonly emailService: EmailService
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const { email, password, passwordRepeat } = signUpDto
    if (password !== passwordRepeat) throw new BadRequestException("Repeated password and password don't match")

    const possibleUser = await this.usersService.getUserByEmail(email)
    if (possibleUser) throw new BadRequestException("This email is already taken. Try another one")

    const salt = 6
    const hashedPassword = await bcrypt.hash(password, salt)

    const createUserDto: CreateUserDto = {
      email,
      hashedPassword
    }

    return await this.usersService.createUser(createUserDto)
  }

  async signIn(signInDto: SignInDto, response: Response) {
    const { email, password } = signInDto

    const existingUser = await this.usersService.getUserByEmail(email)
    if (!existingUser) throw new UnauthorizedException("Wrong email or password")

    const { hashedPassword, id } = existingUser
    if (!hashedPassword) throw new BadRequestException("This email wasn't registered via email")

    const passwordsAreSame = await bcrypt.compare(password, hashedPassword)
    if (!passwordsAreSame) throw new UnauthorizedException("Wrong email or password")

    const accessToken = await this.tokensService.generateAccessToken({ id })
    const refreshToken = await this.tokensService.generateRefreshToken({ id })
    await this.tokensService.storeRefreshToken(id, refreshToken, response)

    return { accessToken }
  }

  async changePassword(userId: User["id"], changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword, newPasswordRepeat } = changePasswordDto

    const user = await this.usersService.getUserById(userId)
    if (!user) throw new NotFoundException("User wasn't found")

    const { id, hashedPassword, oauthId } = user

    if (!hashedPassword || oauthId)
      throw new BadRequestException("Can't change password because account wasn't registered with email")

    if (newPassword !== newPasswordRepeat)
      throw new BadRequestException("Repeated new password and new password don't match")

    const oldPasswordsMatch = await bcrypt.compare(oldPassword, hashedPassword)
    if (!oldPasswordsMatch) throw new BadRequestException("Wrong old password")

    const salt = 6
    const newHashedPassword = await bcrypt.hash(newPassword, salt)

    await this.usersService.updateUserPassword(id, newHashedPassword)
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto

    const existingUser = await this.usersService.getUserByEmail(email)
    if (!existingUser) throw new BadRequestException("User with such email doesn't exist")

    const passwordResetToken = await this.tokensService.generatePasswordResetToken({ email: existingUser.email })
    await this.tokensService.storeResetPasswordToken(email, passwordResetToken)

    await this.emailService.sendResetPasswordLink(email, passwordResetToken)
  }
}
