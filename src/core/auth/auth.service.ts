import { BadRequestException, Injectable } from "@nestjs/common"
import { SignInDto } from "./dto/sign-in.dto"
import { SignUpDto } from "./dto/sign-up.dto"

@Injectable()
export class AuthService {
  signUp(signUpDto: SignUpDto) {
    const { password, passwordRepeat } = signUpDto

    if (password !== passwordRepeat) throw new BadRequestException("Repeated password and password doesn't match")
  }

  signIn(signInDto: SignInDto) {
    console.log(signInDto)
  }
}
