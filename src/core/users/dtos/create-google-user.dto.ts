import { IsEmail, MaxLength } from "class-validator"

export class CreateGoogleUserDto {
  @IsEmail()
  @MaxLength(50)
  email: string

  oauthId: string
  name: string
}
