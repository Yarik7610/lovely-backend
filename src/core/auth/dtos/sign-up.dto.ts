import { IsEmail, IsStrongPassword, MaxLength } from "class-validator"

export class SignUpDto {
  @IsEmail()
  @MaxLength(50)
  email: string

  @IsStrongPassword()
  @MaxLength(20)
  password: string

  @IsStrongPassword()
  @MaxLength(20)
  passwordRepeat: string
}
