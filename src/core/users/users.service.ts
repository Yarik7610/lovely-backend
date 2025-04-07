import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { User } from "@prisma/client"
import { DatabaseService } from "src/common/database/database.service"
import { CreateUserDto } from "./dtos/create-user.dto"

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getUserById(id: User["id"]) {
    return await this.databaseService.user.findUnique({
      where: { id }
    })
  }

  async getUserByEmail(email: User["email"]) {
    return await this.databaseService.user.findUnique({
      where: { email }
    })
  }

  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.getUserByEmail(createUserDto.email)
    if (existingUser) throw new BadRequestException("User already exists")

    return await this.databaseService.user.create({
      data: createUserDto,
      omit: {
        hashedPassword: true
      }
    })
  }

  async updateUserPassword(id: User["id"], newHashedPassword: User["hashedPassword"]) {
    await this.databaseService.user.update({
      where: { id },
      data: {
        hashedPassword: newHashedPassword
      }
    })
  }

  async updateUserEmail(id: User["id"], newEmail: User["email"]) {
    await this.databaseService.user.update({
      where: { id },
      data: {
        email: newEmail,
        emailVerified: false
      }
    })
  }

  async verificateUserEmail(id: User["id"]) {
    await this.databaseService.user.update({
      where: { id },
      data: {
        emailVerified: true
      }
    })
  }

  async getUserProfile(id: User["id"]) {
    const existingUser = await this.databaseService.user.findUnique({
      where: { id },
      select: {
        name: true,
        age: true,
        gender: true,
        city: true,
        bio: true,
        interests: true,
        photoUrls: true
      }
    })

    if (!existingUser) throw new NotFoundException("User's profile wasn't found")

    return existingUser
  }
}
