import { IsEmail, MaxLength } from "class-validator"

export class SignInDto {
  @IsEmail()
  @MaxLength(50)
  email: string

  password: string
}
