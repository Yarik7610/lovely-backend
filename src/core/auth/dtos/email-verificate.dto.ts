import { IsJWT } from "class-validator"

export class EmailVerificateDto {
  @IsJWT()
  emailVerificateToken: string
}
