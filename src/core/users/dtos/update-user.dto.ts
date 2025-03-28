import { Gender } from "@prisma/client"
import { IsEnum, IsInt, IsOptional, IsString } from "class-validator"

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsInt()
  @IsOptional()
  age?: number

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender

  @IsString()
  @IsOptional()
  city?: string

  @IsString()
  @IsOptional()
  bio?: string

  // @IsArray()
  // @IsString({ each: true })
  // @IsOptional()
  // interests?: string[]

  // @IsArray()
  // @MaxLength(3)
  // @IsString({ each: true })
  // @IsOptional()
  // photoUrls?: InputJsonValue
}
