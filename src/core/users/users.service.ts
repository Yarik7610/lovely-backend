import { BadRequestException, Injectable } from "@nestjs/common"
import { User } from "@prisma/client"
import { DatabaseService } from "src/common/database/database.service"
import { CreateUserDto } from "./dtos/create-user.dto"

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  //Non-controller method
  async getById(id: User["id"]) {
    return await this.databaseService.user.findUnique({
      where: { id }
    })
  }

  //Non-controller method
  async getByEmail(email: User["email"]) {
    return await this.databaseService.user.findUnique({
      where: { email }
    })
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.getByEmail(createUserDto.email)
    if (existingUser) throw new BadRequestException("User already exists")

    return await this.databaseService.user.create({
      data: createUserDto,
      omit: {
        hashedPassword: true
      }
    })
  }
}
