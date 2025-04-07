import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from "@nestjs/common"
import { RefreshToken } from "@prisma/client"
import type { Request, Response } from "express"
import { Public } from "src/common/decorators/public.decorator"
import { User } from "src/common/decorators/user.decorator"
import { AuthService } from "./auth.service"
import { ChangePasswordDto } from "./dtos/chage-password.dto"
import { ChangeEmailDto } from "./dtos/change-email.dto"
import { EmailVerificateDto } from "./dtos/email-verificate.dto"
import { ForgotPasswordDto } from "./dtos/forgot-password.dto"
import { ResetPasswordDto } from "./dtos/reset-password.dto"
import { SignInDto } from "./dtos/sign-in.dto"
import { SignUpDto } from "./dtos/sign-up.dto"
import { TokensService } from "./tokens.service"
import { JwtUserPayload } from "./types/jwt-payloads"

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokensService: TokensService
  ) {}

  @Post("sign-up")
  @Public()
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto)
  }

  @Post("sign-in")
  @Public()
  @HttpCode(HttpStatus.OK)
  signIn(@Body() signInDto: SignInDto, @Res({ passthrough: true }) response: Response) {
    return this.authService.signIn(signInDto, response)
  }

  @Post("refresh-token")
  @Public()
  refreshToken(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const oldRefreshToken = request.cookies["refreshToken"] as RefreshToken["token"] | undefined
    return this.tokensService.refreshOldRefreshToken(oldRefreshToken, response)
  }

  @Post("verificate-email")
  @Public()
  @HttpCode(HttpStatus.OK)
  verificateEmail(@Body() emailVerificateDto: EmailVerificateDto) {
    return this.authService.verificateEmail(emailVerificateDto)
  }

  @Post("change-email")
  @HttpCode(HttpStatus.OK)
  changeEmail(@Body() changeEmailDto: ChangeEmailDto, @User() user: JwtUserPayload) {
    const { id } = user

    return this.authService.changeEmail(id, changeEmailDto)
  }

  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  changePassword(@Body() changePasswordDto: ChangePasswordDto, @User() user: JwtUserPayload) {
    const { id } = user

    return this.authService.changePassword(id, changePasswordDto)
  }

  @Post("forgot-password")
  @Public()
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto)
  }

  @Post("reset-password")
  @Public()
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto)
  }

  @Post("sign-out")
  @HttpCode(HttpStatus.OK)
  signOut(@User() user: JwtUserPayload, @Res({ passthrough: true }) response: Response) {
    const { id } = user

    return this.authService.signOut(id, response)
  }
}
