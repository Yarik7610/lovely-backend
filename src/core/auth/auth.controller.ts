import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from "@nestjs/common"
import { RefreshToken } from "@prisma/client"
import type { Request, Response } from "express"
import { Public } from "src/common/decorators/public.decorator"
import { User } from "src/common/decorators/user.decorator"
import { AuthService } from "./auth.service"
import { ChangePasswordDto } from "./dtos/chage-password.dto"
import { SignInDto } from "./dtos/sign-in.dto"
import { SignUpDto } from "./dtos/sign-up.dto"
import { TokensService } from "./tokens.service"
import { JwtPayload } from "./types/jwt-payload"

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
    return this.tokensService.refresh(oldRefreshToken, response)
  }

  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  changePassword(@Body() changePasswordDto: ChangePasswordDto, @User() user: JwtPayload) {
    const { id } = user

    return this.authService.changePassword(id, changePasswordDto)
  }
}
