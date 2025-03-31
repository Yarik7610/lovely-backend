import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common"
import { User } from "@prisma/client"
import { UsersService } from "./users.service"

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(":id")
  getUserProfile(@Param("id", ParseUUIDPipe) id: User["id"]) {
    return this.usersService.getUserProfile(id)
  }
}
