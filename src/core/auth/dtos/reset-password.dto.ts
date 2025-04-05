import { IsJWT, IsStrongPassword, MaxLength } from "class-validator"

export class ResetPasswordDto {
  @IsJWT()
  passwordResetToken: string

  @IsStrongPassword()
  @MaxLength(20)
  newPassword: string

  @IsStrongPassword()
  @MaxLength(20)
  newPasswordRepeat: string
}
