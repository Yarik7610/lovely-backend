import { IsEmail, MaxLength } from "class-validator"

export class ChangeEmailDto {
  @IsEmail()
  @MaxLength(50)
  newEmail: string
}
