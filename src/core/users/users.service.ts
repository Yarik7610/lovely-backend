import { Injectable, NotFoundException } from "@nestjs/common"
import { User } from "@prisma/client"
import { PrismaService } from "src/common/prisma/prisma.service"
import { CreateUserDto } from "./dto/create-user.dto"

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getUserById(id: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: { id }
    })

    if (!user) throw new NotFoundException("No user with such id was found")
    return user
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      where: { email }
    })

    return user
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = await this.prismaService.user.create({ data: createUserDto })
    return createdUser
  }
}
