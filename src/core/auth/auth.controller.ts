import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from "@nestjs/common"
import { RefreshToken } from "@prisma/client"
import type { Request, Response } from "express"
import { AuthService } from "./auth.service"
import { SignInDto } from "./dtos/sign-in.dto"
import { SignUpDto } from "./dtos/sign-up.dto"
import { TokensService } from "./tokens.service"

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokensService: TokensService
  ) {}

  @Post("sign-up")
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto)
  }

  @Post("sign-in")
  @HttpCode(HttpStatus.OK)
  signIn(@Body() signInDto: SignInDto, @Res({ passthrough: true }) response: Response) {
    return this.authService.signIn(signInDto, response)
  }

  @Post("refresh-token")
  refreshToken(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const oldRefreshToken = request.cookies["refreshToken"] as RefreshToken["token"] | undefined
    return this.tokensService.refresh(oldRefreshToken, response)
  }
}
