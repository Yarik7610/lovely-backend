import { Injectable, NotFoundException } from "@nestjs/common"
import { User } from "@prisma/client"
import { PrismaService } from "src/common/prisma/prisma.service"

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getUserById(id: string): Promise<Omit<User, "hashed_password">> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id
      },
      omit: {
        hashed_password: true
      }
    })

    if (!user) throw new NotFoundException("No user with such id was found")

    return user
  }
}
