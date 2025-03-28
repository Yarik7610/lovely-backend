import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { User } from "@prisma/client"
import { DatabaseService } from "src/common/database/database.service"
import { CreateUserDto } from "./dtos/create-user.dto"

export type CreateUserResponse = Omit<User, "hashedPassword" | "refreshToken">
export type UpdateUserResponse = CreateUserResponse

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  //Non-controller method
  async updateRefreshToken(id: User["id"], refreshToken: User["refreshToken"]) {
    const existingUser = await this.getById(id)
    if (!existingUser) throw new NotFoundException("User not found")

    await this.databaseService.user.update({
      where: { id },
      data: { refreshToken },
      omit: {
        hashedPassword: true,
        refreshToken: true
      }
    })
  }

  //Non-controller method
  async getById(id: User["id"]): Promise<User | null> {
    return await this.databaseService.user.findUnique({
      where: { id }
    })
  }

  //Non-controller method
  async getByEmail(email: User["email"]): Promise<User | null> {
    return await this.databaseService.user.findUnique({
      where: { email }
    })
  }

  async create(createUserDto: CreateUserDto): Promise<CreateUserResponse> {
    const existingUser = await this.getByEmail(createUserDto.email)
    if (existingUser) throw new BadRequestException("User already exists")

    return await this.databaseService.user.create({
      data: createUserDto,
      omit: {
        hashedPassword: true,
        refreshToken: true
      }
    })
  }
}
