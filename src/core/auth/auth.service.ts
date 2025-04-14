import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common"
import { User } from "@prisma/client"
import * as bcrypt from "bcrypt"
import type { Response } from "express"
import { CreateUserDto } from "../users/dtos"
import { UsersService } from "../users/users.service"
import { BCRYPT_CONFIG } from "./configs"
import {
  ChangeEmailDto,
  ChangePasswordDto,
  EmailVerificateDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SignInDto,
  SignUpDto
} from "./dtos"
import { EmailService, TokensService } from "./services"

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

    const user = await this.usersService.getUserByEmail(email)
    if (user) throw new BadRequestException("This email is already taken. Try another one")

    const hashedPassword = await bcrypt.hash(password, BCRYPT_CONFIG.salt)

    const createUserDto: CreateUserDto = {
      email,
      hashedPassword
    }

    const existingUser = await this.usersService.getUserByEmail(createUserDto.email)
    if (existingUser) throw new BadRequestException("User with such email already exists")

    return await this.usersService.createUser(createUserDto)
  }

  async signIn(signInDto: SignInDto, response: Response) {
    const { email, password } = signInDto

    const user = await this.usersService.getUserByEmail(email)
    if (!user) throw new BadRequestException("Wrong email or password")

    const { hashedPassword, id } = user
    if (!hashedPassword) throw new BadRequestException("This email wasn't registered via email")

    const passwordsAreSame = await bcrypt.compare(password, hashedPassword)
    if (!passwordsAreSame) throw new UnauthorizedException("Wrong email or password")

    const accessToken = await this.tokensService.generateAccessToken({ id })
    const refreshToken = await this.tokensService.generateRefreshToken({ id })
    await this.tokensService.storeRefreshToken(id, refreshToken, response)

    if (!user.emailVerified) {
      const emailVerificateToken = await this.tokensService.generateEmailVerificateToken({ email })
      await this.tokensService.storeEmailVerificateToken(email, emailVerificateToken)
      await this.emailService.sendEmailVerificateLink(email, emailVerificateToken)
    }

    return { accessToken }
  }

  async signOut(id: User["id"], response: Response) {
    const user = await this.usersService.getUserById(id)
    if (!user) throw new NotFoundException("User wasn't found")

    const { oauthId, hashedPassword } = user

    if (hashedPassword && !oauthId) await this.tokensService.removeRefreshToken(id, response)
    else {
      //TODO: oauth signout
    }
  }

  async verificateEmail(emailVerificateDto: EmailVerificateDto) {
    const { emailVerificateToken } = emailVerificateDto

    const { email } = await this.tokensService.verifyEmailVerificateToken(emailVerificateToken)

    const user = await this.usersService.getUserByEmail(email)
    if (!user) throw new NotFoundException("User wasn't found")

    const { id, hashedPassword, oauthId } = user

    if (!hashedPassword || oauthId)
      throw new BadRequestException("Can't verificate email because account wasn't registered with email provider")

    await this.usersService.verificateUserEmail(id)
  }

  async changeEmail(userId: User["id"], changeEmailDto: ChangeEmailDto) {
    const { newEmail } = changeEmailDto

    const user = await this.usersService.getUserById(userId)
    if (!user) throw new NotFoundException("User wasn't found")

    const { email, hashedPassword, oauthId, emailVerified } = user

    if (!hashedPassword || oauthId)
      throw new BadRequestException("Can't change email because account wasn't registered with email provider")

    if (email === newEmail) throw new BadRequestException("Can't change same old and new email")

    if (!emailVerified) {
      const emailVerificateToken = await this.tokensService.generateEmailVerificateToken({ email })
      await this.tokensService.storeEmailVerificateToken(email, emailVerificateToken)
      await this.emailService.sendEmailVerificateLink(email, emailVerificateToken)
      throw new BadRequestException("Verify your current email first. Verification link was sent on it")
    }

    const newEmailUser = await this.usersService.getUserByEmail(newEmail)
    if (newEmailUser) throw new BadRequestException("This email is already taken. Choose another one")

    const newEmailVerificateToken = await this.tokensService.generateEmailVerificateToken({ email: newEmail })
    await this.tokensService.storeEmailVerificateToken(newEmail, newEmailVerificateToken)
    await this.emailService.sendEmailVerificateLink(newEmail, newEmailVerificateToken)

    await this.usersService.updateUserEmail(userId, newEmail)

    return { message: "Email changed successfully. New verificate link was sent on the new email" }
  }

  async changePassword(userId: User["id"], changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword, newPasswordRepeat } = changePasswordDto

    const user = await this.usersService.getUserById(userId)
    if (!user) throw new NotFoundException("User wasn't found")

    const { id, hashedPassword, oauthId } = user

    if (!hashedPassword || oauthId)
      throw new BadRequestException("Can't change password because account wasn't registered with email provider")

    if (newPassword !== newPasswordRepeat)
      throw new BadRequestException("Repeated new password and new password don't match")

    const oldPasswordsMatch = await bcrypt.compare(oldPassword, hashedPassword)
    if (!oldPasswordsMatch) throw new BadRequestException("Wrong old password")

    const newHashedPassword = await bcrypt.hash(newPassword, BCRYPT_CONFIG.salt)
    await this.usersService.updateUserPassword(id, newHashedPassword)
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto

    const user = await this.usersService.getUserByEmail(email)
    if (!user) throw new BadRequestException("User with such email doesn't exist")

    if (!user.hashedPassword || user.oauthId)
      throw new BadRequestException("Can't change password because account wasn't registered with email provider")

    const passwordResetToken = await this.tokensService.generatePasswordResetToken({ email: user.email })
    await this.tokensService.storePasswordResetToken(user.email, passwordResetToken)

    await this.emailService.sendPasswordResetLink(user.email, passwordResetToken)
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { passwordResetToken, newPassword, newPasswordRepeat } = resetPasswordDto

    if (newPassword !== newPasswordRepeat)
      throw new BadRequestException("New password and new password repeat don't match")

    const { email } = await this.tokensService.verifyPasswordResetToken(passwordResetToken)

    const user = await this.usersService.getUserByEmail(email)
    if (!user) throw new NotFoundException("User wasn't found")

    const { id, hashedPassword, oauthId } = user

    if (!hashedPassword || oauthId)
      throw new BadRequestException("Can't reset password because account wasn't registered with email provider")

    const newHashedPassword = await bcrypt.hash(newPassword, BCRYPT_CONFIG.salt)
    await this.usersService.updateUserPassword(id, newHashedPassword)
  }
}
