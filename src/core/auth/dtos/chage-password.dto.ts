import { IsStrongPassword, MaxLength } from "class-validator"

export class ChangePasswordDto {
  oldPassword: string

  @IsStrongPassword()
  @MaxLength(20)
  newPassword: string

  @IsStrongPassword()
  @MaxLength(20)
  newPasswordRepeat: string
}
