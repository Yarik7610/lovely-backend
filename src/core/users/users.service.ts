import { Injectable } from "@nestjs/common"
import { User } from "@prisma/client"
import { DatabaseService } from "src/common/database/database.service"
import { CreateUserDto } from "./dto/create-user.dto"

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getById(id: string): Promise<User | null> {
    const user = await this.databaseService.user.findUnique({
      where: { id }
    })

    return user
  }

  async getByEmail(email: string): Promise<User | null> {
    const user = await this.databaseService.user.findUnique({
      where: { email }
    })

    return user
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = await this.databaseService.user.create({ data: createUserDto })

    return createdUser
  }
}
